import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { pushToast } from '../lib/toast.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { TextField, MoneyField } from './fields.js';

// Generic single-value editor for settings.
// config: { field, title, label, kind: 'money' | 'text' | 'number',
//           allowNegative?, min?, max?, caption? }
export function ValueSheet({ config, onClose }) {
  const { state, dispatch } = useStore();
  const current = state.settings[config.field];
  const [value, setValue] = React.useState(String(current != null ? current : ''));

  const save = () => {
    let parsed;
    if (config.kind === 'money') {
      parsed = parseFloat(value || '0') || 0;
      if (!config.allowNegative) parsed = Math.max(0, parsed);
    } else if (config.kind === 'number') {
      parsed = parseInt(value.replace(/[^0-9-]/g, '') || '0', 10) || 0;
      if (config.field === 'plannerDays') parsed = Math.min(60, Math.max(30, parsed));
      if (config.min != null) parsed = Math.max(config.min, parsed);
      if (config.max != null) parsed = Math.min(config.max, parsed);
    } else {
      parsed = value.trim() || current;
    }
    const prev = current;
    dispatch({ type: 'updateSettings', patch: { [config.field]: parsed } });
    pushToast({
      detail: `${config.title} · ${config.kind === 'money' ? money(parsed, { cents: true }) : parsed}`,
      undo: () => dispatch({ type: 'updateSettings', patch: { [config.field]: prev } }),
    });
    onClose();
  };

  return html`<${BottomSheet} title=${config.title} onClose=${onClose}>
    ${config.caption && html`<div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '0.4px', color: color.textDim, textAlign: 'center', marginBottom: '14px' }}>${config.caption}</div>`}
    <div style=${{ marginBottom: '16px' }}>
      ${config.kind === 'money'
        ? html`<${MoneyField} label=${config.label} value=${value} onChange=${setValue} allowNegative=${!!config.allowNegative} />`
        : html`<${TextField} label=${config.label} value=${value} onChange=${setValue} inputMode=${config.kind === 'number' ? 'numeric' : undefined} />`}
    </div>
    <${Button} variant="primary" full onClick=${save}>SAVE<//>
  </${BottomSheet}>`;
}
