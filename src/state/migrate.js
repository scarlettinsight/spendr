// Best-effort v2 → v3 migration. v2 was a single frozen month (July, day-of-month
// integers); v3 is real dates + recurrence series + double-entry. Anything that
// can't be mapped cleanly falls back to sample data (caller handles null).
import { todayISO, startOfMonth } from '../lib/dates.js';

const MONTH_NUM = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

export function migrateV2(v2) {
  try {
    const today = todayISO();
    const year = today.slice(0, 4);
    const m1 = startOfMonth(today);
    const day = (n) => m1.slice(0, 8) + String(Math.min(28, Math.max(1, n)) === n ? String(n).padStart(2, '0') : String(n).padStart(2, '0'));
    const dayOf = (n) => m1.slice(0, 8) + String(Math.max(1, Math.min(31, n))).padStart(2, '0');

    // categories: keep, drop planned/spent/status (now derived)
    const categories = (v2.categories || []).map((c) => ({
      id: c.id, name: c.name, budget: c.budget || 0, color: c.color || '#5f7fae',
    }));
    const catIdByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    // flags: v2 system autopay/debt/bnpl/sub → v3 registry (bnpl folds into Debt)
    const flags = [{ id: 'f-debt', name: 'Debt', system: 'debt' }];
    const flagMap = new Map(); // old id → new id
    (v2.flags || []).forEach((f) => {
      if (f.system === 'debt' || f.system === 'bnpl') { flagMap.set(f.id, 'f-debt'); return; }
      if (f.system === 'autopay') { flags.push({ id: 'f-autopay', name: 'Autopay' }); flagMap.set(f.id, 'f-autopay'); return; }
      if (f.system === 'sub') { flags.push({ id: 'f-sub', name: 'Subscription' }); flagMap.set(f.id, 'f-sub'); return; }
      flags.push({ id: f.id, name: f.name });
      flagMap.set(f.id, f.id);
    });
    const mapTags = (tags) => (tags || []).map((t) => flagMap.get(t)).filter(Boolean);

    const sources = (v2.sources || []).map((s) => ({
      id: s.id, name: s.name, kind: s.kind, label: s.label, isChecking: !!s.isChecking,
    }));
    const srcName = (id) => (sources.find((s) => s.id === id) || sources[0] || {}).name || '';
    const srcChecking = (id) => !!(sources.find((s) => s.id === id) || {}).isChecking;

    const expenses = [];

    // bills → monthly series anchored this month; v2-paid → paid occurrence + linked expense
    const bills = (v2.bills || []).map((b) => {
      const flagIds = mapTags(b.tags);
      if (b.autopay) flagIds.push('f-autopay');
      if (b.debt || b.bnpl) flagIds.push('f-debt');
      if (b.sub) flagIds.push('f-sub');
      const uniq = [...new Set(flagIds)];
      const flexible = !!b.flexible || b.dueDay == null;
      const anchor = flexible ? m1 : dayOf(b.dueDay);
      const key = flexible ? m1 : anchor;
      const paid = {};
      if (b.paid) {
        const exId = 'mx-' + b.id;
        paid[key] = { expenseId: exId, amount: b.amount, date: key };
        expenses.push({
          id: exId, date: key, name: b.name, amount: -Math.abs(b.amount),
          categoryId: catIdByName.get(String(b.cat || '').toLowerCase()) || null,
          flagIds: uniq, sourceId: b.source, sourceName: srcName(b.source),
          impact: (b.deductedFromChecking !== false && srcChecking(b.source)) ? 'down' : 'none',
          billId: b.id, occurrenceKey: key,
        });
      }
      return {
        id: b.id, name: b.name, amount: b.amount,
        recurrence: { freq: 'monthly', anchorDate: anchor, flexible },
        categoryId: catIdByName.get(String(b.cat || '').toLowerCase()) || null,
        inBudget: !!b.inBudget, flagIds: uniq, sourceId: b.source,
        overrides: {}, paid,
      };
    });

    // income → paychecks recur monthly, others one-time
    const income = (v2.income || []).map((i) => {
      const mo = i.month === 'Jun' ? Number(m1.slice(5, 7)) - 1 : Number(m1.slice(5, 7));
      const dd = `${year}-${String(Math.max(1, mo)).padStart(2, '0')}-${String(Math.max(1, Math.min(31, i.day || 1))).padStart(2, '0')}`;
      const received = {};
      if (i.status === 'RECEIVED') received[dd] = { txId: null, amount: i.amount, date: dd };
      return {
        id: i.id, name: i.name, amount: i.amount,
        recurrence: { freq: i.isPaycheck ? 'monthly' : 'once', anchorDate: dd },
        isPaycheck: !!i.isPaycheck, toChecking: i.toChecking !== false,
        received, overrides: {},
      };
    });

    // ledger: v2 transactions → real-dated expenses
    (v2.transactions || []).forEach((t) => {
      const mo = MONTH_NUM[t.mon] || Number(m1.slice(5, 7));
      const date = `${year}-${String(mo).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
      expenses.push({
        id: t.id, date, name: t.name, amount: t.amount,
        categoryId: t.cat === 'Income' ? null : (catIdByName.get(String(t.cat || '').toLowerCase()) || null),
        flagIds: mapTags(t.tags), sourceId: null, sourceName: t.source, impact: t.impact,
      });
    });

    return {
      settings: {
        userName: (v2.settings || {}).userName || 'there',
        startingBalance: (v2.settings || {}).startingCheckingBalance || 0,
        requiredBuffer: (v2.settings || {}).requiredBuffer || 0,
        plannerDays: 30,
      },
      streak: v2.streak || 0,
      sources, flags, categories, bills, income, expenses,
      scenario: null,
    };
  } catch (e) {
    return null;
  }
}
