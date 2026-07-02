// App store V3: reducer + React context. Persists to localStorage.
// Key invariants:
//  - paying a bill occurrence atomically writes paid[key] AND its linked expense
//  - occurrence overrides live on the series keyed by ORIGINAL scheduled date
//  - "this and all future" edits split the series (Google Calendar pattern)
import { React } from '../lib/html.js';
import { initialState, emptyState } from './model.js';
import { migrateV2 } from './migrate.js';
import { derive } from './derive.js';
import { splitSeries } from '../lib/recur.js';

const KEY = 'spendr.state.v3';
const V2KEY = 'spendr.state.v2';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const init = initialState();
      const saved = JSON.parse(raw);
      return { ...init, ...saved, settings: { ...init.settings, ...saved.settings } };
    }
    const v2raw = localStorage.getItem(V2KEY);
    if (v2raw) {
      const migrated = migrateV2(JSON.parse(v2raw));
      if (migrated) return migrated;
    }
  } catch (e) { /* fall through to sample data */ }
  return initialState();
}

function insertAt(list, item, index) {
  const i = index == null || index < 0 || index > list.length ? list.length : index;
  return [...list.slice(0, i), item, ...list.slice(i)];
}

const mapById = (list, id, fn) => list.map((x) => x.id === id ? fn(x) : x);

