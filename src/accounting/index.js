'use strict';

const readline = require('node:readline');

const INITIAL_BALANCE_CENTS = 100000;
const BALANCE_MODULUS_CENTS = 100000000; // PIC 9(6)V99 holds at most 999999.99

// DataProgram: in-memory storage, READ / WRITE
function createDataStore() {
  let storageBalance = INITIAL_BALANCE_CENTS;
  return {
    read: () => storageBalance,
    write: (balance) => {
      storageBalance = balance;
    },
  };
}

function formatBalance(cents) {
  const whole = String(Math.floor(cents / 100)).padStart(6, '0');
  const frac = String(cents % 100).padStart(2, '0');
  return `${whole}.${frac}`;
}

function parseAmount(text) {
  const trimmed = String(text).trim();
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(trimmed)) {
    return null;
  }
  const [whole = '0', frac = ''] = trimmed.split('.');
  const cents = Number(whole || '0') * 100 + Number(frac.padEnd(2, '0') || '0');
  return cents < BALANCE_MODULUS_CENTS ? cents : null;
}

// Operations: TOTAL / CREDIT / DEBIT
async function runOperation(type, store, ask, print) {
  if (type === 'TOTAL') {
    print(`Current balance: ${formatBalance(store.read())}`);
    return;
  }
  const label = type === 'CREDIT' ? 'credit' : 'debit';
  const amount = parseAmount(await ask(`Enter ${label} amount: `));
  if (amount === null) {
    print('Invalid amount.');
    return;
  }
  const balance = store.read();
  if (type === 'CREDIT') {
    const next = (balance + amount) % BALANCE_MODULUS_CENTS;
    store.write(next);
    print(`Amount credited. New balance: ${formatBalance(next)}`);
  } else if (balance >= amount) {
    store.write(balance - amount);
    print(`Amount debited. New balance: ${formatBalance(balance - amount)}`);
  } else {
    print('Insufficient funds for this debit.');
  }
}

// MainProgram: menu loop
async function run(ask, print, store = createDataStore()) {
  let keepGoing = true;
  while (keepGoing) {
    print('--------------------------------');
    print('Account Management System');
    print('1. View Balance');
    print('2. Credit Account');
    print('3. Debit Account');
    print('4. Exit');
    print('--------------------------------');
    const choice = (await ask('Enter your choice (1-4): ')).trim();
    switch (choice) {
      case '1':
        await runOperation('TOTAL', store, ask, print);
        break;
      case '2':
        await runOperation('CREDIT', store, ask, print);
        break;
      case '3':
        await runOperation('DEBIT', store, ask, print);
        break;
      case '4':
        keepGoing = false;
        break;
      default:
        print('Invalid choice, please select 1-4.');
    }
  }
  print('Exiting the program. Goodbye!');
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (prompt) => {
    process.stdout.write(prompt + '\n');
    const { value, done } = await lines.next();
    return done ? '4' : value;
  };
  await run(ask, (msg) => console.log(msg));
  rl.close();
}

if (require.main === module) {
  main();
}

module.exports = { run, runOperation, createDataStore, formatBalance, parseAmount };
