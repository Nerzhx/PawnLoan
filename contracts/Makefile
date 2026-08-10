default: build

# Build the optimized on-chain Wasm artifact.
build:
	cargo build --target wasm32-unknown-unknown --release
	@echo "Wasm artifact: target/wasm32-unknown-unknown/release/pawnloan.wasm"

# Run the full unit-test suite (native host).
test:
	cargo test

# Format and lint.
fmt:
	cargo fmt --all

lint:
	cargo clippy --all-targets -- -D warnings

clean:
	cargo clean

# Optimize the Wasm with the Stellar CLI (requires `stellar` / `soroban`).
optimize: build
	stellar contract optimize \
		--wasm target/wasm32-unknown-unknown/release/pawnloan.wasm

.PHONY: default build test fmt lint clean optimize
