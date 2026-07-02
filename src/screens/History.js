import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { StatusBar, ScreenTitle } from '../components/StatusBar.js';
import { TransactionRow } from '../components/TransactionRow.js';
import { EmptyState } from '../components/Banners.js';
import { FilterChips } from './Bills.js';

// Ledger: actual money movement, filterable by kind + category + flag,
// sortable by date or amount.
const KIND = [
  { key: 'all', label: 'ALL' },
  { key: 'spent', label: 'SPENT' },
  { key: 'income', label: 'INCOME' },
  { key: 'checking', label: 'CHECKING' },
];

export function History({ open }) {
  const { state, derived } = useStore();
  const [kind, setKind] = React.useState('all');
  const [catFilter, setCatFilter] = React.useState('all');
  const [flagFilter, setFlagFilter] = React.useState('all');
  const [sort, setSort] = React.useState('date');

  const catChips = [{ key: 'all', label: 'ALL' },
    ...state.categories.map((c) => ({ key: c.id, label: c.name.toUpperCase(), dot: c.color }))];
  const flagChips = [{ key: 'all', label: 'ALL FLAGS' },
    ...state.flags.map((f) => ({ key: f.id, label: f.name.toUpperCase() }))];

  const match = (t) =>
    (kind === 'all' || (kind === 'spent' && t.amount < 0) || (kind === 'income' && t.amount > 0)
      || (kind === 'checking' && (t.impact === 'down' || t.impact === 'up'))) &&
    (catFilter === 'all' || t.categoryId === catFilter) &&
    (flagFilter === 'all' || (t.flagIds || []).includes(flagFilter));

  const txs = state.expenses.filter(match).sort((a, b) =>
    sort === 'amount' ? Math.abs(b.amount) - Math.abs(a.amount) : (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const netStr = money(derived.net, { cents: false, sign: derived.net > 0 });

  return html`<div>
    <${StatusBar} />
    <${ScreenTitle} title="LEDGER" subtitle=${`last 7 days · net ${netStr}`}
      right=${html`<span onClick=${() => setSort(sort === 'date' ? 'amount' : 'date')} style=${{
        fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.cyan, cursor: 'pointer', paddingBottom: '4px',
      }}>SORT: ${sort.toUpperCase()} ⇅</span>`} />

    <${FilterChips} items=${KIND} active=${kind} onSelect=${setKind} />
    <${FilterChips} items=${catChips} active=${catFilter} onSelect=${setCatFilter} />
    <${FilterChips} items=${flagChips} active=${flagFilter} onSelect=${setFlagFilter} />

    <div style=${{ flex: 1, padding: '10px 16px 96px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
      ${txs.length === 0
        ? html`<${EmptyState} title="Nothing here" caption="No entries match these filters" />`
        : txs.map((t) => html`<${TransactionRow} key=${t.id} tx=${t} onClick=${() => open({ type: 'tx', tx: t })} />`)}
    </div>
  </div>`;
}
