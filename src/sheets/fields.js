import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';

// Shared sheet field primitives — V2: selected = solid cyan (interactive),
// inactive = one neutral style. Flat, no gradients, 10px floors.

export function FieldLabel({ children }) {
  return html`<div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1.5px', color: color.textFaint, marginBottom: '8px' }}>${children}</div>`;
}

// Segmented control. Active segment = solid cyan, near-black text.
export function Segment({ options, value, onChange }) {
  return html`<div style=${{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
    ${options.map((o) => {
      const on = o === value;
      return html`<div key=${o} onClick=${() => onChange(o)} style=${{
        flex: 1, textAlign: 'center', padding: '9px', borderRadius: '9px', cursor: 'pointer',
        background: on ? color.cyan : 'transparent',
        color: on ? color.onCyan : color.textDim,
        fontFamily: font.readout, fontSize: '12px', letterSpacing: '1px', fontWeight: on ? 600 : 400,
        transition: 'background 150ms ease-out, color 150ms ease-out',
      }}>${o.toUpperCase()}</div>`;
    })}
  </div>`;
}

// One-shot cyan tap ripple (M2 quick-log) — usable on any pill.
export function useRipple() {
  const [ripples, setRipples] = React.useState([]);
  const fire = () => {
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, id]);
    setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 400);
  };
  const render = () => ripples.map((id) => html`<span key=${id} style=${{
    position: 'absolute', left: '50%', top: '50%', width: '46px', height: '46px',
    marginLeft: '-23px', marginTop: '-23px', borderRadius: '50%',
    background: color.cyan, pointerEvents: 'none',
    animation: 'sp-ripple 150ms ease-out forwards',
  }}></span>`);
  return [fire, render];
}

// Selectable pill. Active = solid cyan; inactive = neutral. Optional ripple and
// a small color dot (category identity).
export function SelectPill({ label, active, onClick, ripple = false, dot }) {
  const [fire, renderRipples] = useRipple();
  const handle = () => {
    if (ripple) fire();
    onClick && onClick();
  };
  return html`<span onClick=${handle} style=${{
    position: 'relative', overflow: 'hidden',
    fontFamily: font.readout, fontSize: '11px', padding: '7px 13px', borderRadius: '9px', cursor: 'pointer',
    color: active ? color.onCyan : color.textDim,
    background: active ? color.cyan : 'rgba(255,255,255,0.04)',
    border: active ? '1px solid transparent' : `1px solid ${color.border}`,
    transition: 'background 150ms ease-out, color 150ms ease-out',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
  }}>
    ${dot && html`<span style=${{ width: '7px', height: '7px', borderRadius: '50%', background: dot, flex: '0 0 auto', border: active ? '1px solid rgba(5,16,24,0.4)' : 'none' }}></span>`}
    ${label}${renderRipples()}
  </span>`;
}

// Emerald switch row (same pattern as "Deduct from checking now").
export function ToggleRow({ label, caption, on, onChange }) {
  return html`<div onClick=${() => onChange(!on)} style=${{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px',
    borderRadius: '11px', background: on ? 'rgba(59,232,166,0.05)' : 'rgba(255,255,255,0.03)',
    border: on ? '1px solid rgba(59,232,166,0.2)' : `1px solid ${color.border}`,
    cursor: 'pointer', transition: 'border-color 150ms ease-out, background 150ms ease-out',
  }}>
    <div>
      <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>${label}</span>
      ${caption && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, marginTop: '2px', letterSpacing: '0.3px' }}>${caption}</div>`}
    </div>
    <div style=${{
      width: '42px', height: '24px', borderRadius: '14px', padding: '2px', display: 'flex',
      justifyContent: on ? 'flex-end' : 'flex-start', flex: '0 0 auto',
      background: on ? color.safe : 'rgba(136,160,205,0.2)',
      transition: 'all 150ms ease-out',
    }}>
      <div style=${{ width: '20px', height: '20px', borderRadius: '50%', background: color.onCyan }}></div>
    </div>
  </div>`;
}

// Source selector tile. Selected = cyan hairline + 5% cyan bg; neutral dot.
export function SourceTile({ source, active, onClick, expand = true }) {
  return html`<div onClick=${onClick} style=${{
    flex: expand ? 1 : '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
    borderRadius: '11px', cursor: 'pointer',
    background: active ? 'rgba(47,225,240,0.05)' : 'rgba(255,255,255,0.03)',
    border: active ? '1px solid rgba(47,225,240,0.3)' : `1px solid ${color.border}`,
    transition: 'border-color 150ms ease-out, background 150ms ease-out',
  }}>
    <span style=${{ width: '7px', height: '7px', borderRadius: '50%', background: color.neutral }}></span>
    <span style=${{ fontFamily: font.body, fontSize: '13px', color: active ? color.textHi : color.textDim }}>${source.name}</span>
  </div>`;
}

// Editable text row.
export function TextField({ label, value, onChange, placeholder, inputMode }) {
  return html`<div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}` }}>
    <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim, flex: '0 0 auto' }}>${label}</span>
    <input value=${value} onChange=${(e) => onChange(e.target.value)} placeholder=${placeholder}
      inputMode=${inputMode} autoComplete="off" autoCorrect="off" spellCheck="false"
      style=${{ flex: 1, minWidth: 0, textAlign: 'right', background: 'transparent', border: 'none', outline: 'none', fontFamily: font.body, fontSize: '13px', color: color.textHi, padding: '4px 0' }} />
  </div>`;
}

