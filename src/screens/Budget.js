import { html, React } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { StatusBar, ScreenTitle } from '../components/StatusBar.js';
import { SectionLabel } from '../primitives/SectionLabel.js';
import { ProgressBar } from '../primitives/ProgressBar.js';
import { Button } from '../primitives/Button.js';
import { Segment } from '../sheets/fields.js';
import { CategoryCard } from '../components/CategoryCard.js';
import { startOfMonth, addMonths, monthLabel, addDays, todayISO } from '../lib/dates.js';

// Budget tab: month navigation + BUDGETS (envelopes: Spent + Committed) /
// REPORT (% of total spending by category AND by flag, configurable range).
export function Budget({ open }) {
  const { state, derived } = useStore();
  const [mode, setMode] = React.useState('Budgets');
  const [month, setMonth] = React.useState(startOfMonth(derived.today));

  return html`<div>
    <${StatusBar} />
    <${ScreenTitle} title="BUDGET" subtitle=${mode === 'Budgets' ? 'monthly envelopes · spent + committed' : '% of total spending'} />

    <div style=${{ padding: '6px 16px 0' }}>
      <${Segment} options=${['Budgets', 'Report']} value=${mode} onChange=${setMode} />
    </div>

    <div style=${{ flex: 1, padding: '0 16px 96px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
      ${mode === 'Budgets'
        ? html`<${Envelopes} state=${state} derived=${derived} month=${month} setMonth=${setMonth} open=${open} />`
        : html`<${Report} derived=${derived} />`}
    </div>
  </div>`;
}

function MonthNav({ month, setMonth }) {
  const btn = (txt, fn) => html`<button onClick=${fn} style=${{
    width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${color.border}`, color: color.textMid, fontSize: '15px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>${txt}</button>`;
  return html`<div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    ${btn('‹', () => setMonth(addMonths(month, -1)))}
    <span style=${{ fontFamily: font.readout, fontSize: '13px', letterSpacing: '1px', color: color.textHi }}>${monthLabel(month)}</span>
    ${btn('›', () => setMonth(addMonths(month, 1)))}
  </div>`;
}

function Envelopes({ state, derived, month, setMonth, open }) {
  const roll = derived.monthRollup(month);
  const s = roll.summary;
  const usedPct = s.budget ? Math.min(100, ((s.spent + s.committed) / s.budget) * 100) : 0;
  const spentPct = s.budget ? Math.min(100, (s.spent / s.budget) * 100) : 0;

  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
    <${MonthNav} month=${month} setMonth=${setMonth} />

    <div style=${{ borderRadius: '16px', padding: '17px', background: surface.card, border: `1px solid ${color.border}` }}>
      <div style=${{ display: 'flex', gap: '8px' }}>
        ${stat('BUDGET', money(s.budget), color.textMid)}
        ${stat('SPENT', money(s.spent), color.amber)}
        ${stat('COMMITTED', money(s.committed), color.textDim)}
        ${stat('LEFT', money(s.remaining), s.remaining < 0 ? color.redText : color.safe)}
      </div>
      <div style=${{ marginTop: '13px' }}>
        <${ProgressBar} segments=${[
          { pct: spentPct, color: color.neutral },
          { pct: Math.max(0, usedPct - spentPct), color: 'rgba(95,127,174,0.4)' },
        ]} height=${8} />
      </div>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: color.textFaint, marginTop: '7px' }}>
        ${roll.isPast ? 'month closed · over/under shown per category' : `${Math.round(usedPct)}% of budget spoken for (spent + committed)`}
      </div>
    </div>

    <${SectionLabel} right="+ ADD" onRight=${() => open({ type: 'category', cat: null })}>CATEGORIES<//>
    <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      ${roll.rows.map((r) => html`<${CategoryCard} key=${r.id} row=${r} isPast=${roll.isPast}
        onClick=${() => open({ type: 'category', cat: state.categories.find((c) => c.id === r.id) })} />`)}
    </div>
    <${Button} variant="ghost" full onClick=${() => open({ type: 'category', cat: null })}>+ ADD CATEGORY<//>
  </div>`;
}

function stat(label, value, c) {
  return html`<div style=${{ flex: 1, minWidth: 0 }}>
    <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.6px', color: color.textFaint }}>${label}</div>
    <div style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: c, marginTop: '3px', whiteSpace: 'nowrap' }}>${value}</div>
  </div>`;
}

/* -------- report: % of total spending by category and by flag -------- */

const RANGES = [
  { key: 'month', label: 'THIS MONTH' },
  { key: 'last', label: 'LAST MONTH' },
  { key: '30', label: '30D' },
  { key: '90', label: '90D' },
];

function Report({ derived }) {
  const [range, setRange] = React.useState('month');
  const today = todayISO();
  const bounds = {
    month: [startOfMonth(today), today],
    last: [startOfMonth(addMonths(today, -1)), addDays(startOfMonth(today), -1)],
    30: [addDays(today, -29), today],
    90: [addDays(today, -89), today],
  }[range];
  const rep = derived.report(bounds[0], bounds[1]);

  const bar = (r, i) => html`<div key=${r.name + i} style=${{ marginBottom: '9px' }}>
    <div style=${{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style=${{ fontFamily: font.body, fontSize: '12.5px', color: color.textMid, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        ${r.color && html`<span style=${{ width: '7px', height: '7px', borderRadius: '2px', background: r.color }}></span>`}
        ${r.name}
      </span>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', color: color.textHi }}>${money(r.amount)} · <span style=${{ color: color.cyan }}>${r.pct}%</span></span>
    </div>
    <${ProgressBar} pct=${r.pct} color=${r.color || color.neutral} height=${5} />
  </div>`;

  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
    <div style=${{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
      ${RANGES.map((r) => html`<span key=${r.key} onClick=${() => setRange(r.key)} style=${{
        fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', padding: '6px 12px',
        borderRadius: '9px', cursor: 'pointer',
        color: range === r.key ? color.onCyan : color.textDim,
        background: range === r.key ? color.cyan : 'rgba(255,255,255,0.04)',
        border: range === r.key ? '1px solid transparent' : `1px solid ${color.border}`,
      }}>${r.label}</span>`)}
    </div>

    <div style=${{ borderRadius: '14px', padding: '14px', background: surface.card, border: `1px solid ${color.border}` }}>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.textFaint }}>TOTAL SPENDING</div>
      <div style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '26px', color: color.textHi, marginTop: '4px' }}>${money(rep.total, { cents: true })}</div>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, marginTop: '3px' }}>${rep.count} entr${rep.count === 1 ? 'y' : 'ies'}</div>
    </div>

    <${SectionLabel}>BY CATEGORY<//>
    <div>${rep.byCategory.length ? rep.byCategory.map(bar) : emptyNote('no spending in this range')}</div>

    <${SectionLabel}>BY FLAG<//>
    <div>
      ${rep.byFlag.length ? rep.byFlag.map(bar) : emptyNote('no flagged spending in this range')}
      ${rep.byFlag.length > 0 && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, marginTop: '2px' }}>an entry can carry several flags — percentages may overlap</div>`}
    </div>
  </div>`;
}

function emptyNote(text) {
  return html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, padding: '6px 2px' }}>${text}</div>`;
}
