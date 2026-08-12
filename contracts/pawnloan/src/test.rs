#![cfg(test)]
extern crate std;

use crate::{Error, LoanStatus, PawnLoanContract, PawnLoanContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

/// Deploys a Stellar Asset Contract we can use as a SEP-41 token, returning both
/// the user-facing token client and its admin (mint) client.
fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (
        token::Client::new(env, &addr),
        token::StellarAssetClient::new(env, &addr),
    )
}

struct Fixture<'a> {
    env: Env,
    client: PawnLoanContractClient<'a>,
    borrower: Address,
    lender: Address,
    collateral: token::Client<'a>,
    collateral_admin: token::StellarAssetClient<'a>,
    usd: token::Client<'a>,
    usd_admin: token::StellarAssetClient<'a>,
}

fn setup<'a>() -> Fixture<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(PawnLoanContract, ());
    let client = PawnLoanContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let borrower = Address::generate(&env);
    let lender = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (collateral, collateral_admin) = create_token(&env, &token_admin);
    let (usd, usd_admin) = create_token(&env, &token_admin);

    // Borrower holds collateral; lender holds USD to lend.
    collateral_admin.mint(&borrower, &1_000);
    usd_admin.mint(&lender, &1_000);

    Fixture {
        env,
        client,
        borrower,
        lender,
        collateral,
        collateral_admin,
        usd,
        usd_admin,
    }
}

/// Standard request: 500 collateral for a 100 USD loan at 10% for 7 days.
fn request_standard(f: &Fixture) -> u64 {
    f.client.request_loan(
        &f.borrower,
        &f.collateral.address,
        &500,
        &f.usd.address,
        &100,
        &1_000, // 10.00%
        &(7 * 24 * 60 * 60),
    )
}

#[test]
fn initialize_sets_admin_and_is_idempotent_guarded() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PawnLoanContract, ());
    let client = PawnLoanContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);
    assert_eq!(client.admin(), admin);

    let err = client.try_initialize(&admin).err().unwrap().unwrap();
    assert_eq!(err, Error::AlreadyInitialized);
}

#[test]
fn request_loan_escrows_collateral() {
    let f = setup();
    let id = request_standard(&f);
    assert_eq!(id, 1);
    assert_eq!(f.client.loan_count(), 1);

    // Collateral left the borrower and now sits in the contract.
    assert_eq!(f.collateral.balance(&f.borrower), 500);
    assert_eq!(f.collateral.balance(&f.client.address), 500);

    let loan = f.client.get_loan(&id);
    assert_eq!(loan.status, LoanStatus::Pending);
    assert_eq!(loan.principal, 100);
    assert_eq!(loan.lender, None);
}

#[test]
fn full_happy_path_request_fund_repay() {
    let f = setup();
    let id = request_standard(&f);

    // Fund: principal moves lender -> borrower.
    f.client.fund_loan(&f.lender, &id);
    assert_eq!(f.usd.balance(&f.borrower), 100);
    assert_eq!(f.usd.balance(&f.lender), 900);

    let loan = f.client.get_loan(&id);
    assert_eq!(loan.status, LoanStatus::Funded);
    assert_eq!(loan.lender, Some(f.lender.clone()));

    // 100 principal + 10% interest = 110 owed.
    assert_eq!(f.client.amount_owed(&id), 110);

    // Give the borrower enough USD to cover interest, then repay.
    f.usd_admin.mint(&f.borrower, &10);
    f.client.repay(&id);

    // Lender got principal + interest back; borrower reclaimed collateral.
    assert_eq!(f.usd.balance(&f.lender), 1_010);
    assert_eq!(f.collateral.balance(&f.borrower), 1_000);
    assert_eq!(f.collateral.balance(&f.client.address), 0);
    assert_eq!(f.client.get_loan(&id).status, LoanStatus::Repaid);
}

#[test]
fn liquidate_after_due_transfers_collateral_to_lender() {
    let f = setup();
    let id = request_standard(&f);
    f.client.fund_loan(&f.lender, &id);

    // Advance the ledger clock past the due time.
    f.env.ledger().with_mut(|l| {
        l.timestamp += 7 * 24 * 60 * 60 + 1;
    });

    f.client.liquidate(&id);
    assert_eq!(f.collateral.balance(&f.lender), 500);
    assert_eq!(f.collateral.balance(&f.client.address), 0);
    assert_eq!(f.client.get_loan(&id).status, LoanStatus::Defaulted);
}

