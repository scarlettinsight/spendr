// Shared money actions with their delight attached.
import { pushCelebration, pushToast, pushPayday } from './toast.js';
import { money } from './format.js';
import { fmtShort } from './dates.js';

// Pay a bill occurrence: atomic paid-mark + linked ledger expense, M1 once,
// then a 5s undo toast that reverses both.
export function payOccurrence(dispatch, derived, occ, { amount, date, deductNow = true } = {}) {
  const paidAmount = amount != null ? amount : occ.amount;
  const paidDate = date || derived.today;
  const expenseId = 'tx' + Date.now();

  dispatch({
    type: 'payOccurrence',
    billId: occ.billId, key: occ.key, name: occ.name,
    amount: paidAmount, date: paidDate, expenseId, deductNow,
  });

  const debtPct = occ.debt && derived.debt.total > 0
    ? Math.min(100, Math.round(((derived.debt.paid + paidAmount) / derived.debt.total) * 100))
    : null;

  pushCelebration({
    type: 'paid',
    name: occ.name,
    amount: paidAmount,
    debtPct,
    onDone: () => pushToast({
      detail: `${occ.name} · ${money(paidAmount, { cents: true })} paid`,
      undo: () => dispatch({ type: 'unpayOccurrence', billId: occ.billId, key: occ.key }),
    }),
  });
}

// Receive an income occurrence: ledger entry + balance + M4 payday.
export function receiveOccurrence(dispatch, occ, { amount, date } = {}) {
  const amt = amount != null ? amount : occ.amount;
  const when = date || occ.date;
  const txId = 'tx' + Date.now();
  dispatch({ type: 'receiveOccurrence', incomeId: occ.incomeId, key: occ.key, amount: amt, date: when, txId });
  pushPayday();
  pushToast({
    detail: `${occ.name} · +${money(amt, { cents: true })} received`,
    undo: () => dispatch({ type: 'unreceiveOccurrence', incomeId: occ.incomeId, key: occ.key }),
  });
}

export function occDueText(occ, today) {
  if (occ.flexible) return 'This month';
  if (occ.date === today) return `Today · ${fmtShort(occ.date)}`;
  if (occ.date < today) return `Overdue · ${fmtShort(occ.date)}`;
  return fmtShort(occ.date);
}
