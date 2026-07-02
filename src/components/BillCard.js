import { html, React } from '../lib/html.js';
import { font, color, surface, motion } from '../theme/tokens.js';
import { money } from '../lib/format.js';
import { useStore } from '../state/store.js';
import { occDueText } from '../lib/actions.js';
import { freqLabel } from '../lib/recur.js';
import { Chip } from '../primitives/Chip.js';

// Bill OCCURRENCE card. Left accent: red = debt, amber = due today/overdue,
// neutral otherwise. Meta: due · source · recurrence (↻) — ✎ marks an
// occurrence-level override. Swipe right to pay (unpaid only).
export function BillCard({ occ, onClick, onPay }) {
  const { state, derived } = useStore();
  const today = derived.today;
  const urgent = !occ.paid && !occ.flexible && occ.date <= today;

  const accent = occ.debt ? color.red : urgent ? color.amber : 'rgba(95,127,174,0.55)';
  const amtColor = occ.debt ? color.redText : color.textHi;
  const src = state.sources.find((s) => s.id === occ.sourceId);
  const cat = state.categories.find((c) => c.id === occ.categoryId);
  const flagNames = (occ.flagIds || [])
    .map((id) => state.flags.find((f) => f.id === id))
    .filter((f) => f && !f.system).map((f) => f.name);
  const tag = occ.debt ? 'DEBT' : null;
  const shownTags = flagNames.slice(0, tag ? 1 : 2);

  const metaBits = [
    occDueText(occ, today),
    src ? src.name : null,
    occ.recurring ? `↻ ${freqLabel(occ.bill.recurrence)}` : null,
    occ.overridden ? '✎ edited' : null,
  ].filter(Boolean);

  const card = html`<div onClick=${onClick} style=${{
    position: 'relative', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '13px 14px 13px 17px', borderRadius: '14px', background: surface.card,
    border: `1px solid ${occ.debt ? 'rgba(255,84,112,0.26)' : color.border}`,
    overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
  }}>
    <div style=${{ position: 'absolute', left: 0, top: '11px', bottom: '11px', width: '3px', borderRadius: '0 3px 3px 0', background: accent }}></div>

    <div style=${{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        ${cat && html`<span style=${{ width: '7px', height: '7px', borderRadius: '2px', background: cat.color, flex: '0 0 auto' }}></span>`}
        <span style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '13.5px', color: color.textHi, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${occ.name}</span>
        ${tag && html`<${Chip} variant="DEBT" />`}
        ${shownTags.map((t) => html`<${Chip} key=${t} variant="SUB">${t}<//>`)}
      </div>
      <div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '0.3px', color: urgent ? color.amber : color.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        ${metaBits.join(' · ')}
      </div>
    </div>

    <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flex: '0 0 auto' }}>
      <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '16px', color: amtColor }}>${money(occ.amount, { cents: true })}</span>
      ${occ.paid
        ? html`<span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', fontWeight: 600, color: color.safe, animation: 'spendr-pop-in 340ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>PAID ✓</span>`
        : html`<span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: urgent ? color.amber : color.textDim }}>${urgent ? 'DUE NOW' : 'UNPAID'}</span>`}
    </div>
  </div>`;

  if (occ.paid || !onPay) return card;
  return html`<${SwipeToPay} onPay=${() => onPay(occ)}>${card}<//>`;
}

// Swipe-to-pay wrapper: emerald underlay with "✓ PAY"; past ~40% commits,
// otherwise springs back.
function SwipeToPay({ onPay, children }) {
  const wrapRef = React.useRef(null);
  const [dx, setDx] = React.useState(0);
  const [springing, setSpringing] = React.useState(false);
  const drag = React.useRef(null);

  const THRESHOLD = 0.4;

  const onPointerDown = (e) => {
    drag.current = { startX: e.clientX, startY: e.clientY, active: false };
    setSpringing(false);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.startX;
    const my = e.clientY - d.startY;
    if (!d.active) {
      if (Math.abs(mx) < 10 || Math.abs(mx) < Math.abs(my)) return;
      d.active = true;
      try { wrapRef.current.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ }
    }
    setDx(Math.max(0, mx));
  };

  const finish = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.active) { setDx(0); return; }
    e.preventDefault();
    const width = wrapRef.current ? wrapRef.current.offsetWidth : 320;
    if (dx > width * THRESHOLD) {
      setSpringing(true);
      setDx(width);
      setTimeout(() => { setDx(0); onPay(); }, 180);
    } else {
      setSpringing(true);
      setDx(0);
    }
  };

  const dragged = dx > 4;

  return html`<div ref=${wrapRef}
    onPointerDown=${onPointerDown}
    onPointerMove=${onPointerMove}
    onPointerUp=${finish}
    onPointerCancel=${finish}
    onClickCapture=${(e) => { if (dragged || springing) { e.stopPropagation(); e.preventDefault(); } }}
    style=${{ position: 'relative', borderRadius: '14px', touchAction: 'pan-y' }}>
    <div style=${{
      position: 'absolute', inset: 0, borderRadius: '14px',
      background: 'rgba(59,232,166,0.14)', border: '1px solid rgba(59,232,166,0.3)',
      display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '18px',
      opacity: dragged ? 1 : 0, transition: `opacity ${motion.fast} ease-out`,
    }}>
      <span style=${{ color: color.safe, fontSize: '15px' }}>✓</span>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1.5px', fontWeight: 600, color: color.safe }}>PAY</span>
    </div>
    <div style=${{
      transform: `translateX(${dx}px)`,
      transition: springing ? `transform ${motion.base} ${motion.spring}` : 'none',
    }}>
      ${children}
    </div>
  </div>`;
}
