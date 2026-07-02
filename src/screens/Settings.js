import { html } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { StatusBar } from '../components/StatusBar.js';

function Group({ label, labelColor, children }) {
  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '2px', color: labelColor || color.textFaint }}>${label}</span>
    <div style=${{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${color.border}`, background: surface.card }}>
      ${children}
    </div>
  </div>`;
}

function Row({ children, last, onClick }) {
  return html`<div onClick=${onClick} style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderBottom: last ? 'none' : `1px solid ${color.borderSoft}`, cursor: onClick ? 'pointer' : 'default' }}>${children}</div>`;
}

const STATE_OPTIONS = [
  { label: 'LIVE', value: null },
  { label: 'STABLE', value: 'Stable' },
  { label: 'CAUTION', value: 'Caution' },
  { label: 'CRITICAL', value: 'Critical' },
];

export function Settings({ open, onNav }) {
  const { state, derived, dispatch } = useStore();
  const { settings, sources, categories, income, expenses, flags } = state;

  const editValue = (config) => open({ type: 'value', config });

  const exportCsv = () => {
    const rows = [['Date', 'Name', 'Amount', 'Category', 'Flags', 'Source', 'Impact']];
    expenses.forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const fl = (t.flagIds || []).map((id) => (flags.find((f) => f.id === id) || {}).name).filter(Boolean).join('; ');
      rows.push([t.date, t.name, t.amount, cat ? cat.name : '', fl, t.sourceName || '', t.impact]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'spendr-ledger.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const resetSample = () => {
    if (confirm('Reset to sample data? Your current data will be replaced. This cannot be undone.')) {
      dispatch({ type: 'reset' });
    }
  };

  const deleteAll = () => {
    if (confirm('Delete ALL data — bills, expenses, categories, budgets, balances? This cannot be undone.')) {
      if (confirm('Really sure? Everything will be wiped for a fresh start.')) {
        dispatch({ type: 'deleteAll' });
      }
    }
  };

  return html`<div>
    <${StatusBar} />
    <div style=${{ padding: '12px 18px 6px' }}>
      <div style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '24px', letterSpacing: '2px', color: color.textHi }}>SETTINGS</div>
    </div>

    <div style=${{ flex: 1, padding: '10px 16px 96px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <${Group} label="MONEY ENGINE">
        <${Row} onClick=${() => editValue({ field: 'startingBalance', title: 'Starting balance', label: 'AMOUNT', kind: 'money', allowNegative: true, caption: 'Where your checking starts — negative is allowed' })}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>Starting balance</span>
          <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: settings.startingBalance < 0 ? color.redText : color.safe }}>${money(settings.startingBalance, { cents: true })} ›</span>
        <//>
        <${Row}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>Current balance</span>
          <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: derived.currentBalance < 0 ? color.redText : color.textMid }}>${money(derived.currentBalance, { cents: true })}</span>
        <//>
        <${Row} onClick=${() => editValue({ field: 'requiredBuffer', title: 'Required buffer', label: 'AMOUNT', kind: 'money', caption: 'Protected · never counted as safe' })}>
          <div>
            <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>Required buffer</span>
            <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, marginTop: '2px' }}>Protected · never counted as safe</div>
          </div>
          <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: color.textMid }}>${money(settings.requiredBuffer, { cents: true })} ›</span>
        <//>
        <${Row} last onClick=${() => editValue({ field: 'plannerDays', title: 'Planner horizon', label: 'DAYS (30–60)', kind: 'number', caption: 'How far the cash-flow projection looks ahead' })}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>Cash-flow horizon</span>
          <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: color.textMid }}>${settings.plannerDays} days ›</span>
        <//>
      <//>

      <${Group} label="PAYMENT SOURCES">
        ${sources.map((src) => html`<${Row} key=${src.id} onClick=${() => open({ type: 'source', source: src })}>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style=${{ width: '8px', height: '8px', borderRadius: '50%', background: color.neutral }}></span>
            <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textHi }}>${src.name}</span>
          </div>
          <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.textDim }}>${src.label} ›</span>
        <//>`)}
        <${Row} last onClick=${() => open({ type: 'source', source: null })}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.cyan }}>+ Add payment source</span>
          <span style=${{ fontFamily: font.readout, fontSize: '12px', color: color.textFaint }}>›</span>
        <//>
      <//>

      <${Group} label="CONFIGURE">
        <${Row} onClick=${() => editValue({ field: 'userName', title: 'Your name', label: 'NAME', kind: 'text', caption: 'Used in the Home greeting' })}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>Your name</span>
          <span style=${{ fontFamily: font.readout, fontSize: '12px', color: color.textFaint }}>${settings.userName} ›</span>
        <//>
        <${Row} onClick=${() => onNav('Budget')}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>Budget categories</span>
          <span style=${{ fontFamily: font.readout, fontSize: '12px', color: color.textFaint }}>${categories.length} ›</span>
        <//>
        <${Row} last onClick=${() => open({ type: 'incomeList' })}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>Planned income</span>
          <span style=${{ fontFamily: font.readout, fontSize: '12px', color: color.textFaint }}>${income.length} ›</span>
        <//>
      <//>

      <${Group} label="FLAGS">
        ${flags.map((f) => html`<${Row} key=${f.id}
          onClick=${f.system ? undefined : () => open({ type: 'flag', flag: f })}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: f.system ? color.textDim : color.textHi }}>${f.name}</span>
          <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.textFaint }}>${f.system ? 'SYSTEM' : '›'}</span>
        <//>`)}
        <${Row} last onClick=${() => open({ type: 'flag', flag: null })}>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.cyan }}>+ Add flag</span>
          <span style=${{ fontFamily: font.readout, fontSize: '12px', color: color.textFaint }}>›</span>
        <//>
      <//>

      <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '2px', color: color.textFaint }}>STATES PREVIEW</span>
        <div style=${{ borderRadius: '14px', border: `1px solid ${color.border}`, background: surface.card, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, letterSpacing: '0.5px' }}>Preview how the dashboard reads in each financial state</div>
          <div style=${{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            ${STATE_OPTIONS.map((opt) => {
              const on = (state.scenario || null) === opt.value;
              return html`<span key=${opt.label} onClick=${() => dispatch({ type: 'setScenario', scenario: opt.value })} style=${{
                fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', padding: '6px 12px',
                borderRadius: '9px', cursor: 'pointer',
                color: on ? color.onCyan : color.textDim,
                background: on ? color.cyan : 'rgba(255,255,255,0.04)',
                border: on ? '1px solid transparent' : `1px solid ${color.border}`,
                transition: 'background 150ms ease-out, color 150ms ease-out',
              }}>${opt.label}</span>`;
            })}
          </div>
        </div>
      </div>

      <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '2px', color: color.redText }}>DATA</span>
        <div style=${{ display: 'flex', gap: '10px' }}>
          <button onClick=${exportCsv} style=${btnGhost(color.cyan, '47,225,240')}>EXPORT CSV</button>
          <button onClick=${resetSample} style=${btnGhost(color.textMid, '136,160,205')}>RESET TO SAMPLE</button>
        </div>
        <button onClick=${deleteAll} style=${{ ...btnGhost(color.redText, '255,84,112'), width: '100%' }}>DELETE ALL DATA</button>
        <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, letterSpacing: '0.4px' }}>
          Reset restores the sample dataset · Delete wipes everything for a fresh start. Both are permanent.
        </div>
      </div>
    </div>
  </div>`;
}

const btnGhost = (fg, rgb) => ({
  flex: 1, textAlign: 'center', padding: '13px', borderRadius: '12px',
  border: `1px solid rgba(${rgb},0.28)`, background: `rgba(${rgb},0.05)`,
  fontFamily: font.readout, fontSize: '12px', letterSpacing: '1px', color: fg, cursor: 'pointer',
});
