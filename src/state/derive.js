// The money engine, V3 — real dates, occurrences, double-entry.
//   balance      = startingBalance + Σ ledger entries with checking impact
//   safeToSpend  = max(0, balance + 0 − upcoming unpaid bills before next income − buffer)
//   shortfall    = surfaced (amount + first date) whenever the raw value dips below 0
// Committed (unpaid occurrences) never touches the balance — planning only.

import { todayISO, addDays, startOfMonth, endOfMonth, monthKey, cmp, fmtShort, daysBetween } from '../lib/dates.js';
import { expandSeries } from '../lib/recur.js';
import { GROUPS } from './model.js';

export function derive(state) {
  const { settings, bills, income, categories, expenses, flags, sources, scenario, streak } = state;
  const today = todayISO();
  const buffer = settings.requiredBuffer || 0;
  const horizon = Math.min(60, Math.max(30, settings.plannerDays || 30));

  const debtFlagIds = new Set(flags.filter((f) => f.system === 'debt').map((f) => f.id));
  const isDebt = (ids) => (ids || []).some((id) => debtFlagIds.has(id));

  // ---- current balance (actual movement only) -----------------------------
  const currentBalance = (settings.startingBalance || 0) + expenses.reduce(
    (s, t) => s + ((t.impact === 'down' || t.impact === 'up') ? t.amount : 0), 0);

  // ---- occurrence expansion helpers ---------------------------------------
  const expandBills = (start, end) => {
    const out = [];
    bills.forEach((b) => {
      expandSeries(b, start, end).forEach((o) => {
        const paidInfo = (b.paid || {})[o.key] || null;
        out.push({
          ...o, billId: b.id, bill: b, type: 'bill',
          categoryId: b.categoryId, inBudget: !!b.inBudget,
          flagIds: b.flagIds || [], sourceId: b.sourceId,
          paid: !!paidInfo, paidInfo, debt: isDebt(b.flagIds),
          recurring: b.recurrence && b.recurrence.freq !== 'once',
        });
      });
    });
    out.sort((a, b) => cmp(a.date, b.date) || cmp(a.name, b.name));
    return out;
  };

  const expandIncome = (start, end) => {
    const out = [];
    income.forEach((inc) => {
      expandSeries(inc, start, end).forEach((o) => {
        const rcv = (inc.received || {})[o.key] || null;
        out.push({
          ...o, incomeId: inc.id, series: inc, type: 'income',
          isPaycheck: !!inc.isPaycheck,
          received: !!rcv, receivedInfo: rcv,
          recurring: inc.recurrence && inc.recurrence.freq !== 'once',
        });
      });
    });
    out.sort((a, b) => cmp(a.date, b.date));
    return out;
  };

  // working window: recent past (overdue) → planner horizon
  const winStart = addDays(today, -40);
  const winEnd = addDays(today, Math.max(horizon, 62));
  const occ = expandBills(winStart, winEnd);
  const incOcc = expandIncome(winStart, winEnd);

  // next planned income on/after today
  const nextIncome = incOcc.find((o) => !o.received && o.date >= today) || null;
  const nextIncomeDate = nextIncome ? nextIncome.date : addDays(today, 30);
  const daysToIncome = daysBetween(today, nextIncomeDate);

  // ---- upcoming unpaid bills before next income ----------------------------
  // (flexible occurrences of the current month count immediately; overdue count)
  const isUpcomingUnpaid = (o) => !o.paid && (
    o.flexible
      ? monthKey(o.key) === monthKey(today)
      : o.date < nextIncomeDate
  );
  const upcoming = occ.filter(isUpcomingUnpaid);
  const upcomingTotal = upcoming.reduce((s, o) => s + o.amount, 0);

  const safeRaw = currentBalance - upcomingTotal - buffer;
  const safeToSpend = Math.max(0, safeRaw);

  // ---- day-by-day cash flow planner ----------------------------------------
  // unpaid bills land on max(scheduled, today); flexible on max(month start, today)
  const plannerDateOf = (o) => {
    const base = o.flexible ? o.key : o.date;
    return base < today ? today : base;
  };
  const unpaidAll = occ.filter((o) => !o.paid);
  const planner = [];
  let bal = currentBalance;
  let firstNegative = null;
  let minPoint = { date: today, balance: currentBalance };
  let shortfall = null; // first day (before next income) the balance dips below the buffer
  for (let i = 0; i < horizon; i++) {
    const d = addDays(today, i);
    const inflow = incOcc.filter((o) => !o.received && o.date === d).reduce((s, o) => s + o.amount, 0);
    const outs = unpaidAll.filter((o) => plannerDateOf(o) === d);
    const outflow = outs.reduce((s, o) => s + o.amount, 0);
    bal = bal + inflow - outflow;
    planner.push({ date: d, inflow, outflow, balance: bal, items: outs.length + (inflow ? 1 : 0) });
    if (bal < 0 && !firstNegative) firstNegative = { date: d, balance: bal };
    if (bal < minPoint.balance) minPoint = { date: d, balance: bal };
    if (!shortfall && d < nextIncomeDate && bal < buffer) shortfall = { date: d, amount: buffer - bal, belowZero: bal < 0 };
  }

  // ---- financial state ------------------------------------------------------
  const denom = Math.max(1, currentBalance - buffer);
  const committedPct = Math.max(0, Math.round((upcomingTotal / denom) * 100));
  const financialState = scenario || (
    safeRaw <= 0 ? 'Critical'
      : (committedPct >= 75 || safeRaw < buffer * 0.5) ? 'Caution'
      : 'Stable');

  const subline = {
    Stable: `until income · ${fmtShort(nextIncomeDate)} · ${daysToIncome} day${daysToIncome === 1 ? '' : 's'}`,
    Caution: `tight · keep it lean until ${fmtShort(nextIncomeDate)}`,
    Critical: shortfall
      ? `short ${money0(shortfall.amount)} by ${fmtShort(shortfall.date)}`
      : 'bills exceed safe funds · move money',
  }[financialState];

  // ---- bill groups (Bills tab / Home) ---------------------------------------
  const weekEnd = addDays(today, 6);
  const groupOf = (o) => {
    if (o.flexible) return monthKey(o.key) === monthKey(today) ? 'flex' : 'later';
    if (!o.paid && o.date < today) return 'overdue';
    if (o.date === today) return 'today';
    if (o.date > today && o.date <= weekEnd) return 'week';
    if (o.date > weekEnd && o.date < nextIncomeDate) return 'before';
    return 'later';
  };
  const visible = occ.filter((o) => (!o.paid && o.date >= winStart) || (o.paid && o.date >= today) || (o.flexible && monthKey(o.key) === monthKey(today)));
  const laterCap = addDays(today, 35);
  const groups = GROUPS.map((g) => {
    const items = visible.filter((o) => groupOf(o) === g.key && (g.key !== 'later' || o.date <= laterCap));
    return { ...g, items, total: items.reduce((s, o) => s + o.amount, 0) };
  }).filter((g) => g.items.length > 0);

  // this-month remaining
  const mNow = monthKey(today);
  const monthUnpaid = occ.filter((o) => !o.paid && monthKey(o.flexible ? o.key : o.date) === mNow);
  const remainingThisCycle = monthUnpaid.reduce((s, o) => s + o.amount, 0);
  const billsActiveCount = monthUnpaid.length;

  // ---- debt pulse (current month) -------------------------------------------
  const monthDebt = occ.filter((o) => o.debt && monthKey(o.flexible ? o.key : o.date) === mNow);
  const debt = {
    total: monthDebt.reduce((s, o) => s + o.amount, 0),
    paid: monthDebt.filter((o) => o.paid).reduce((s, o) => s + (o.paidInfo.amount != null ? o.paidInfo.amount : o.amount), 0),
  };
  debt.upcoming = Math.max(0, debt.total - debt.paid);
  debt.paidPct = debt.total ? (debt.paid / debt.total) * 100 : 0;

  // ---- month rollup (envelopes: Spent + Committed per category) ------------
  const monthRollup = (monthIso) => {
    const start = startOfMonth(monthIso);
    const end = endOfMonth(monthIso);
    const mOcc = expandBills(start, end);
    const inMonth = (t) => t.date >= start && t.date <= end;
    const rows = categories.map((c) => {
      const spent = expenses.filter((t) => inMonth(t) && t.categoryId === c.id && t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      const committed = mOcc.filter((o) => !o.paid && o.inBudget && o.categoryId === c.id)
        .reduce((s, o) => s + o.amount, 0);
      const totalUsed = spent + committed;
      return {
        ...c, spent, committed, totalUsed,
        remaining: c.budget - totalUsed,
        over: totalUsed > c.budget,
      };
    });
    const summary = {
      budget: rows.reduce((s, r) => s + r.budget, 0),
      spent: rows.reduce((s, r) => s + r.spent, 0),
      committed: rows.reduce((s, r) => s + r.committed, 0),
    };
    summary.remaining = summary.budget - summary.spent - summary.committed;
    const isPast = end < today;
    return { rows, summary, monthIso: start, isPast };
  };

  // ---- calendar items (any window; month/week views) ------------------------
  const calendarItems = (start, end) => ({
    bills: expandBills(start, end),
    income: expandIncome(start, end),
    expenses: expenses.filter((t) => t.date >= start && t.date <= end),
  });

  // ---- reporting: % of total spending by category and by flag ---------------
  const report = (start, end) => {
    const spend = expenses.filter((t) => t.date >= start && t.date <= end && t.amount < 0);
    const total = spend.reduce((s, t) => s + Math.abs(t.amount), 0);
    const byCategory = categories.map((c) => {
      const amt = spend.filter((t) => t.categoryId === c.id).reduce((s, t) => s + Math.abs(t.amount), 0);
      return { id: c.id, name: c.name, color: c.color, amount: amt, pct: total ? Math.round((amt / total) * 100) : 0 };
    }).filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);
    const uncat = spend.filter((t) => !t.categoryId).reduce((s, t) => s + Math.abs(t.amount), 0);
    if (uncat > 0) byCategory.push({ id: null, name: 'Uncategorized', color: '#5f7fae', amount: uncat, pct: total ? Math.round((uncat / total) * 100) : 0 });
    const byFlag = flags.map((f) => {
      const amt = spend.filter((t) => (t.flagIds || []).includes(f.id)).reduce((s, t) => s + Math.abs(t.amount), 0);
      return { id: f.id, name: f.name, amount: amt, pct: total ? Math.round((amt / total) * 100) : 0 };
    }).filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);
    return { total, byCategory, byFlag, count: spend.length };
  };

  // ---- quick-log favorites ---------------------------------------------------
  const freq = new Map();
  expenses.forEach((t, idx) => {
    if (t.amount >= 0 || t.billId) return;
    const key = `${t.name}|${t.amount}|${t.categoryId}|${t.sourceName}`;
    const e = freq.get(key) || { name: t.name, amount: Math.abs(t.amount), categoryId: t.categoryId, sourceId: t.sourceId, sourceName: t.sourceName, flagIds: t.flagIds || [], count: 0, recency: idx };
    e.count += 1;
    freq.set(key, e);
  });
  const quickLog = [...freq.values()].sort((a, b) => b.count - a.count || a.recency - b.recency).slice(0, 5);

  const net = expenses.filter((t) => t.date >= addDays(today, -7)).reduce((s, t) => s + t.amount, 0);

  return {
    today,
    currentBalance,
    buffer,
    safeToSpend, safeRaw, shortfall,
    upcomingTotal, committedPct, financialState, subline,
    nextIncome, nextIncomeDate, daysToIncome,
    planner, firstNegative, minPoint, horizon,
    groups, occurrences: occ, incomeOcc: incOcc,
    remainingThisCycle, billsActiveCount,
    debt,
    monthRollup, calendarItems, report,
    categoriesNow: monthRollup(today).rows,
    quickLog, net, streak,
  };
}

function money0(n) {
  return '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
}
