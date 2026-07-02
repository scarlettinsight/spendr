// Spendr data model V3 — real dates, recurrence series, double-entry.
//   Bills   = planned/scheduled payments (series → occurrences, like calendar events)
//   Expenses = actual spending (the ledger). Paying a bill CREATES a linked expense.
//   Categories = what the money is for (one per item, monthly envelope budget).
//   Flags    = the nature of the payment (one or more per item; Debt is system).
// Seed data anchors to the real current month.

import { color } from '../theme/tokens.js';
import { todayISO, addDays, startOfMonth, addMonths } from '../lib/dates.js';

export const CATEGORY_PALETTE = [
  '#5f7fae', // slate (neutral)
  '#8b7bff', // violet
  '#c07dff', // orchid
  '#ff3d9a', // magenta
  '#ff7a3d', // ember
  '#e8c15a', // gold
  '#2fd4b2', // teal
  '#4f8ef7', // azure
];

const monthly = (anchorDate, flexible = false) => ({ freq: 'monthly', anchorDate, flexible });
const once = (anchorDate) => ({ freq: 'once', anchorDate });

export function initialState() {
  const today = todayISO();
  const m1 = startOfMonth(today);                    // 1st of this month
  const day = (n) => m1.slice(0, 8) + String(n).padStart(2, '0');
  const ago = (n) => addDays(today, -n);
  const lastMonth = (n) => addMonths(m1, -1).slice(0, 8) + String(n).padStart(2, '0');

  return {
    settings: {
      userName: 'Sam',
      startingBalance: 3540,       // accepts negative values
      requiredBuffer: 500,
      plannerDays: 30,             // cash-flow horizon (30–60)
    },

    streak: 2,

    sources: [
      { id: 'chk', name: 'Checking ··1247', kind: 'primary', label: 'BANK', isChecking: true },
      { id: 'amex', name: 'Amex ··8', kind: 'credit', label: 'CARD', isChecking: false },
    ],

    // Flags = nature of the payment. Debt is system (drives Debt Pulse + red styling).
    flags: [
      { id: 'f-debt', name: 'Debt', system: 'debt' },
      { id: 'f-fixed', name: 'Fixed Bill' },
      { id: 'f-variable', name: 'Variable Bill' },
      { id: 'f-sub', name: 'Subscription' },
      { id: 'f-autopay', name: 'Autopay' },
      { id: 'f-shared', name: 'Shared' },
    ],

    // Categories = what the money is for. `budget` is the monthly envelope.
    categories: [
      { id: 'c-housing', name: 'Housing', budget: 1500, color: '#8b7bff' },
      { id: 'c-utilities', name: 'Utilities', budget: 200, color: '#4f8ef7' },
      { id: 'c-debt', name: 'Debt', budget: 800, color: '#ff7a3d' },
      { id: 'c-food', name: 'Food', budget: 600, color: '#2fd4b2' },
      { id: 'c-gas', name: 'Gas', budget: 180, color: '#e8c15a' },
      { id: 'c-subs', name: 'Subscriptions', budget: 90, color: '#c07dff' },
      { id: 'c-pets', name: 'Pets', budget: 120, color: '#ff3d9a' },
      { id: 'c-other', name: 'Other', budget: 200, color: '#5f7fae' },
    ],

    // Bill series. paid[key] links an occurrence to its ledger expense.
    bills: [
      { id: 'rent', name: 'Rent — Sable Apartments', amount: 1450, recurrence: monthly(day(1)), categoryId: 'c-housing', inBudget: true, flagIds: ['f-fixed', 'f-autopay'], sourceId: 'chk',
        overrides: {}, paid: { [day(1)]: { expenseId: 'tx-rent', amount: 1450, date: day(1) } } },
      { id: 'affirm', name: 'Affirm — Sony A7 IV', amount: 132, recurrence: monthly(day(1)), categoryId: 'c-debt', inBudget: true, flagIds: ['f-debt', 'f-fixed', 'f-autopay'], sourceId: 'chk',
        overrides: {}, paid: { [day(1)]: { expenseId: 'tx-affirm', amount: 132, date: day(1) } } },
      { id: 'car', name: 'Car Payment — Toyota', amount: 389, recurrence: monthly(day(4)), categoryId: 'c-debt', inBudget: true, flagIds: ['f-debt', 'f-fixed', 'f-autopay'], sourceId: 'chk', overrides: {}, paid: {} },
      { id: 'spotify', name: 'Spotify', amount: 11.99, recurrence: monthly(day(5)), categoryId: 'c-subs', inBudget: true, flagIds: ['f-sub', 'f-fixed', 'f-autopay'], sourceId: 'amex', overrides: {}, paid: {} },
      { id: 'electric', name: 'Electric — Con Ed', amount: 96.4, recurrence: monthly(day(6)), categoryId: 'c-utilities', inBudget: true, flagIds: ['f-variable'], sourceId: 'chk', overrides: {}, paid: {} },
      { id: 'nelnet', name: 'Student Loan — Nelnet', amount: 214, recurrence: monthly(day(9)), categoryId: 'c-debt', inBudget: true, flagIds: ['f-debt', 'f-fixed', 'f-autopay'], sourceId: 'chk', overrides: {}, paid: {} },
      { id: 'adobe', name: 'Adobe Creative Cloud', amount: 59.99, recurrence: monthly(day(9)), categoryId: 'c-subs', inBudget: true, flagIds: ['f-sub', 'f-fixed', 'f-autopay'], sourceId: 'amex', overrides: {}, paid: {} },
      { id: 'internet', name: 'Internet — Verizon Fios', amount: 79.99, recurrence: monthly(day(18)), categoryId: 'c-utilities', inBudget: true, flagIds: ['f-fixed', 'f-autopay'], sourceId: 'chk', overrides: {}, paid: {} },
      { id: 'klarna', name: 'Klarna — Herman Miller', amount: 88, recurrence: monthly(day(22)), categoryId: 'c-debt', inBudget: true, flagIds: ['f-debt', 'f-fixed'], sourceId: 'chk', overrides: {}, paid: {} },
      { id: 'icloud', name: 'iCloud+', amount: 2.99, recurrence: monthly(day(25)), categoryId: 'c-subs', inBudget: true, flagIds: ['f-sub', 'f-fixed', 'f-autopay'], sourceId: 'amex', overrides: {}, paid: {} },
      { id: 'petfood', name: 'Pet Food — Chewy', amount: 42, recurrence: monthly(m1, true), categoryId: 'c-pets', inBudget: true, flagIds: ['f-variable'], sourceId: 'chk', overrides: {}, paid: {} },
    ],

    // Planned income series. received[key] links to the ledger.
    income: [
      { id: 'pc1', name: 'Paycheck — Northwind Labs', amount: 2180, recurrence: monthly(lastMonth(30)), isPaycheck: true, toChecking: true,
        received: { [lastMonth(30)]: { txId: 'tx-pay1', amount: 2180, date: lastMonth(30) } }, overrides: {} },
      { id: 'pc2', name: 'Paycheck — Northwind Labs', amount: 2180, recurrence: monthly(day(15)), isPaycheck: true, toChecking: true, received: {}, overrides: {} },
      { id: 'free', name: 'Freelance — Wave Invoice', amount: 650, recurrence: once(day(12)), toChecking: true, received: {}, overrides: {} },
    ],

    // The ledger: actual money movement. amount signed (spend −, income +).
    expenses: [
      { id: 'tx-rent', date: day(1), name: 'Rent — Sable Apartments', amount: -1450, categoryId: 'c-housing', flagIds: ['f-fixed'], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'down', billId: 'rent', occurrenceKey: day(1) },
      { id: 'tx-affirm', date: day(1), name: 'Affirm — Sony A7 IV', amount: -132, categoryId: 'c-debt', flagIds: ['f-debt'], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'down', billId: 'affirm', occurrenceKey: day(1) },
      { id: 'tx-wf', date: day(1), name: 'Whole Foods Market', amount: -74.21, categoryId: 'c-food', flagIds: ['f-variable'], sourceId: 'amex', sourceName: 'Amex ··8', impact: 'none' },
      { id: 'tx-pay1', date: ago(2), name: 'Paycheck — Northwind Labs', amount: 2180, categoryId: null, flagIds: [], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'up', incomeId: 'pc1' },
      { id: 'tx-shell1', date: ago(2), name: 'Shell', amount: -52.1, categoryId: 'c-gas', flagIds: ['f-variable'], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'down' },
      { id: 'tx-tj', date: ago(4), name: 'Trader Joe’s', amount: -61.44, categoryId: 'c-food', flagIds: ['f-variable'], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'down' },
      { id: 'tx-bb1', date: ago(3), name: 'Blue Bottle Coffee', amount: -6.4, categoryId: 'c-food', flagIds: ['f-variable'], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'down' },
      { id: 'tx-bb2', date: ago(5), name: 'Blue Bottle Coffee', amount: -6.4, categoryId: 'c-food', flagIds: ['f-variable'], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'down' },
      { id: 'tx-shell2', date: ago(8), name: 'Shell', amount: -52.1, categoryId: 'c-gas', flagIds: ['f-variable'], sourceId: 'chk', sourceName: 'Checking ··1247', impact: 'down' },
      { id: 'tx-spot', date: lastMonth(5), name: 'Spotify', amount: -11.99, categoryId: 'c-subs', flagIds: ['f-sub'], sourceId: 'amex', sourceName: 'Amex ··8', impact: 'none' },
    ],

    scenario: null, // 'Stable' | 'Caution' | 'Critical' | null (states preview)
  };
}

// A truly empty dataset for "Delete All Data" — fresh start.
export function emptyState() {
  return {
    settings: { userName: 'there', startingBalance: 0, requiredBuffer: 0, plannerDays: 30 },
    streak: 0,
    sources: [{ id: 'chk', name: 'Checking', kind: 'primary', label: 'BANK', isChecking: true }],
    flags: [{ id: 'f-debt', name: 'Debt', system: 'debt' }],
    categories: [],
    bills: [],
    income: [],
    expenses: [],
    scenario: null,
  };
}

// Bill-urgency groups (relative to today / next income date).
export const GROUPS = [
  { key: 'overdue', title: 'OVERDUE', accent: color.red },
  { key: 'today', title: 'DUE TODAY', accent: color.red },
  { key: 'week', title: 'THIS WEEK', accent: color.amber },
  { key: 'before', title: 'BEFORE NEXT INCOME', accent: color.neutral },
  { key: 'later', title: 'LATER', accent: color.textFaint },
  { key: 'flex', title: 'ANYTIME THIS MONTH', accent: color.neutral },
];
