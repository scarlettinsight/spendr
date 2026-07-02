import { html } from '../lib/html.js';
import { money } from '../lib/format.js';
import { color } from '../theme/tokens.js';
import { SectionLabel } from '../primitives/SectionLabel.js';
import { BillCard } from './BillCard.js';

// Urgency header wrapping a list of bill occurrences.
export function BillGroup({ group, showTotal = false, onBill, onPay }) {
  return html`<div style=${{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
    <${SectionLabel} accent=${group.accent} dot divider tracking=${2} size=${10}
      right=${showTotal ? money(group.total) : undefined} rightColor=${color.textFaint}>${group.title}<//>
    ${group.items.map((o) => html`<${BillCard} key=${o.billId + o.key} occ=${o}
      onClick=${onBill ? () => onBill(o) : undefined} onPay=${onPay} />`)}
  </div>`;
}
