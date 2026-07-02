import { html, React } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { StatusBar, ScreenTitle } from '../components/StatusBar.js';
import { Segment } from '../sheets/fields.js';
import { BillCard } from '../components/BillCard.js';
import { IncomeRow } from '../components/IncomeRow.js';
import { payOccurrence } from '../lib/actions.js';
import {
  monthGrid, monthLabel, monthName, addMonths, addDays, startOfMonth, monthKey,
  weekDates, fmtShort, fmtDow, dayOfMonth, todayISO,
} from '../lib/dates.js';

// Calendar tab: MONTH (grid, free navigation + jump picker) · WEEK (full weeks,
// spanning month boundaries) · FLOW (day-by-day cash projection + chart).
export function Calendar({ open }) {
  const { state, derived, dispatch } = useStore();
  const today = derived.today;
  const [mode, setMode] = React.useState('Month');
  const [anchor, setAnchor] = React.useState(startOfMonth(today)); // month view anchor
  const [week, setWeek] = React.useState(today);                    // week view anchor
  const [selected, setSelected] = React.useState(today);
  const [jumping, setJumping] = React.useState(false);

  return html`<div>
    <${StatusBar} />
    <${ScreenTitle} title="CALENDAR" subtitle=${mode === 'Flow' ? `next ${derived.horizon} days · cash flow` : 'bills · income · spending'} />

    <div style=${{ padding: '6px 16px 0' }}>
      <${Segment} options=${['Month', 'Week', 'Flow']} value=${mode} onChange=${setMode} />
    </div>

    <div style=${{ flex: 1, padding: '0 16px 96px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      ${mode === 'Month' && html`<${MonthView} state=${state} derived=${derived} dispatch=${dispatch}
        anchor=${anchor} setAnchor=${setAnchor} selected=${selected} setSelected=${setSelected}
        jumping=${jumping} setJumping=${setJumping} open=${open} today=${today} />`}
      ${mode === 'Week' && html`<${WeekView} derived=${derived} dispatch=${dispatch} week=${week} setWeek=${setWeek} open=${open} today=${today} />`}
      ${mode === 'Flow' && html`<${FlowView} derived=${derived} dispatch=${dispatch} settings=${state.settings} />`}
    </div>
  </div>`;
}

/* ---------------- shared bits ---------------- */

function NavHeader({ label, onPrev, onNext, onLabel }) {
  const btn = (txt, fn) => html`<button onClick=${fn} style=${{
    width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${color.border}`, color: color.textMid, fontSize: '15px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>${txt}</button>`;
  return html`<div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    ${btn('‹', onPrev)}
    <span onClick=${onLabel} style=${{ fontFamily: font.readout, fontSize: '13px', letterSpacing: '1px', color: color.textHi, cursor: onLabel ? 'pointer' : 'default' }}>
      ${label}${onLabel ? ' ▾' : ''}
    </span>
    ${btn('›', onNext)}
  </div>`;
}

function DayItems({ date, derived, dispatch, open, today }) {
  const items = derived.calendarItems(date, date);
  const occs = items.bills.filter((o) => !o.flexible);
  const incs = items.income;
  const spends = items.expenses.filter((t) => !t.billId && !t.incomeId);
  const empty = occs.length + incs.length + spends.length === 0;

  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    ${occs.map((o) => html`<${BillCard} key=${o.billId + o.key} occ=${o}
      onClick=${() => open({ type: 'bill', occ: o })}
      onPay=${(x) => payOccurrence(dispatch, derived, x)} />`)}
    ${incs.map((o) => html`<${IncomeRow} key=${o.incomeId + o.key} occ=${o} onOpen=${(x) => open({ type: 'income', occ: x })} />`)}
    ${spends.map((t) => html`<div key=${t.id} onClick=${() => open({ type: 'tx', tx: t })} style=${{
      display: 'flex', justifyContent: 'space-between', padding: '10px 13px', borderRadius: '11px',
      background: surface.card, border: `1px solid ${color.borderSoft}`, cursor: 'pointer',
    }}>
      <span style=${{ fontFamily: font.body, fontSize: '12.5px', color: color.textMid }}>${t.name}</span>
      <span style=${{ fontFamily: font.readout, fontSize: '12.5px', fontWeight: 600, color: t.amount > 0 ? color.safe : color.textHi }}>${money(t.amount, { cents: true, sign: t.amount > 0 })}</span>
    </div>`)}
    ${empty && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, textAlign: 'center', padding: '10px' }}>nothing on ${fmtShort(date)}</div>`}
    ${date >= today && html`<button onClick=${() => open({ type: 'add', kind: 'Bill', date })} style=${{
      padding: '9px', borderRadius: '10px', border: `1px dashed rgba(47,225,240,0.3)`,
      background: 'rgba(47,225,240,0.04)', color: color.cyan, cursor: 'pointer',
      fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px',
    }}>+ ADD BILL ON ${fmtShort(date).toUpperCase()}</button>`}
  </div>`;
}