#[test]
fn liquidate_before_due_is_rejected() {
    let f = setup();
    let id = request_standard(&f);
    f.client.fund_loan(&f.lender, &id);

    let err = f.client.try_liquidate(&id).err().unwrap().unwrap();
    assert_eq!(err, Error::NotDueYet);
    assert_eq!(f.client.get_loan(&id).status, LoanStatus::Funded);
}

#[test]
fn cancel_returns_collateral() {
    let f = setup();
    let id = request_standard(&f);
    f.client.cancel(&id);

    assert_eq!(f.collateral.balance(&f.borrower), 1_000);
    assert_eq!(f.collateral.balance(&f.client.address), 0);
    assert_eq!(f.client.get_loan(&id).status, LoanStatus::Cancelled);
}

#[test]
fn cannot_fund_own_loan() {
    let f = setup();
    let id = request_standard(&f);
    let err = f
        .client
        .try_fund_loan(&f.borrower, &id)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::SelfFunding);
}

#[test]
fn cannot_fund_twice() {
    let f = setup();
    let id = request_standard(&f);
    f.client.fund_loan(&f.lender, &id);
    let err = f
        .client
        .try_fund_loan(&f.lender, &id)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::LoanNotPending);
}

#[test]
fn cannot_repay_unfunded_loan() {
    let f = setup();
    let id = request_standard(&f);
    let err = f.client.try_repay(&id).err().unwrap().unwrap();
    assert_eq!(err, Error::LoanNotFunded);
}

#[test]
fn cannot_cancel_funded_loan() {
    let f = setup();
    let id = request_standard(&f);
    f.client.fund_loan(&f.lender, &id);
    let err = f.client.try_cancel(&id).err().unwrap().unwrap();
    assert_eq!(err, Error::LoanNotPending);
}

#[test]
fn rejects_zero_amounts_and_duration() {
    let f = setup();

    let bad_collateral = f.client.try_request_loan(
        &f.borrower,
        &f.collateral.address,
        &0,
        &f.usd.address,
        &100,
        &1_000,
        &100,
    );
    assert_eq!(bad_collateral.err().unwrap().unwrap(), Error::InvalidAmount);

    let bad_duration = f.client.try_request_loan(
        &f.borrower,
        &f.collateral.address,
        &500,
        &f.usd.address,
        &100,
        &1_000,
        &0,
    );
    assert_eq!(bad_duration.err().unwrap().unwrap(), Error::InvalidDuration);

    let bad_rate = f.client.try_request_loan(
        &f.borrower,
        &f.collateral.address,
        &500,
        &f.usd.address,
        &100,
        &10_001,
        &100,
    );
    assert_eq!(bad_rate.err().unwrap().unwrap(), Error::InvalidInterestRate);
}

#[test]
fn unknown_loan_is_not_found() {
    let f = setup();
    let err = f.client.try_get_loan(&42).err().unwrap().unwrap();
    assert_eq!(err, Error::LoanNotFound);
}

#[test]
fn loans_of_borrower_filters_correctly() {
    let f = setup();
    request_standard(&f);
    request_standard(&f);

    // A second borrower with their own collateral + request.
    let borrower2 = Address::generate(&f.env);
    f.collateral_admin.mint(&borrower2, &500);
    f.client.request_loan(
        &borrower2,
        &f.collateral.address,
        &500,
        &f.usd.address,
        &50,
        &500,
        &100,
    );

    assert_eq!(f.client.loans_of_borrower(&f.borrower).len(), 2);
    assert_eq!(f.client.loans_of_borrower(&borrower2).len(), 1);
}

#[test]
fn interest_is_computed_from_basis_points() {
    let f = setup();
    // 200 principal @ 2.50% (250 bps) => 5 interest => 205 owed.
    let id = f.client.request_loan(
        &f.borrower,
        &f.collateral.address,
        &500,
        &f.usd.address,
        &200,
        &250,
        &100,
    );
    f.usd_admin.mint(&f.lender, &200);
    f.client.fund_loan(&f.lender, &id);
    assert_eq!(f.client.amount_owed(&id), 205);
}
