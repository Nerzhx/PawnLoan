#![no_std]
//! # PawnLoan — collateralized pawn-loan escrow on Stellar
//!
//! PawnLoan is a peer-to-peer lending protocol implemented as a Soroban smart
//! contract. A borrower locks a token as **collateral** and requests a loan of
//! another token. A lender funds the request; the principal is transferred to
//! the borrower and the collateral stays escrowed in the contract. The borrower
//! repays principal + fixed interest before the due time to reclaim the
//! collateral, otherwise the lender may liquidate and seize it.
//!
//! Every value transfer is a real on-chain SEP-41 token movement performed by
//! the contract, so the escrow is trustless: neither party custodies the other's
//! assets at any point.
//!
//! ## Lifecycle
//!
//! ```text
//!  request_loan ─▶ Pending ─fund_loan─▶ Funded ─repay─▶ Repaid
//!                     │                    │
//!                  cancel             liquidate (after due_time)
//!                     ▼                    ▼
//!                 Cancelled            Defaulted
//! ```

mod error;
mod types;

#[cfg(test)]
mod test;

pub use error::Error;
pub use types::{DataKey, Loan, LoanStatus};

use soroban_sdk::{contract, contractimpl, token, Address, Env, Vec};

/// Interest rates above 100% (10 000 bps) are rejected as almost certainly a
/// mistake. This is a sanity bound, not a usury policy.
const MAX_INTEREST_BPS: u32 = 10_000;

/// Persistent loan entries live ~30 days between accesses before they can be
/// evicted; each state transition bumps the TTL.
const LOAN_BUMP_AMOUNT: u32 = 518_400; // ~30 days of ledgers at 5s
const LOAN_LIFETIME_THRESHOLD: u32 = 518_400 - 17_280; // bump when < ~29 days left

#[contract]
pub struct PawnLoanContract;

