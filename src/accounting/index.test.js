'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { run, createDataStore } = require('./index');

async function session(inputs, store = createDataStore()) {
  const queue = [...inputs];
  const out = [];
  await run(async () => (queue.length ? queue.shift() : '4'), (m) => out.push(m), store);
  return out;
}

const balances = (out) => out.filter((l) => l.startsWith('Current balance')).map((l) => l.split(': ')[1]);

test('TC-001 menu displays options 1-4', async () => {
  const out = await session(['4']);
  for (const l of ['1. View Balance', '2. Credit Account', '3. Debit Account', '4. Exit']) {
    assert.ok(out.includes(l));
  }
});

test('TC-002 initial balance is 1000.00', async () => {
  assert.deepStrictEqual(balances(await session(['1'])), ['001000.00']);
});

test('TC-003 view balance after in-session update', async () => {
  assert.deepStrictEqual(balances(await session(['2', '10', '1'])), ['001010.00']);
});

test('TC-004 credit valid amount', async () => {
  assert.deepStrictEqual(balances(await session(['2', '200.00', '1'])), ['001200.00']);
});

test('TC-005 credit decimal precision', async () => {
  assert.deepStrictEqual(balances(await session(['2', '99.99', '1'])), ['001099.99']);
});

test('TC-006 debit with sufficient funds', async () => {
  assert.deepStrictEqual(balances(await session(['3', '250.00', '1'])), ['000750.00']);
});

test('TC-007 debit equal to full balance', async () => {
  assert.deepStrictEqual(balances(await session(['3', '1000.00', '1'])), ['000000.00']);
});

test('TC-008 debit with insufficient funds', async () => {
  const out = await session(['3', '1000.01', '1']);
  assert.ok(out.includes('Insufficient funds for this debit.'));
  assert.deepStrictEqual(balances(out), ['001000.00']);
});

test('TC-009 credit then debit', async () => {
  assert.deepStrictEqual(balances(await session(['2', '300', '3', '50', '1'])), ['001250.00']);
});

test('TC-010 debit then credit', async () => {
  assert.deepStrictEqual(balances(await session(['3', '100', '2', '40', '1'])), ['000940.00']);
});

test('TC-011 restart after credit resets balance', async () => {
  await session(['2', '75.00']);
  assert.deepStrictEqual(balances(await session(['1'])), ['001000.00']);
});

test('TC-012 restart after debit resets balance', async () => {
  await session(['3', '125.00']);
  assert.deepStrictEqual(balances(await session(['1'])), ['001000.00']);
});

test('TC-013 exit terminates cleanly', async () => {
  const out = await session(['4']);
  assert.strictEqual(out[out.length - 1], 'Exiting the program. Goodbye!');
});

test('TC-014 invalid numeric menu option', async () => {
  for (const bad of ['5', '0']) {
    const out = await session([bad, '1']);
    assert.ok(out.includes('Invalid choice, please select 1-4.'));
    assert.deepStrictEqual(balances(out), ['001000.00']);
  }
});

test('TC-015 non-numeric menu option', async () => {
  const out = await session(['ABC', '1']);
  assert.ok(out.includes('Invalid choice, please select 1-4.'));
  assert.deepStrictEqual(balances(out), ['001000.00']);
});

test('TC-016 credit zero amount leaves balance unchanged', async () => {
  assert.deepStrictEqual(balances(await session(['2', '0.00', '1'])), ['001000.00']);
});

test('TC-017 debit zero amount leaves balance unchanged', async () => {
  assert.deepStrictEqual(balances(await session(['3', '0.00', '1'])), ['001000.00']);
});

test('TC-018 invalid amount during credit', async () => {
  const out = await session(['2', 'XYZ', '1']);
  assert.ok(out.includes('Invalid amount.'));
  assert.deepStrictEqual(balances(out), ['001000.00']);
});

test('TC-019 invalid amount during debit', async () => {
  const out = await session(['3', 'XYZ', '1']);
  assert.ok(out.includes('Invalid amount.'));
  assert.deepStrictEqual(balances(out), ['001000.00']);
});

test('TC-020 end-to-end happy path', async () => {
  const out = await session(['1', '2', '100.00', '3', '50.00', '1', '4']);
  assert.deepStrictEqual(balances(out), ['001000.00', '001050.00']);
  assert.deepStrictEqual(balances(await session(['1'])), ['001000.00']);
});