// Currency sanitizer: digits + one decimal point, max 2 decimals.
// allowNegative permits a single leading minus (e.g. negative starting balance).
export function sanitizeMoney(v, allowNegative = false) {
  const neg = allowNegative && /^\s*-/.test(String(v));
  let s = String(v).replace(/[^0-9.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    s = s.slice(0, firstDot + 3); // at most 2 decimals
  }
  return neg ? '-' + s : s;
}

// Dedicated money row: $-prefixed, decimal keypad on phones, one dot / 2 decimals.
export function MoneyField({ label, value, onChange, placeholder = '0.00', allowNegative = false }) {
  return html`<div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}` }}>
    <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim, flex: '0 0 auto' }}>${label}</span>
    <div style=${{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
      <span style=${{ fontFamily: font.readout, fontSize: '13px', color: color.textFaint }}>$</span>
      <input value=${value} onChange=${(e) => onChange(sanitizeMoney(e.target.value, allowNegative))} placeholder=${placeholder}
        inputMode=${allowNegative ? 'text' : 'decimal'} autoComplete="off" autoCorrect="off" spellCheck="false"
        style=${{ width: '110px', textAlign: 'right', background: 'transparent', border: 'none', outline: 'none', fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: color.textHi, padding: '4px 0' }} />
    </div>
  </div>`;
}

// Day-of-month stepper (DUE · Jul N with − / +).
export function DayStepper({ label = 'DUE', day, onChange, min = 1, max = 31 }) {
  const btn = (txt, delta) => html`<button onClick=${() => onChange(Math.min(max, Math.max(min, day + delta)))} style=${{
    width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${color.border}`, color: color.textMid, fontSize: '15px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>${txt}</button>`;
  return html`<div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}` }}>
    <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim }}>${label}</span>
    <div style=${{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      ${btn('−', -1)}
      <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '13px', color: color.textHi, minWidth: '48px', textAlign: 'center' }}>Jul ${day}</span>
      ${btn('+', +1)}
    </div>
  </div>`;
}

// Read-only field row (PAID FROM / DATE / AMOUNT style).
export function FieldRow({ label, value }) {
  return html`<div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}` }}>
    <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim }}>${label}</span>
    <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textHi }}>${value}</span>
  </div>`;
}

// Big amount readout with a hidden input for editing. V2: flat (glow budget).
// Displays the RAW string as typed (so a pending "12." is visible mid-entry);
// sanitizer enforces one decimal point and max 2 decimals.
export function AmountInput({ value, onChange }) {
  const raw = String(value || '');
  const [wholeRaw, decRaw] = raw.split('.');
  const hasDot = raw.includes('.');
  const whole = wholeRaw ? Number(wholeRaw).toLocaleString('en-US') : '0';
  const centsShown = hasDot ? '.' + (decRaw || '') : '';
  const centsPad = hasDot ? ''.padStart(Math.max(0, 2 - (decRaw || '').length), '0') : '.00';

  return html`<label style=${{ display: 'block', textAlign: 'center', padding: '14px 0 18px', cursor: 'text' }}>
    <div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '2px', color: color.textFaint }}>AMOUNT</div>
    <div style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '52px', color: color.textHi, marginTop: '6px' }}>
      $${whole}<span style=${{ color: color.textDim }}>${centsShown}</span><span style=${{ color: color.textFaint }}>${centsPad}</span>
      <span style=${{ display: 'inline-block', width: '2px', height: '38px', background: color.cyan, marginLeft: '3px', verticalAlign: '-6px', animation: 'spendr-caret 1s step-end infinite' }}></span>
    </div>
    <input value=${value} onChange=${(e) => onChange(sanitizeMoney(e.target.value))}
      inputMode="decimal" autoFocus autoComplete="off" autoCorrect="off"
      style=${{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }} />
  </label>`;
}

