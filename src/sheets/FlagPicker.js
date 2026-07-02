import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { SelectPill } from './fields.js';

// Multi-select picker for CUSTOM flags (system flags like Debt/BNPL keep their
// dedicated toggles since they drive the engine). Includes an inline "+ new"
// creator so a flag can be minted right where it's needed.
export function FlagPicker({ selected = [], onChange }) {
  const { state, dispatch } = useStore();
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const customFlags = (state.flags || []).filter((f) => !f.system);

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const create = () => {
    const name = draft.trim();
    if (!name) { setAdding(false); return; }
    const id = 'f' + Date.now();
    dispatch({ type: 'addFlag', id, name });
    onChange([...selected, id]); // auto-select the new flag
    setDraft('');
    setAdding(false);
  };

  return html`<div>
    <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
      ${customFlags.map((f) => html`<${SelectPill} key=${f.id} label=${f.name}
        active=${selected.includes(f.id)} onClick=${() => toggle(f.id)} />`)}
      ${!adding && html`<span onClick=${() => setAdding(true)} style=${{
        fontFamily: font.readout, fontSize: '11px', padding: '7px 13px', borderRadius: '9px',
        cursor: 'pointer', color: color.cyan, background: 'rgba(47,225,240,0.05)',
        border: '1px dashed rgba(47,225,240,0.3)',
      }}>+ new</span>`}
    </div>
    ${adding && html`<div style=${{ display: 'flex', gap: '8px', marginTop: '9px' }}>
      <input value=${draft} onChange=${(e) => setDraft(e.target.value)} placeholder="Flag name"
        autoFocus autoComplete="off"
        onKeyDown=${(e) => { if (e.key === 'Enter') create(); }}
        style=${{
          flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: '9px',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}`,
          outline: 'none', fontFamily: font.body, fontSize: '13px', color: color.textHi,
        }} />
      <button onClick=${create} style=${{
        padding: '9px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
        background: color.cyan, color: color.onCyan,
        fontFamily: font.readout, fontSize: '11px', fontWeight: 600, letterSpacing: '1px',
      }}>ADD</button>
    </div>`}
  </div>`;
}

// Resolve tag ids → live flag names (deleted flags simply don't render;
// undoing the delete brings them back).
export function tagNames(state, tags) {
  if (!tags || !tags.length) return [];
  return tags
    .map((id) => (state.flags || []).find((f) => f.id === id))
    .filter(Boolean)
    .map((f) => f.name);
}