#[contractimpl]
impl PawnLoanContract {
    /// Initialize the contract with an administrator. Callable exactly once.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::LoanCount, &0u64);
        Ok(())
    }

    /// Create a loan request. The borrower must authorize the call and have
    /// approved the contract to move `collateral_amount` of `collateral_token`,
    /// which is escrowed immediately.
    ///
    /// Returns the new loan id.
    // Each parameter is a distinct on-chain loan term; grouping them into a
    // struct would only obscure the contract ABI the frontend calls against.
    #[allow(clippy::too_many_arguments)]
    pub fn request_loan(
        env: Env,
        borrower: Address,
        collateral_token: Address,
        collateral_amount: i128,
        loan_token: Address,
        principal: i128,
        interest_rate_bps: u32,
        duration: u64,
    ) -> Result<u64, Error> {
        borrower.require_auth();

        if collateral_amount <= 0 || principal <= 0 {
            return Err(Error::InvalidAmount);
        }
        if duration == 0 {
            return Err(Error::InvalidDuration);
        }
        if interest_rate_bps > MAX_INTEREST_BPS {
            return Err(Error::InvalidInterestRate);
        }

        let admin_exists = env.storage().instance().has(&DataKey::Admin);
        if !admin_exists {
            return Err(Error::NotInitialized);
        }

        // Escrow the collateral into the contract.
        let collateral = token::Client::new(&env, &collateral_token);
        collateral.transfer(
            &borrower,
            &env.current_contract_address(),
            &collateral_amount,
        );

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::LoanCount)
            .unwrap_or(0);
        let next = id + 1;

        let loan = Loan {
            id: next,
            borrower: borrower.clone(),
            lender: None,
            collateral_token,
            collateral_amount,
            loan_token,
            principal,
            interest_rate_bps,
            duration,
            start_time: 0,
            due_time: 0,
            status: LoanStatus::Pending,
        };

        Self::save_loan(&env, &loan);
        env.storage().instance().set(&DataKey::LoanCount, &next);

        env.events().publish(
            (soroban_sdk::symbol_short!("requested"), next),
            (borrower, principal),
        );
        Ok(next)
    }

    /// Fund a pending loan. The lender authorizes the call and must have
    /// approved the contract to move `principal` of the loan token, which is
    /// transferred straight to the borrower. The loan becomes `Funded` and the
    /// repayment clock starts.
    pub fn fund_loan(env: Env, lender: Address, loan_id: u64) -> Result<(), Error> {
        lender.require_auth();

        let mut loan = Self::load_loan(&env, loan_id)?;
        if loan.status != LoanStatus::Pending {
            return Err(Error::LoanNotPending);
        }
        if loan.borrower == lender {
            return Err(Error::SelfFunding);
        }

        // Principal flows lender -> borrower.
        let loan_token = token::Client::new(&env, &loan.loan_token);
        loan_token.transfer(&lender, &loan.borrower, &loan.principal);

        let now = env.ledger().timestamp();
        loan.lender = Some(lender.clone());
        loan.start_time = now;
        loan.due_time = now + loan.duration;
        loan.status = LoanStatus::Funded;
        Self::save_loan(&env, &loan);

        env.events().publish(
            (soroban_sdk::symbol_short!("funded"), loan_id),
            (lender, loan.due_time),
        );
        Ok(())
    }

    /// Repay a funded loan. The borrower authorizes the call and must have
    /// approved the contract to move principal + interest of the loan token,
    /// which is sent to the lender. The escrowed collateral is returned to the
    /// borrower and the loan becomes `Repaid`.
    ///
    /// Repayment is allowed even slightly after the due time as long as the
    /// lender has not already liquidated — this favors the borrower on honest
    /// timing races.
    pub fn repay(env: Env, loan_id: u64) -> Result<(), Error> {
        let mut loan = Self::load_loan(&env, loan_id)?;
        if loan.status != LoanStatus::Funded {
            return Err(Error::LoanNotFunded);
        }
        loan.borrower.require_auth();

        let lender = loan.lender.clone().ok_or(Error::LoanNotFunded)?;
        let total_due = Self::amount_due(&loan);

        // Borrower repays principal + interest to the lender.
        let loan_token = token::Client::new(&env, &loan.loan_token);
        loan_token.transfer(&loan.borrower, &lender, &total_due);

        // Contract releases collateral back to the borrower.
        let collateral = token::Client::new(&env, &loan.collateral_token);
        collateral.transfer(
            &env.current_contract_address(),
            &loan.borrower,
            &loan.collateral_amount,
        );

        loan.status = LoanStatus::Repaid;
        Self::save_loan(&env, &loan);

        env.events().publish(
            (soroban_sdk::symbol_short!("repaid"), loan_id),
            (loan.borrower.clone(), total_due),
        );
        Ok(())
    }

    /// Liquidate a funded loan whose due time has passed. The lender authorizes
    /// the call and receives the escrowed collateral. The loan becomes
    /// `Defaulted`.
    pub fn liquidate(env: Env, loan_id: u64) -> Result<(), Error> {
        let mut loan = Self::load_loan(&env, loan_id)?;
        if loan.status != LoanStatus::Funded {
            return Err(Error::LoanNotFunded);
        }
        let lender = loan.lender.clone().ok_or(Error::LoanNotFunded)?;
        lender.require_auth();

        if env.ledger().timestamp() < loan.due_time {
            return Err(Error::NotDueYet);
        }

        // Defaulted collateral flows to the lender.
        let collateral = token::Client::new(&env, &loan.collateral_token);
        collateral.transfer(
            &env.current_contract_address(),
            &lender,
            &loan.collateral_amount,
        );

        loan.status = LoanStatus::Defaulted;
        Self::save_loan(&env, &loan);

        env.events().publish(
            (soroban_sdk::symbol_short!("liquidatd"), loan_id),
            (lender, loan.collateral_amount),
        );
        Ok(())
    }

    /// Cancel a pending (unfunded) loan request. Only the borrower may cancel,
    /// and the escrowed collateral is returned. The loan becomes `Cancelled`.
    pub fn cancel(env: Env, loan_id: u64) -> Result<(), Error> {
        let mut loan = Self::load_loan(&env, loan_id)?;
        if loan.status != LoanStatus::Pending {
            return Err(Error::LoanNotPending);
        }
        loan.borrower.require_auth();

        let collateral = token::Client::new(&env, &loan.collateral_token);
        collateral.transfer(
            &env.current_contract_address(),
            &loan.borrower,
            &loan.collateral_amount,
        );

        loan.status = LoanStatus::Cancelled;
        Self::save_loan(&env, &loan);

        env.events().publish(
            (soroban_sdk::symbol_short!("cancelled"), loan_id),
            loan.borrower.clone(),
        );
        Ok(())
    }

    // ----- read-only views -----

    /// Fetch a single loan by id.
    pub fn get_loan(env: Env, loan_id: u64) -> Result<Loan, Error> {
        Self::load_loan(&env, loan_id)
    }

    /// Total number of loans ever created (also the highest loan id).
    pub fn loan_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::LoanCount)
            .unwrap_or(0)
    }

    /// Total amount currently owed on a funded loan (principal + interest).
    /// Returns `InvalidAmount`-free view of the fixed repayment.
    pub fn amount_owed(env: Env, loan_id: u64) -> Result<i128, Error> {
        let loan = Self::load_loan(&env, loan_id)?;
        Ok(Self::amount_due(&loan))
    }

    /// Return every loan belonging to `borrower`.
    pub fn loans_of_borrower(env: Env, borrower: Address) -> Vec<Loan> {
        let count = Self::loan_count(env.clone());
        let mut out = Vec::new(&env);
        for id in 1..=count {
            if let Ok(loan) = Self::load_loan(&env, id) {
                if loan.borrower == borrower {
                    out.push_back(loan);
                }
            }
        }
        out
    }

    /// The contract administrator.
    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    // ----- internal helpers -----

    /// Fixed interest is `principal * rate_bps / 10_000`, computed with i128 to
    /// avoid overflow on realistic amounts.
    fn amount_due(loan: &Loan) -> i128 {
        let interest = loan
            .principal
            .saturating_mul(loan.interest_rate_bps as i128)
            / 10_000;
        loan.principal + interest
    }

    fn save_loan(env: &Env, loan: &Loan) {
        let key = DataKey::Loan(loan.id);
        env.storage().persistent().set(&key, loan);
        env.storage()
            .persistent()
            .extend_ttl(&key, LOAN_LIFETIME_THRESHOLD, LOAN_BUMP_AMOUNT);
    }

    fn load_loan(env: &Env, loan_id: u64) -> Result<Loan, Error> {
        let key = DataKey::Loan(loan_id);
        let loan: Loan = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::LoanNotFound)?;
        env.storage()
            .persistent()
            .extend_ttl(&key, LOAN_LIFETIME_THRESHOLD, LOAN_BUMP_AMOUNT);
        Ok(loan)
    }
}
