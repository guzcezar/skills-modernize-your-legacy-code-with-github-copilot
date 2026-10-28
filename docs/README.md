# Student Account CLI (COBOL) – Documentation

This COBOL application in `src/cobol` is a **simple student account management CLI**.  
It supports a menu-driven flow to:

1. View current balance
2. Credit account
3. Debit account
4. Exit

The account balance is persisted by a data module, with an initial stored value of **1000.00**.

---

## Files and Responsibilities

### `src/cobol/main.cob`
**Purpose**  
Entry-point CLI program that presents the menu and controls user interaction.

**Key functions**
- Displays menu options:
  - View balance
  - Credit
  - Debit
  - Exit
- Reads user selection
- Invokes operation/data routines as needed
- Repeats until Exit is chosen

**Student-account business rules handled here**
- Only valid menu choices are accepted.
- User remains in loop until explicit exit.
- Each action is routed through the operation/data flow (not direct raw file edits).

---

### `src/cobol/operations.cob`
**Purpose**  
Business-logic layer for account operations (view, credit, debit).

**Key functions**
- Fetches current balance for display
- Applies credit operation to increase balance
- Applies debit operation to decrease balance
- Coordinates with the data program for persistence

**Student-account business rules handled here**
- **Credit** increases available balance.
- **Debit** decreases available balance, but is rejected with "Insufficient funds for this debit." when the amount exceeds the current balance (no overdraft).
- Credit and debit amounts are entered by the user inside `operations.cob`.
- Operation outcomes should be reflected immediately in the persisted value.
- Amounts are expected to be valid numeric input before applying arithmetic.

---

### `src/cobol/data.cob`
**Purpose**  
Persistence layer that reads/writes the stored student account balance.

**Key functions**
- Initializes/uses stored balance with default starting amount **1000.00**
- Reads current balance from storage
- Writes updated balance back to storage after operations

**Student-account business rules handled here**
- The account balance is the source of truth in storage.
- Initial value for a new/empty state is **1000.00**.
- Every successful credit/debit must persist the new balance.

---

## End-to-End Behavior

1. `main.cob` starts and shows the menu.
2. User selects an action.
3. `operations.cob` executes operation logic.
4. `data.cob` reads and/or writes the stored balance.
5. Updated balance is shown or preserved for next menu cycle.
6. Loop continues until Exit.

---

## Business Rules Summary (Student Account)

- Starting stored balance: **1000.00**
- View Balance: returns current stored balance.
- Credit: `new_balance = current_balance + amount`
- Debit: `new_balance = current_balance - amount`, **only if** `current_balance >= amount`; otherwise the program displays "Insufficient funds for this debit." and the balance is unchanged.
- Amounts and balances use `PIC 9(6)V99`: non-negative values up to 999,999.99 with 2 decimal places.
- The balance lives in `DataProgram` working storage, so it persists only while the program runs (it resets to 1000.00 on restart).
- Updated balance must be written to persistent storage.
- Menu loop continues until Exit command.

---

## Data Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant M as main.cob (Menu CLI)
    participant O as operations.cob (Operations)
    participant D as data.cob (Data Program)
    participant S as Balance Storage

    U->>M: Start program / choose menu option
    M->>O: Dispatch selected action (view/credit/debit)

    alt View Balance
        O->>D: Request current balance
        D->>S: Read balance (default 1000.00 if initial state)
        S-->>D: Current balance
        D-->>O: Current balance
        O-->>M: Balance result
        M-->>U: Display balance
    else Credit
        U->>M: Enter credit amount
        M->>O: Credit(amount)
        O->>D: Read current balance
        D->>S: Read balance
        S-->>D: Current balance
        D-->>O: Current balance
        O->>O: Compute new balance = current + amount
        O->>D: Persist new balance
        D->>S: Write new balance
        S-->>D: Write confirmation
        D-->>O: Success
        O-->>M: Updated balance/status
        M-->>U: Show success and new balance
    else Debit
        M->>O: CALL Operations('DEBIT')
        O-->>U: Prompt for debit amount
        U->>O: Enter amount
        O->>D: CALL DataProgram('READ')
        D-->>O: Current balance
        alt balance >= amount
            O->>O: Subtract amount
            O->>D: CALL DataProgram('WRITE', new balance)
            O-->>U: Amount debited. New balance
        else balance < amount
            O-->>U: Insufficient funds for this debit.
        end
    else Exit
        M-->>U: Terminate program
    end
