import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { pushToast } from '../lib/toast.js';
import { CATEGORY_PALETTE } from '../state/model.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { TextField, MoneyField, FieldLabel } from './fields.js';

// Category envelope: name, monthly budget, color. Spent/committed are derived
// from the ledger + scheduled bills, so they're shown, not edited.
export function CategorySheet({ cat, onClose }) {
  const { state, derived, dispatch } = useStore();
  const editing = !!cat;
  const [name, setName] = React.useState(editing ? cat.name : '');
  const [budget, setBudget] = React.useState(editing ? String(cat.budget) : '');
  const [swatch, setSwatch] = React.useState(editing ? (cat.color || CATEGORY_PALETTE[0]) : CATEGORY_PALETTE[0]);

  const row = editing ? derived.categoriesNow.find((r) => r.id === cat.id) : null;

  const save = () => {
    const b = Math.max(0, parseFloat(budget || '0') || 0);
    if (editing) {
      const prev = { name: cat.name, budget: cat.budget, color: cat.color };
      dispatch({ type: 'updateCategory', id: cat.id, patch: { name: name || cat.name, budget: b || cat.budget, color: swatch } });
      pushToast({
        detail: `${name || cat.name} · budget ${money(b || cat.budget)}/mo`,
        undo: () => dispatch({ type: 'updateCategory', id: cat.id, patch: prev }),
      });
    } else {
      if (!name || !b) return;
      const id = 'c' + Date.now();
      dispatch({ type: 'addCategory', cat: { id, name, budget: b, color: swatch } });
      pushToast({
        detail: `${name} · ${money(b)}/mo envelope added`,
        undo: () => dispatch({ type: 'removeCategory', id }),
      });
    }
    onClose();
  };

  const del = () => {
    const index = state.categories.findIndex((c) => c.id === cat.id);
    dispatch({ type: 'removeCategory', id: cat.id });
    pushToast({
      detail: `${cat.name} · category deleted`,
      undo: () => dispatch({ type: 'restoreCategory', cat, index }),
    });
    onClose();
  };

  return html`<${BottomSheet} title=${editing ? 'Edit Category' : 'New Category'} onClose=${onClose}>
    ${row && html`<div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '0.5px', color: color.textDim, textAlign: 'center', marginBottom: '14px' }}>
      this month · ${money(row.spent)} spent + ${money(row.committed)} committed
    </div>`}

    <${FieldLabel}>DETAILS<//>
    <div style=${{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '16px' }}>
      <${TextField} label="NAME" value=${name} onChange=${setName} placeholder="e.g. Groceries" />
      <${MoneyField} label="MONTHLY BUDGET" value=${budget} onChange=${setBudget} placeholder="e.g. 500" />
    </div>

    <${FieldLabel}>COLOR<//>
    <div style=${{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
      ${CATEGORY_PALETTE.map((c) => html`<span key=${c} onClick=${() => setSwatch(c)} style=${{
        width: '30px', height: '30px', borderRadius: '50%', background: c, cursor: 'pointer',
        border: swatch === c ? '2px solid #eef3fe' : '2px solid transparent',
        boxShadow: swatch === c ? `0 0 0 2px ${c}55` : 'none',
        transition: 'border-color 150ms ease-out',
      }}></span>`)}
    </div>

    <${Button} variant="primary" full onClick=${save}>${editing ? 'SAVE CHANGES' : 'ADD CATEGORY'}<//>
    ${editing && html`<div style=${{ marginTop: '10px' }}>
      <${Button} variant="danger" full onClick=${del}>DELETE CATEGORY<//>
    </div>`}
  </${BottomSheet}>`;
}
