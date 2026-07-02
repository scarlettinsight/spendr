import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { pushToast } from '../lib/toast.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { TextField, FieldLabel } from './fields.js';

// Rename / delete a custom flag, or create a new one. Deleting hides the flag
// everywhere it was attached; undo brings those attachments back intact.
export function FlagSheet({ flag, onClose }) {
  const { state, dispatch } = useStore();
  const editing = !!flag;
  const [name, setName] = React.useState(editing ? flag.name : '');

  const usedOn = editing
    ? state.bills.filter((b) => (b.flagIds || []).includes(flag.id)).length
      + state.expenses.filter((t) => (t.flagIds || []).includes(flag.id)).length
    : 0;

  const save = () => {
    const n = name.trim();
    if (!n) return;
    if (editing) {
      const prev = flag.name;
      dispatch({ type: 'updateFlag', id: flag.id, name: n });
      pushToast({
        detail: `Flag renamed · ${prev} → ${n}`,
        undo: () => dispatch({ type: 'updateFlag', id: flag.id, name: prev }),
      });
    } else {
      const id = 'f' + Date.now();
      dispatch({ type: 'addFlag', id, name: n });
      pushToast({
        detail: `Flag added · ${n}`,
        undo: () => dispatch({ type: 'removeFlag', id }),
      });
    }
    onClose();
  };

  const del = () => {
    const index = (state.flags || []).findIndex((f) => f.id === flag.id);
    dispatch({ type: 'removeFlag', id: flag.id });
    pushToast({
      detail: `Flag deleted · ${flag.name}`,
      undo: () => dispatch({ type: 'restoreFlag', flag, index }),
    });
    onClose();
  };

  return html`<${BottomSheet} title=${editing ? 'Edit Flag' : 'New Flag'} onClose=${onClose}>
    ${editing && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: color.textDim, textAlign: 'center', marginBottom: '14px' }}>
      on ${usedOn} item${usedOn === 1 ? '' : 's'}
    </div>`}
    <${FieldLabel}>NAME<//>
    <div style=${{ marginBottom: '16px' }}>
      <${TextField} label="FLAG" value=${name} onChange=${setName} placeholder="e.g. Shared, Work, Trip" />
    </div>
    <${Button} variant="primary" full onClick=${save}>${editing ? 'SAVE CHANGES' : 'ADD FLAG'}<//>
    ${editing && html`<div style=${{ marginTop: '10px' }}>
      <${Button} variant="danger" full onClick=${del}>DELETE FLAG<//>
    </div>`}
  </${BottomSheet}>`;
}
