use soroban_sdk::{contracttype, Address};

/// Lifecycle state of a pawn loan.
///
/// ```text
///  Pending ──fund──▶ Funded ──repay────▶ Repaid
///     │                 │
///   cancel          liquidate (after due)
///     ▼                 ▼
///  Cancelled        Defaulted
/// ```
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    /// Collateral is escrowed and the loan is waiting for a lender.
    Pending,
    /// A lender has funded the loan; principal was sent to the borrower.
    Funded,
    /// The borrower repaid principal + interest and reclaimed collateral.
    Repaid,
    /// The loan passed its due time unpaid; the lender seized collateral.
    Defaulted,
    /// The borrower cancelled the request before it was funded.
    Cancelled,
}

/// A single pawn loan. Collateral is held by the contract while the loan is
/// `Pending` or `Funded`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    /// Monotonic loan identifier.
    pub id: u64,
    /// Account that pledged collateral and receives the principal.
    pub borrower: Address,
    /// Account that funded the principal. `None` until funded.
    pub lender: Option<Address>,
    /// Token (SEP-41) used as collateral.
    pub collateral_token: Address,
    /// Amount of collateral held in escrow.
    pub collateral_amount: i128,
    /// Token (SEP-41) the loan is denominated in.
    pub loan_token: Address,
    /// Principal owed to the lender.
    pub principal: i128,
    /// Fixed interest rate in basis points (1% = 100 bps).
    pub interest_rate_bps: u32,
    /// Loan term in seconds, applied from the funding time.
    pub duration: u64,
    /// Ledger timestamp when the loan was funded (0 while pending).
    pub start_time: u64,
    /// Ledger timestamp after which the loan may be liquidated (0 while pending).
    pub due_time: u64,
    /// Current lifecycle state.
    pub status: LoanStatus,
}

/// Keys for contract storage.
#[contracttype]
pub enum DataKey {
    /// Administrator address (instance storage).
    Admin,
    /// Running loan counter (instance storage).
    LoanCount,
    /// A loan keyed by id (persistent storage).
    Loan(u64),
}
