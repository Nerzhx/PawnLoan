use soroban_sdk::contracterror;

/// Errors returned by the PawnLoan contract. Each maps to a stable `u32`
/// so the frontend can decode failures deterministically.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// `initialize` was called on an already-initialized contract.
    AlreadyInitialized = 1,
    /// A read expected the contract to be initialized, but it was not.
    NotInitialized = 2,
    /// No loan exists for the supplied id.
    LoanNotFound = 3,
    /// A collateral or principal amount was zero or negative.
    InvalidAmount = 4,
    /// The requested loan duration was zero.
    InvalidDuration = 5,
    /// Operation requires a loan in the `Pending` state.
    LoanNotPending = 6,
    /// Operation requires a loan in the `Funded` state.
    LoanNotFunded = 7,
    /// Liquidation attempted before the loan's due time.
    NotDueYet = 8,
    /// A borrower attempted to fund their own loan request.
    SelfFunding = 9,
    /// The interest rate exceeded the protocol's sanity cap.
    InvalidInterestRate = 10,
}
