import { html, React } from '../lib/html.js';
import { font, color, surface, motion } from '../theme/tokens.js';
import { onToast, pushToast } from '../lib/toast.js';
import { useStore } from '../state/store.js';

// Two toast lanes inside the device frame:
//  - BOTTOM (M2): action confirmations on a neutral surface with a cyan UNDO
//    button (5s). One at a time — a new one replaces the current.
//  - TOP: calm state pills announcing Stable/Caution/Critical transitions
//    (status voice — colored text/border, faint shadow only).
const STATE_TOASTS = {
  Stable: { lane: 'state', label: 'BACK TO STABLE', detail: 'buffer safe · room to spend', color: color.safe, rgb: '59,232,166' },
  Caution: { lane: 'state', label: 'ENTERING CAUTION', detail: 'tight · keep it lean', color: color.amber, rgb: '255,180,55' },
  Critical: { lane: 'state', label: 'CRITICAL', detail: 'bills exceed safe funds · move money', color: color.redText, rgb: '255,84,112' },
};

export function ToastHub() {
  const { derived } = useStore();
  const [statePills, setStatePills] = React.useState([]);
  const [bottom, setBottom] = React.useState(null); // single undo toast
  const bottomTimer = React.useRef(null);

  React.useEffect(() => onToast((t) => {
    if (t.lane === 'state') {
      setStatePills((list) => [...list.slice(-1), t]);
      setTimeout(() => setStatePills((list) => list.map((x) => x.id === t.id ? { ...x, leaving: true } : x)), t.duration);
      setTimeout(() => setStatePills((list) => list.filter((x) => x.id !== t.id)), t.duration + 220);
    } else {
      clearTimeout(bottomTimer.current);
      setBottom(t);
      bottomTimer.current = setTimeout(() => {
        setBottom((cur) => cur && cur.id === t.id ? { ...cur, leaving: true } : cur);
        setTimeout(() => setBottom((cur) => cur && cur.id === t.id ? null : cur), 240);
      }, t.duration);
    }
  }), []);

  // announce financial-state transitions (from actions or the Settings preview)
  const prevState = React.useRef(derived.financialState);
  React.useEffect(() => {
    if (prevState.current !== derived.financialState) {
      prevState.current = derived.financialState;
      pushToast(STATE_TOASTS[derived.financialState]);
    }
  }, [derived.financialState]);

  const dismissBottom = (fireUndo) => {
    if (!bottom) return;
    clearTimeout(bottomTimer.current);
    if (fireUndo && bottom.undo) bottom.undo();
    setBottom({ ...bottom, leaving: true });
    setTimeout(() => setBottom(null), 240);
  };

  return html`<div style=${{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }}>
    <!-- top state pills -->
    <div style=${{ position: 'absolute', top: '42px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
      ${statePills.map((t) => html`<div key=${t.id} style=${{
        display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', borderRadius: '10px',
        background: 'rgba(10,15,25,0.94)',
        border: `1px solid rgba(${t.rgb},0.32)`,
        boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        animation: t.leaving
          ? 'spendr-toast-out 200ms ease-in forwards'
          : `spendr-toast-in 280ms ${motion.spring}`,
      }}>
        <span style=${{ width: '6px', height: '6px', borderRadius: '50%', background: t.color, flex: '0 0 auto' }}></span>
        <span style=${{ fontFamily: font.readout, fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', color: t.color, whiteSpace: 'nowrap' }}>${t.label}</span>
        ${t.detail && html`<span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.4px', color: color.textMid, whiteSpace: 'nowrap' }}>${t.detail}</span>`}
      </div>`)}
    </div>

    <!-- bottom undo toast (M2) -->
    ${bottom && html`<div key=${bottom.id} style=${{
      position: 'absolute', bottom: '86px', left: '16px', right: '16px',
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 14px', borderRadius: '12px',
      background: surface.sheet,
      border: `1px solid ${color.borderStrong}`,
      boxShadow: '0 10px 26px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
      animation: bottom.leaving
        ? 'spendr-toast-down 220ms ease-in forwards'
        : `spendr-toast-up 220ms ${motion.spring}`,
    }}>
      <span style=${{ flex: 1, minWidth: 0, fontFamily: font.readout, fontSize: '11.5px', letterSpacing: '0.3px', color: color.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${bottom.detail}</span>
      ${bottom.undo && html`<button onClick=${() => dismissBottom(true)} style=${{
        border: 'none', background: 'transparent', cursor: 'pointer',
        fontFamily: font.readout, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
        color: color.cyan, padding: '4px 6px', flex: '0 0 auto',
      }}>${bottom.undoLabel || 'UNDO'}</button>`}
      <button onClick=${() => dismissBottom(false)} style=${{
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: color.textFaint, fontSize: '13px', padding: '2px 4px', flex: '0 0 auto',
      }}>×</button>
    </div>`}
  </div>`;
}
