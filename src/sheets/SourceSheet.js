import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { pushToast } from '../lib/toast.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { TextField, FieldLabel, SelectPill } from './fields.js';

// Payment source sheet: add or edit a bank account / card. The type matters —
// checking-type sources feed the Safe-to-Spend engine; cards don't touch checking.
export function SourceSheet({ source, onClose }) {
  const { state, dispatch } = useStore();
  const editing = !!source;
  const [name, setName] = React.useState(editing ? source.name : '');
  const [isChecking, setIsChecking] = React.useState(editing ? !!source.isChecking : false);

  const save = () => {
    if (editing) {
      const prev = { name: source.name, isChecking: source.isChecking };
      dispatch({ type: 'updateSource', id: source.id, patch: { name: name || source.name, isChecking } });
      pushToast({
        detail: `${name || source.name} · updated`,
        undo: () => dispatch({ type: 'updateSource', id: source.id, patch: prev }),
      });
    } else {
      if (!name.trim()) return;
      const id = 'src' + Date.now();
      dispatch({ type: 'addSource', id, name: name.trim(), isChecking });
      pushToast({
        detail: `${name.trim()} · ${isChecking ? 'bank account' : 'card'} added`,
        undo: () => dispatch({ type: 'removeSource', id }),
      });
    }
    onClose();
  };

  const del = () => {
    const index = state.sources.findIndex((s) => s.id === source.id);
    dispatch({ type: 'removeSource', id: source.id });
    pushToast({
      detail: `${source.name} · removed`,
      undo: () => dispatch({ type: 'restoreSource', source, index }),
    });
    onClose();
  };

  const lastOne = editing && state.sources.length <= 1;

  return html`<${BottomSheet} title=${editing ? 'Edit Source' : 'New Source'} onClose=${onClose}>
    <${FieldLabel}>DETAILS<//>
    <div style=${{ marginBottom: '14px' }}>
      <${TextField} label="NAME" value=${name} onChange=${setName} placeholder="e.g. Chase ··4821" />
    </div>

    <${FieldLabel}>TYPE<//>
    <div style=${{ display: 'flex', gap: '7px', marginBottom: '10px' }}>
      <${SelectPill} label="Bank account" active=${isChecking} onClick=${() => setIsChecking(true)} />
      <${SelectPill} label="Credit card" active=${!isChecking} onClick=${() => setIsChecking(false)} />
    </div>
    <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.4px', color: color.textDim, marginBottom: '16px', lineHeight: 1.5 }}>
      ${isChecking
        ? 'Bank account · spending from it counts against Safe to Spend'
        : 'Credit card · purchases don’t touch checking until you pay the bill'}
    </div>

    <${Button} variant="primary" full onClick=${save}>${editing ? 'SAVE CHANGES' : 'ADD SOURCE'}<//>
    ${editing && html`<div style=${{ marginTop: '10px' }}>
      ${lastOne
        ? html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, textAlign: 'center', letterSpacing: '0.5px' }}>You need at least one payment source</div>`
        : html`<${Button} variant="danger" full onClick=${del}>REMOVE SOURCE<//>`}
    </div>`}
  </${BottomSheet}>`;
}
