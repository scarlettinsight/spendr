// Money formatting helpers. Numbers are the product — keep them tabular + consistent.

// $1,284.50  (cents) or  $1,284  (whole)
export function money(n, { cents = false, sign = false } = {}) {
  const neg = n < 0;
  const abs = Math.abs(n);
  const body = abs.toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  const prefix = neg ? '−' : sign ? '+' : '';
  return `${prefix}$${body}`;
}

// Split "$1,284.50" into { dollars: "$1,284", cents: ".50" } for the hero readout.
export function moneyParts(n) {
  const neg = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  const dollars =
    (neg ? '−' : '') + '$' + whole.toLocaleString('en-US');
  return { dollars, cents: '.' + String(cents).padStart(2, '0') };
}

export const pct = (x) => `${Math.round(x)}%`;

// Day-of-month (July) → "Jul 4" / "Today · Jul 1" / "This month" (flexible bills)
export function dueLabel(day, todayDay) {
  if (day == null) return 'This month';
  const base = `Jul ${day}`;
  if (day === todayDay) return `Today · ${base}`;
  return base;
}