function reducer(state, action) {
  switch (action.type) {
    /* ---------------- bills: series ---------------- */
    case 'addBill':
      return { ...state, bills: [...state.bills, action.bill] };

    case 'updateBill': // whole-series edit (also used for one-time bills)
      return { ...state, bills: mapById(state.bills, action.id, (b) => ({ ...b, ...action.patch })) };

    case 'removeBill':
      return { ...state, bills: state.bills.filter((b) => b.id !== action.id) };

    case 'restoreBill':
      return { ...state, bills: insertAt(state.bills, action.bill, action.index) };

    case 'overrideOccurrence': { // "this occurrence only" — persists across series edits
      const { billId, key, patch } = action;
      return {
        ...state,
        bills: mapById(state.bills, billId, (b) => ({
          ...b,
          overrides: { ...(b.overrides || {}), [key]: { ...((b.overrides || {})[key] || {}), ...patch } },
        })),
      };
    }

    case 'clearOverride': {
      const { billId, key } = action;
      return {
        ...state,
        bills: mapById(state.bills, billId, (b) => {
          const o = { ...(b.overrides || {}) };
          delete o[key];
          return { ...b, overrides: o };
        }),
      };
    }

    case 'splitBillSeries': { // "this and all future occurrences"
      const { billId, fromKey, patch, newId } = action;
      const series = state.bills.find((b) => b.id === billId);
      if (!series) return state;
      const { before, after } = splitSeries(series, fromKey, patch, newId);
      const idx = state.bills.findIndex((b) => b.id === billId);
      const bills = [...state.bills];
      bills[idx] = before;
      bills.splice(idx + 1, 0, after);
      return { ...state, bills };
    }

    case 'unsplitBillSeries': { // undo of a split: restore original, drop the new series
      const { original, newId } = action;
      return {
        ...state,
        bills: state.bills.filter((b) => b.id !== newId).map((b) => b.id === original.id ? original : b),
      };
    }

    /* ---------------- bills: paying (atomic pay + linked expense) ---------------- */
    case 'payOccurrence': {
      const { billId, key, amount, date, expenseId, deductNow } = action;
      const bill = state.bills.find((b) => b.id === billId);
      if (!bill) return state;
      const src = state.sources.find((s) => s.id === bill.sourceId);
      const expense = {
        id: expenseId, date, name: action.name || bill.name,
        amount: -Math.abs(amount),
        categoryId: bill.categoryId || null,
        flagIds: bill.flagIds || [],
        sourceId: bill.sourceId, sourceName: src ? src.name : '',
        impact: (deductNow !== false && src && src.isChecking) ? 'down' : 'none',
        billId, occurrenceKey: key,
      };
      return {
        ...state,
        bills: mapById(state.bills, billId, (b) => ({
          ...b, paid: { ...(b.paid || {}), [key]: { expenseId, amount: Math.abs(amount), date } },
        })),
        expenses: [expense, ...state.expenses],
      };
    }

    case 'unpayOccurrence': { // undo — removes the paid mark AND the linked expense
      const { billId, key } = action;
      const bill = state.bills.find((b) => b.id === billId);
      const paidInfo = bill && (bill.paid || {})[key];
      return {
        ...state,
        bills: mapById(state.bills, billId, (b) => {
          const p = { ...(b.paid || {}) };
          delete p[key];
          return { ...b, paid: p };
        }),
        expenses: paidInfo ? state.expenses.filter((t) => t.id !== paidInfo.expenseId) : state.expenses,
      };
    }

    /* ---------------- income ---------------- */
    case 'addIncome':
      return { ...state, income: [...state.income, action.income] };

    case 'updateIncome':
      return { ...state, income: mapById(state.income, action.id, (i) => ({ ...i, ...action.patch })) };

    case 'removeIncome':
      return { ...state, income: state.income.filter((i) => i.id !== action.id) };

    case 'restoreIncome':
      return { ...state, income: insertAt(state.income, action.income, action.index) };

    case 'receiveOccurrence': { // income lands → ledger entry + balance
      const { incomeId, key, amount, date, txId } = action;
      const inc = state.income.find((i) => i.id === incomeId);
      if (!inc) return state;
      const tx = {
        id: txId, date, name: inc.name, amount: Math.abs(amount),
        categoryId: null, flagIds: [], sourceId: 'chk',
        sourceName: (state.sources.find((s) => s.isChecking) || {}).name || 'Checking',
        impact: inc.toChecking !== false ? 'up' : 'none',
        incomeId, occurrenceKey: key,
      };
      return {
        ...state,
        income: mapById(state.income, incomeId, (i) => ({
          ...i, received: { ...(i.received || {}), [key]: { txId, amount: Math.abs(amount), date } },
        })),
        expenses: [tx, ...state.expenses],
        streak: inc.isPaycheck ? state.streak + 1 : state.streak,
      };
    }

    case 'unreceiveOccurrence': {
      const { incomeId, key } = action;
      const inc = state.income.find((i) => i.id === incomeId);
      const info = inc && (inc.received || {})[key];
      return {
        ...state,
        income: mapById(state.income, incomeId, (i) => {
          const r = { ...(i.received || {}) };
          delete r[key];
          return { ...i, received: r };
        }),
        expenses: info && info.txId ? state.expenses.filter((t) => t.id !== info.txId) : state.expenses,
        streak: inc && inc.isPaycheck ? Math.max(0, state.streak - 1) : state.streak,
      };
    }

    /* ---------------- ledger (expenses) ---------------- */
    case 'addExpense':
      return { ...state, expenses: [action.expense, ...state.expenses] };

    case 'updateExpense':
      return { ...state, expenses: mapById(state.expenses, action.id, (t) => ({ ...t, ...action.patch })) };

    case 'removeExpense': { // if it was a bill payment, release the occurrence too
      const tx = state.expenses.find((t) => t.id === action.id);
      let bills = state.bills;
      if (tx && tx.billId && tx.occurrenceKey) {
        bills = mapById(state.bills, tx.billId, (b) => {
          const p = { ...(b.paid || {}) };
          delete p[tx.occurrenceKey];
          return { ...b, paid: p };
        });
      }
      return { ...state, bills, expenses: state.expenses.filter((t) => t.id !== action.id) };
    }

    case 'restoreExpense': {
      const { tx, index } = action;
      let bills = state.bills;
      if (tx.billId && tx.occurrenceKey) {
        bills = mapById(state.bills, tx.billId, (b) => ({
          ...b, paid: { ...(b.paid || {}), [tx.occurrenceKey]: { expenseId: tx.id, amount: Math.abs(tx.amount), date: tx.date } },
        }));
      }
      return { ...state, bills, expenses: insertAt(state.expenses, tx, index) };
    }

    /* ---------------- categories / flags / sources / settings ---------------- */
    case 'updateCategory':
      return { ...state, categories: mapById(state.categories, action.id, (c) => ({ ...c, ...action.patch })) };

    case 'addCategory':
      return { ...state, categories: [...state.categories, action.cat] };

    case 'removeCategory':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) };

    case 'restoreCategory':
      return { ...state, categories: insertAt(state.categories, action.cat, action.index) };

    case 'addFlag':
      return { ...state, flags: [...state.flags, { id: action.id, name: action.name }] };

    case 'updateFlag':
      return { ...state, flags: state.flags.map((f) => f.id === action.id && !f.system ? { ...f, name: action.name } : f) };

    case 'removeFlag':
      return { ...state, flags: state.flags.filter((f) => f.id !== action.id || f.system) };

    case 'restoreFlag':
      return { ...state, flags: insertAt(state.flags, action.flag, action.index) };

    case 'addSource': {
      const src = {
        id: action.id, name: action.name,
        kind: action.isChecking ? 'primary' : 'credit',
        label: action.isChecking ? 'BANK' : 'CARD',
        isChecking: !!action.isChecking,
      };
      return { ...state, sources: [...state.sources, src] };
    }

    case 'updateSource':
      return {
        ...state,
        sources: mapById(state.sources, action.id, (s) => ({
          ...s, ...action.patch,
          label: action.patch.isChecking != null ? (action.patch.isChecking ? 'BANK' : 'CARD') : s.label,
          kind: action.patch.isChecking != null ? (action.patch.isChecking ? 'primary' : 'credit') : s.kind,
        })),
      };

    case 'removeSource':
      if (state.sources.length <= 1) return state;
      return { ...state, sources: state.sources.filter((s) => s.id !== action.id) };

    case 'restoreSource':
      return { ...state, sources: insertAt(state.sources, action.source, action.index) };

    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'setScenario':
      return { ...state, scenario: action.scenario };

    case 'reset':
      return initialState();

    case 'deleteAll':
      return emptyState();

    default:
      return state;
  }
}

const StoreContext = React.createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, load);

  React.useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, [state]);

  const derived = React.useMemo(() => derive(state), [state]);

  const value = React.useMemo(() => ({ state, derived, dispatch }), [state, derived]);
  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// Live impact preview for Add Expense.
export function previewSafeAfter(derived, amount, fromChecking) {
  if (!fromChecking) return derived.safeToSpend;
  return Math.max(0, derived.safeToSpend - Math.abs(amount || 0));
}