/* ---------------- month ---------------- */

function MonthView({ state, derived, dispatch, anchor, setAnchor, selected, setSelected, jumping, setJumping, open, today }) {
  const grid = monthGrid(anchor);
  const mk = monthKey(anchor);
  const monthEndIso = addDays(addMonths(anchor, 1), -1);
  const items = derived.calendarItems(grid[0][0], grid[5][6]);
  const flexOccs = items.bills.filter((o) => o.flexible && monthKey(o.key) === mk);

  const dayMarks = (d) => {
    const bills = items.bills.filter((o) => !o.flexible && o.date === d);
    const incs = items.income.filter((o) => o.date === d);
    const spends = items.expenses.filter((t) => t.date === d && !t.billId && !t.incomeId);
    return { bills, incs, spends };
  };

  const years = [];
  const y0 = Number(anchor.slice(0, 4));
  for (let y = y0 - 1; y <= y0 + 2; y++) years.push(y);

  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <${NavHeader} label=${monthLabel(anchor)}
      onPrev=${() => setAnchor(addMonths(anchor, -1))}
      onNext=${() => setAnchor(addMonths(anchor, 1))}
      onLabel=${() => setJumping(!jumping)} />

    ${jumping && html`<div style=${{ borderRadius: '12px', border: `1px solid ${color.border}`, background: surface.card, padding: '12px' }}>
      <div style=${{ display: 'flex', gap: '7px', justifyContent: 'center', marginBottom: '10px' }}>
        ${years.map((y) => html`<span key=${y} onClick=${() => setAnchor(`${y}-${anchor.slice(5, 7)}-01`)} style=${{
          fontFamily: font.readout, fontSize: '11px', padding: '5px 11px', borderRadius: '8px', cursor: 'pointer',
          color: String(y) === anchor.slice(0, 4) ? color.onCyan : color.textDim,
          background: String(y) === anchor.slice(0, 4) ? color.cyan : 'rgba(255,255,255,0.04)',
        }}>${y}</span>`)}
      </div>
      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        ${Array.from({ length: 12 }, (_, i) => {
          const m = String(i + 1).padStart(2, '0');
          const iso = `${anchor.slice(0, 4)}-${m}-01`;
          const on = anchor.slice(5, 7) === m;
          return html`<span key=${m} onClick=${() => { setAnchor(iso); setJumping(false); }} style=${{
            textAlign: 'center', fontFamily: font.readout, fontSize: '11px', padding: '8px 0',
            borderRadius: '8px', cursor: 'pointer',
            color: on ? color.onCyan : color.textMid,
            background: on ? color.cyan : 'rgba(255,255,255,0.03)',
          }}>${monthName(iso).slice(0, 3)}</span>`;
        })}
      </div>
    </div>`}

    <!-- grid -->
    <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
      ${['S','M','T','W','T','F','S'].map((d, i) => html`<span key=${'h'+i} style=${{ textAlign: 'center', fontFamily: font.readout, fontSize: '10px', color: color.textFaint, paddingBottom: '3px' }}>${d}</span>`)}
      ${grid.flat().map((d) => {
        const inMonth = monthKey(d) === mk;
        const m = dayMarks(d);
        const isSel = d === selected;
        return html`<div key=${d} onClick=${() => setSelected(d)} style=${{
          minHeight: '42px', borderRadius: '8px', padding: '4px 2px', cursor: 'pointer',
          background: isSel ? 'rgba(47,225,240,0.1)' : d === today ? 'rgba(47,225,240,0.05)' : 'transparent',
          border: isSel ? '1px solid rgba(47,225,240,0.4)' : `1px solid ${inMonth ? color.borderSoft : 'transparent'}`,
          textAlign: 'center',
        }}>
          <div style=${{ fontFamily: font.readout, fontSize: '11px', fontWeight: d === today ? 700 : 400, color: d === today ? color.cyan : inMonth ? color.textMid : color.textFaint }}>${dayOfMonth(d)}</div>
          <div style=${{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '3px', flexWrap: 'wrap' }}>
            ${m.bills.slice(0, 2).map((o, i) => html`<span key=${'b'+i} style=${{ width: '4px', height: '4px', borderRadius: '50%', background: o.paid ? color.safe : o.debt ? color.red : color.amber }}></span>`)}
            ${m.incs.slice(0, 1).map((o, i) => html`<span key=${'i'+i} style=${{ width: '4px', height: '4px', borderRadius: '1px', background: color.safe }}></span>`)}
            ${m.spends.length > 0 && html`<span style=${{ width: '4px', height: '4px', borderRadius: '50%', background: color.neutral }}></span>`}
          </div>
        </div>`;
      })}
    </div>

    ${flexOccs.length > 0 && html`<div>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1.5px', color: color.textFaint, marginBottom: '8px' }}>ANYTIME IN ${monthName(anchor).toUpperCase()}</div>
      <div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        ${flexOccs.map((o) => html`<${BillCard} key=${o.billId + o.key} occ=${o}
          onClick=${() => open({ type: 'bill', occ: o })}
          onPay=${(x) => payOccurrence(dispatch, derived, x)} />`)}
      </div>
    </div>`}

    <div>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1.5px', color: color.textFaint, marginBottom: '8px' }}>${fmtDow(selected).toUpperCase()} · ${fmtShort(selected).toUpperCase()}</div>
      <${DayItems} date=${selected} derived=${derived} dispatch=${dispatch} open=${open} today=${today} />
    </div>
  </div>`;
}

/* ---------------- week (spans month boundaries) ---------------- */

function WeekView({ derived, dispatch, week, setWeek, open, today }) {
  const days = weekDates(week);
  const label = `${fmtShort(days[0])} – ${fmtShort(days[6])}`;
  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <${NavHeader} label=${label}
      onPrev=${() => setWeek(addDays(week, -7))}
      onNext=${() => setWeek(addDays(week, 7))} />
    ${days.map((d) => html`<div key=${d}>
      <div style=${{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '7px' }}>
        <span style=${{ fontFamily: font.readout, fontSize: '11px', fontWeight: d === today ? 700 : 500, letterSpacing: '1px', color: d === today ? color.cyan : color.textDim }}>${fmtDow(d).toUpperCase()} ${dayOfMonth(d)}</span>
        <span style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint }}>${monthName(d).slice(0, 3)}</span>
        <span style=${{ flex: 1, height: '1px', background: color.divider }}></span>
      </div>
      <${DayItems} date=${d} derived=${derived} dispatch=${dispatch} open=${open} today=${today} />
    </div>`)}
  </div>`;
}

