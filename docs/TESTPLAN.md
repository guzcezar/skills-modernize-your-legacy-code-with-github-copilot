# Test Plan – Student Account CLI (COBOL baseline for Node.js migration)

This test plan validates the current COBOL business logic so stakeholders can confirm behavior before and during migration to Node.js.

## Scope
- Menu choices: **1-4**
- Invalid menu input handling
- View balance
- Credit
- Debit with sufficient funds
- Debit with insufficient funds
- Initial balance behavior (**1000.00**)
- Restart behavior (**balance resets to 1000.00** because it is stored only in DataProgram WORKING-STORAGE)

## Execution Notes
- Unless stated otherwise, each test should start with a known in-memory balance.
- Because current COBOL implementation uses WORKING-STORAGE only, balance is **not persisted across app restarts**.
- Use **Actual Result**, **Status**, and **Comments** columns during execution with stakeholders.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | Verify application starts and displays menu options 1-4 | Application is compiled and runnable | 1) Launch app | Menu is displayed with options: 1) View Balance 2) Credit 3) Debit 4) Exit |  |  |  |
| TC-002 | Verify initial balance is 1000.00 on start | Fresh app start | 1) Launch app 2) Choose menu option **1** (View Balance) | Displayed balance is **1000.00** |  |  |  |
| TC-003 | View balance after in-session updates | App started; at least one operation already executed | 1) Execute a credit/debit first 2) Choose **1** | Displayed balance matches the current in-session balance |  |  |  |
| TC-004 | Credit account with valid positive amount | App started; current balance **1000.00** | 1) Launch app 2) Choose **2** (Credit) 3) Enter **200.00** 4) Choose **1** (View Balance) | Credit succeeds; new in-session balance is **1200.00** |  |  |  |
| TC-005 | Credit account with decimal precision | App started; current balance **1000.00** | 1) Launch app 2) Choose **2** 3) Enter **99.99** 4) View balance | New in-session balance is **1099.99** |  |  |  |
| TC-006 | Debit account with sufficient funds | App started; current balance **1000.00** | 1) Launch app 2) Choose **3** (Debit) 3) Enter **250.00** 4) Choose **1** | Debit succeeds; new in-session balance is **750.00** |  |  |  |
| TC-007 | Debit account equal to full balance (boundary) | App started; current balance **1000.00** | 1) Launch app 2) Choose **3** 3) Enter **1000.00** 4) View balance | Debit succeeds; new in-session balance is **0.00** |  |  |  |
| TC-008 | Debit account with insufficient funds | App started; current balance **1000.00** | 1) Launch app 2) Choose **3** 3) Enter **1000.01** 4) View balance | Message shown: **"Insufficient funds for this debit."** and balance remains **1000.00** |  |  |  |
| TC-009 | Sequential operations: credit then debit | App started; current balance **1000.00** | 1) Choose **2**, enter **300.00** 2) Choose **3**, enter **50.00** 3) View balance | Final in-session balance is **1250.00** |  |  |  |
| TC-010 | Sequential operations: debit then credit | App started; current balance **1000.00** | 1) Choose **3**, enter **100.00** 2) Choose **2**, enter **40.00** 3) View balance | Final in-session balance is **940.00** |  |  |  |
| TC-011 | Restart behavior after credit (no persistence) | App started; current balance **1000.00** | 1) Credit **75.00** 2) Exit app 3) Relaunch app 4) View balance | Balance after restart is reset to **1000.00** |  |  |  |
| TC-012 | Restart behavior after debit (no persistence) | App started; current balance **1000.00** | 1) Debit **125.00** 2) Exit app 3) Relaunch app 4) View balance | Balance after restart is reset to **1000.00** |  |  |  |
| TC-013 | Exit option terminates app cleanly | App running at menu prompt | 1) Choose **4** (Exit) | App exits without error |  |  |  |
| TC-014 | Invalid menu input: non-supported numeric option | App running at menu prompt | 1) Enter **5** (or 0) 2) Then choose **1** | Invalid selection message shown; app remains in menu loop; no unintended balance change |  |  |  |
| TC-015 | Invalid menu input: non-numeric value | App running at menu prompt | 1) Enter **ABC** 2) Then choose **1** | Invalid input handled gracefully; app remains usable; no unintended balance change |  |  |  |
| TC-016 | Credit with zero amount (validation behavior) | App started; current balance **1000.00** | 1) Choose **2** 2) Enter **0.00** 3) View balance | Behavior matches current rule (either accepted with unchanged balance or rejected); no incorrect mutation |  |  | Capture exact behavior for Node.js parity |
| TC-017 | Debit with zero amount (validation behavior) | App started; current balance **1000.00** | 1) Choose **3** 2) Enter **0.00** 3) View balance | Behavior matches current rule (either accepted with unchanged balance or rejected); no incorrect mutation |  |  | Capture exact behavior for Node.js parity |
| TC-018 | Invalid amount input during credit | App started; current balance **1000.00** | 1) Choose **2** 2) Enter invalid amount (e.g., **XYZ**) 3) View balance | Invalid amount is handled; no unintended balance mutation; app returns to menu flow |  |  |  |
| TC-019 | Invalid amount input during debit | App started; current balance **1000.00** | 1) Choose **3** 2) Enter invalid amount (e.g., **XYZ**) 3) View balance | Invalid amount is handled; no unintended balance mutation; app returns to menu flow |  |  |  |
| TC-020 | End-to-end happy path covering menu 1-4 | App started; current balance **1000.00** | 1) View balance 2) Credit **100.00** 3) Debit **50.00** 4) Exit 5) Relaunch and view | In-session math is correct before exit; after relaunch balance resets to **1000.00** |  |  |  |

## Stakeholder Sign-off Checklist
- [ ] Initial balance rule confirmed: **1000.00**
- [ ] Insufficient funds behavior confirmed: message **"Insufficient funds for this debit."** and no balance change
- [ ] Invalid menu/amount handling confirmed
- [ ] Restart behavior confirmed: **no persistence**, balance resets to **1000.00**
- [ ] Test cases approved as baseline for Node.js unit/integration test creation
