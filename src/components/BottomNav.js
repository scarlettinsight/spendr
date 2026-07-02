import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';

// V3: six tabs. Flat; active = cyan + indicator bar; 150ms transitions.
const ICONS = {
  Home: html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" transform="rotate(45 12 12)" stroke="currentColor" stroke-width="1.7"/></svg>`,
  Calendar: html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="14" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M4 10.5h16" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 4v3M15.5 4v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  Bills: html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="3" rx="1.5" fill="currentColor"/><rect x="4" y="12" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.6"/><rect x="4" y="18" width="10" height="2.4" rx="1.2" fill="currentColor" opacity="0.35"/></svg>`,
  Budget: html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/></svg>`,
  History: html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4.2l2.8 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  Settings: html`<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.1" fill="currentColor"/><circle cx="12" cy="12" r="2.1" fill="currentColor"/><circle cx="18" cy="12" r="2.1" fill="currentColor"/></svg>`,
};

const TABS = ['Home', 'Calendar', 'Bills', 'Budget', 'History', 'Settings'];
const SHORT = { Home: 'HOME', Calendar: 'CAL', Bills: 'BILLS', Budget: 'BUDGET', History: 'LEDGER', Settings: 'MORE' };

export function BottomNav({ active, onTab }) {
  return html`<nav style=${{
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
    padding: '9px 2px 15px',
    background: 'rgba(9,13,21,0.96)',
    borderTop: `1px solid ${color.border}`,
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  }}>
    ${TABS.map((key) => {
      const on = key === active;
      const c = on ? color.cyan : color.textFaint;
      return html`<div key=${key} onClick=${() => onTab(key)} style=${{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
        position: 'relative', paddingTop: '9px', cursor: 'pointer', minWidth: 0,
      }}>
        <div style=${{ position: 'absolute', top: 0, width: '22px', height: '2px', borderRadius: '2px', background: on ? color.cyan : 'transparent', transition: 'background 150ms ease-out' }}></div>
        <div style=${{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, transition: 'color 150ms ease-out' }}>
          ${ICONS[key]}
        </div>
        <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.8px', color: c, transition: 'color 150ms ease-out' }}>${SHORT[key]}</span>
      </div>`;
    })}
  </nav>`;
}
