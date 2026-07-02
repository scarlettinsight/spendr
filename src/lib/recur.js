// Recurrence engine. A series (bill or income) is:
//   { recurrence: { freq: 'once'|'weekly'|'biweekly'|'monthly'|'yearly'|'custom',
//                   anchorDate: ISO, interval?: days (custom), flexible?: bool },
//     endDate?: ISO | null,
//     overrides: { [key]: { date?, amount?, name?, skipped? } },   // key = ORIGINAL scheduled date
//     paid?: { [key]: { expenseId, amount, date } } }              // bills
//     received?: { [key]: { txId, amount, date } }                 // income
//
// Occurrence keys are the original scheduled ISO date — stable across date
// overrides, so occurrence-level edits survive later series edits (split-series
// copies the relevant override/paid entries forward).

import { addDays, addMonths, addYears, cmp, endOfMonth, monthKey, startOfMonth } from './dates.js';

const MAX_OCC = 500;

function stepFor(freq, interval) {
  if (freq === 'weekly') return (iso) => addDays(iso, 7);
  if (freq === 'biweekly') return (iso) => addDays(iso, 14);
  if (freq === 'monthly') return (iso) => addMonths(iso, 1);
  if (freq === 'yearly') return (iso) => addYears(iso, 1);
  if (freq === 'custom') return (iso) => addDays(iso, Math.max(1, interval || 30));
  return null; // once
}

export function freqLabel(rec) {
  if (!rec || rec.freq === 'once') return 'One-time';
  if (rec.flexible) return 'Monthly · anytime';
  const map = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', yearly: 'Yearly' };
  if (rec.freq === 'custom') return `Every ${rec.interval || 30} days`;
  return map[rec.freq] || 'One-time';
}

// Expand one series into occurrences whose EFFECTIVE date falls in [start, end].
// Flexible monthly series produce one occurrence per month keyed to the 1st,
// with `flexible: true` (callers place them: calendar strip / planner-today).
export function expandSeries(series, start, end) {
  const rec = series.recurrence || { freq: 'once', anchorDate: series.anchorDate };
  const overrides = series.overrides || {};
  const seriesEnd = series.endDate || null;
  const out = [];

  const push = (key, date) => {
    const o = overrides[key] || {};
    if (o.skipped) return;
    const eff = o.date || date;
    if (eff < start || eff > end) return;
    out.push({
      key,
      date: eff,
      scheduledDate: date,
      amount: o.amount != null ? o.amount : series.amount,
      name: o.name != null ? o.name : series.name,
      flexible: !!rec.flexible,
      overridden: !!(o.amount != null || o.date || o.name != null),
    });
  };

  if (rec.flexible) {
    // one per month from anchor month
    let m = startOfMonth(rec.anchorDate);
    // widen scan so a date-override into range isn't missed
    const scanEnd = endOfMonth(end);
    let i = 0;
    while (m <= scanEnd && i++ < MAX_OCC) {
      if (!seriesEnd || m <= seriesEnd) push(m, m);
      m = addMonths(m, 1);
    }
    return out;
  }

  const step = stepFor(rec.freq, rec.interval);
  if (!step) { // once
    if (!seriesEnd || rec.anchorDate <= seriesEnd) push(rec.anchorDate, rec.anchorDate);
    return out;
  }

  let d = rec.anchorDate;
  let i = 0;
  // scan a bit past the window so date-overrides pulling occurrences in aren't missed
  const scanEnd = addDays(end, 45);
  while (d <= scanEnd && i++ < MAX_OCC) {
    if (seriesEnd && d > seriesEnd) break;
    push(d, d);
    d = step(d);
  }
  return out;
}

// next occurrence on/after `from` (effective date), or null
export function nextOccurrence(series, from, horizonDays = 400) {
  const occ = expandSeries(series, from, addDays(from, horizonDays));
  occ.sort((a, b) => cmp(a.date, b.date));
  return occ[0] || null;
}

// Google-Calendar "this and all future": truncate the original series the day
// before `fromKey`, and return a new series starting there with `patch` applied.
// Occurrence-level overrides/paid/received entries for future keys are carried
// into the new series so they persist (per spec).
export function splitSeries(series, fromKey, patch, newId) {
  const before = { ...series, endDate: addDays(fromKey, -1) };

  const carry = (map) => {
    const kept = {};
    Object.entries(map || {}).forEach(([k, v]) => { if (k >= fromKey) kept[k] = v; });
    return kept;
  };

  const rec = series.recurrence || {};
  const after = {
    ...series,
    ...patch,
    id: newId,
    recurrence: {
      ...rec,
      ...(patch.recurrence || {}),
      anchorDate: (patch.recurrence && patch.recurrence.anchorDate) || fromKey,
    },
    endDate: series.endDate || null,
    overrides: carry(series.overrides),
    paid: carry(series.paid),
    received: carry(series.received),
  };
  return { before, after };
}

// does this month contain any occurrence of the series?
export function occursInMonth(series, monthIso) {
  return expandSeries(series, startOfMonth(monthIso), endOfMonth(monthIso)).length > 0;
}

export { monthKey };