/* ---------------- flow (day-by-day cash planner) ---------------- */

function FlowView({ derived, dispatch, settings }) {
  const { planner, firstNegative, minPoint, buffer } = derived;

  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style=${{ display: 'flex', gap: '7px', alignItems: 'center' }}>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.textFaint }}>HORIZON</span>
      ${[30, 45, 60].map((n) => html`<span key=${n} onClick=${() => dispatch({ type: 'updateSettings', patch: { plannerDays: n } })} style=${{
        fontFamily: font.readout, fontSize: '10px', padding: '5px 11px', borderRadius: '8px', cursor: 'pointer',
        color: settings.plannerDays === n ? color.onCyan : color.textDim,
        background: settings.plannerDays === n ? color.cyan : 'rgba(255,255,255,0.04)',
        border: settings.plannerDays === n ? '1px solid transparent' : `1px solid ${color.border}`,
      }}>${n}D</span>`)}
    </div>

    ${firstNegative && html`<div style=${{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 14px', borderRadius: '13px',
      background: 'rgba(255,84,112,0.06)', border: '1px solid rgba(255,84,112,0.28)',
    }}>
      <span style=${{ fontSize: '14px' }}>⚠️</span>
      <div>
        <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '13px', color: color.redText }}>
          Projected balance: ${money(firstNegative.balance, { cents: true })} on ${fmtShort(firstNegative.date)}
        </div>
        <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, marginTop: '2px' }}>
          lowest point ${money(minPoint.balance, { cents: true })} on ${fmtShort(minPoint.date)}
        </div>
      </div>
    </div>`}

    <${FlowChart} planner=${planner} buffer=${buffer} start=${derived.currentBalance} />

    <!-- table: date · in · out · running balance -->
    <div style=${{ borderRadius: '14px', border: `1px solid ${color.border}`, background: surface.card, overflow: 'hidden' }}>
      <div style=${{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1.2fr', padding: '9px 13px', borderBottom: `1px solid ${color.borderSoft}` }}>
        ${['DATE', 'IN', 'OUT', 'BALANCE'].map((h, i) => html`<span key=${h} style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.textFaint, textAlign: i === 0 ? 'left' : 'right' }}>${h}</span>`)}
      </div>
      ${planner.map((d) => html`<div key=${d.date} style=${{
        display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1.2fr', padding: '7px 13px',
        background: d.balance < 0 ? 'rgba(255,84,112,0.05)' : 'transparent',
        borderBottom: `1px solid ${color.borderSoft}`,
      }}>
        <span style=${{ fontFamily: font.readout, fontSize: '11px', color: (d.inflow || d.outflow) ? color.textMid : color.textFaint }}>${fmtShort(d.date)}</span>
        <span style=${{ fontFamily: font.readout, fontSize: '11px', textAlign: 'right', color: d.inflow ? color.safe : color.textFaint }}>${d.inflow ? '+' + money(d.inflow) : '—'}</span>
        <span style=${{ fontFamily: font.readout, fontSize: '11px', textAlign: 'right', color: d.outflow ? color.textMid : color.textFaint }}>${d.outflow ? '−' + money(d.outflow) : '—'}</span>
        <span style=${{ fontFamily: font.readout, fontSize: '11px', fontWeight: 600, textAlign: 'right', color: d.balance < 0 ? color.redText : d.balance < buffer ? color.amber : color.textMid }}>${money(d.balance, { cents: true })}</span>
      </div>`)}
    </div>
  </div>`;
}

// SVG line chart with the zero line marked (and the buffer as a faint guide).
function FlowChart({ planner, buffer, start }) {
  const W = 340, H = 130, PAD = 6;
  const vals = [start, ...planner.map((d) => d.balance)];
  const max = Math.max(...vals, buffer, 1);
  const min = Math.min(...vals, 0);
  const span = Math.max(1, max - min);
  const x = (i) => PAD + (i / Math.max(1, vals.length - 1)) * (W - PAD * 2);
  const y = (v) => PAD + (1 - (v - min) / span) * (H - PAD * 2);
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const zeroY = y(0);
  const bufY = y(buffer);
  const minIdx = vals.indexOf(Math.min(...vals));
  const negative = Math.min(...vals) < 0;

  return html`<div style=${{ borderRadius: '14px', border: `1px solid ${color.border}`, background: surface.card, padding: '10px' }}>
    <svg viewBox=${`0 0 ${W} ${H}`} style=${{ width: '100%', display: 'block' }}>
      ${buffer > 0 && html`<line x1="0" x2=${W} y1=${bufY} y2=${bufY} stroke="rgba(136,160,205,0.25)" stroke-width="1" stroke-dasharray="2 4" />`}
      <line x1="0" x2=${W} y1=${zeroY} y2=${zeroY} stroke=${negative ? 'rgba(255,84,112,0.6)' : 'rgba(136,160,205,0.4)'} stroke-width="1" stroke-dasharray="4 3" />
      <polyline points=${pts} fill="none" stroke=${negative ? color.red : color.safe} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle cx=${x(minIdx)} cy=${y(vals[minIdx])} r="3" fill=${vals[minIdx] < 0 ? color.red : color.safe} />
    </svg>
    <div style=${{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint }}>today</span>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint }}>zero line ┄ · buffer ┈</span>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint }}>+${planner.length}d</span>
    </div>
  </div>`;
}