/* ---------------- V3 controls: date + recurrence ---------------- */

import { monthGrid, monthLabel, addMonths, dayOfMonth, monthKey as mKey, todayISO, fmtShort } from '../lib/dates.js';
import { freqLabel } from '../lib/recur.js';

// Mini month-calendar date picker. Navigates any month (‹ › + shown label);
// any date is selectable — not just the viewed month.
export function DatePicker({ value, onChange, min }) {
  const [view, setView] = React.useState((value || todayISO()).slice(0, 8) + '01');
  const today = todayISO();
  const grid = monthGrid(view);
  const vm = mKey(view);

  return html`<div style=${{ borderRadius: '12px', border: `1px solid ${color.border}`, background: 'rgba(255,255,255,0.02)', padding: '10px 12px' }}>
    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <button onClick=${() => setView(addMonths(view, -1))} style=${navBtn}>‹</button>
      <span style=${{ fontFamily: font.readout, fontSize: '12px', letterSpacing: '1px', color: color.textHi }}>${monthLabel(view)}</span>
      <button onClick=${() => setView(addMonths(view, 1))} style=${navBtn}>›</button>
    </div>
    <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
      ${['S','M','T','W','T','F','S'].map((d, i) => html`<span key=${'h'+i} style=${{ textAlign: 'center', fontFamily: font.readout, fontSize: '10px', color: color.textFaint }}>${d}</span>`)}
      ${grid.flat().map((d) => {
        const inMonth = mKey(d) === vm;
        const selected = d === value;
        const disabled = min && d < min;
        return html`<span key=${d} onClick=${disabled ? undefined : () => onChange(d)} style=${{
          textAlign: 'center', padding: '6px 0', borderRadius: '7px',
          fontFamily: font.readout, fontSize: '12px',
          cursor: disabled ? 'default' : 'pointer',
          color: selected ? color.onCyan : disabled ? 'rgba(91,104,128,0.4)' : inMonth ? color.textMid : color.textFaint,
          background: selected ? color.cyan : d === today ? 'rgba(47,225,240,0.08)' : 'transparent',
          fontWeight: selected || d === today ? 600 : 400,
        }}>${dayOfMonth(d)}</span>`;
      })}
    </div>
    ${value && html`<div style=${{ marginTop: '7px', textAlign: 'center', fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: color.textDim }}>${fmtShort(value)}</div>`}
  </div>`;
}

const navBtn = {
  width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(136,160,205,0.12)', color: '#c3cee2', fontSize: '14px',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// Recurrence picker: Once / Weekly / Every 2 weeks / Monthly / Yearly / Custom (N days)
// + "anytime this month" variant for monthly.
const FREQS = [
  { key: 'once', label: 'Once' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: '2 weeks' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
];

export function RecurrencePicker({ rec, onChange }) {
  const set = (patch) => onChange({ ...rec, ...patch });
  return html`<div>
    <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
      ${FREQS.map((f) => html`<${SelectPill} key=${f.key} label=${f.label}
        active=${rec.freq === f.key} onClick=${() => set({ freq: f.key, flexible: false })} />`)}
    </div>
    ${rec.freq === 'custom' && html`<div style=${{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '9px' }}>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim }}>EVERY</span>
      <input value=${rec.interval || ''} onChange=${(e) => set({ interval: Math.max(1, parseInt(e.target.value.replace(/\D/g, '') || '0', 10) || 0) })}
        inputMode="numeric" placeholder="30"
        style=${{ width: '58px', textAlign: 'center', padding: '7px', borderRadius: '9px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}`, outline: 'none', fontFamily: font.readout, fontSize: '13px', color: color.textHi }} />
      <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim }}>DAYS</span>
    </div>`}
    ${rec.freq === 'monthly' && html`<div style=${{ marginTop: '9px' }}>
      <${SelectPill} label="Anytime this month (no fixed day)" active=${!!rec.flexible} onClick=${() => set({ flexible: !rec.flexible })} />
    </div>`}
    <div style=${{ marginTop: '7px', fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.4px', color: color.textFaint }}>${freqLabel(rec)}</div>
  </div>`;
}
