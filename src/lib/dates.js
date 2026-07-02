// Date utilities. Canonical storage format: ISO 'YYYY-MM-DD' strings (local time).

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = () => toISO(new Date());

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// month add with day-of-month clamping (Jan 31 + 1mo → Feb 28)
export function addMonths(iso, n) {
  const [y, m, day] = iso.split('-').map(Number);
  const target = new Date(y, m - 1 + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, last));
  return toISO(target);
}

export function addYears(iso, n) {
  return addMonths(iso, n * 12);
}

export function daysBetween(a, b) {
  return Math.round((fromISO(b) - fromISO(a)) / 86400000);
}

export const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;

export function startOfMonth(iso) {
  return iso.slice(0, 8) + '01';
}

export function endOfMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return toISO(new Date(y, m, 0));
}

export function monthKey(iso) { return iso.slice(0, 7); } // 'YYYY-MM'

// week starts Sunday
export function startOfWeek(iso) {
  const d = fromISO(iso);
  return addDays(iso, -d.getDay());
}

export function weekDates(iso) {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// 6×7 month grid including leading/trailing out-of-month days
export function monthGrid(iso) {
  const first = startOfMonth(iso);
  let cur = startOfWeek(first);
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) { row.push(cur); cur = addDays(cur, 1); }
    rows.push(row);
  }
  return rows;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW_S = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function monthLabel(iso) {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function monthName(iso) {
  return MONTHS[Number(iso.slice(5, 7)) - 1];
}

// 'Jul 4' — with year appended when it differs from the current year
export function fmtShort(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const yy = new Date().getFullYear() === y ? '' : ` ${y}`;
  return `${MONTHS_S[m - 1]} ${d}${yy}`;
}

export function fmtDow(iso) {
  return DOW_S[fromISO(iso).getDay()];
}

export function dayOfMonth(iso) { return Number(iso.slice(8, 10)); }

// due label relative to today
export function dueLabelISO(iso, today) {
  if (iso == null) return 'This month';
  if (iso === today) return `Today · ${fmtShort(iso)}`;
  if (iso === addDays(today, 1)) return `Tomorrow · ${fmtShort(iso)}`;
  if (iso < today) return `Overdue · ${fmtShort(iso)}`;
  return fmtShort(iso);
}
