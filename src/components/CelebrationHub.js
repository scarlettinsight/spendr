import { html, React } from '../lib/html.js';
import { font, color, surface, motion } from '../theme/tokens.js';
import { onCelebration, reduceMotion } from '../lib/toast.js';
import { money } from '../lib/format.js';
import { Button } from '../primitives/Button.js';

// One celebration at a time; wins celebrate, limits stay calm.
// M1 (paid): takeover card pops in (spring), emerald ring + check draw, confetti
//   burst, debt caption. Dismiss = NICE or tap anywhere → onDone (undo toast).
// M3 (limit): calm amber panel — supportive copy, one-tap shift, OK. No red,
//   no shake, no confetti.
// prefers-reduced-motion: celebrations are skipped entirely (onDone still runs).
export function CelebrationHub() {
  const [current, setCurrent] = React.useState(null);

  React.useEffect(() => onCelebration((c) => {
    if (reduceMotion()) { c.onDone && c.onDone(); return; }
    setCurrent((cur) => cur ? cur : c); // one at a time — ignore while active
  }), []);

  if (!current) return null;

  const dismiss = () => {
    const done = current.onDone;
    setCurrent(null);
    done && done();
  };

  return current.type === 'paid'
    ? html`<${PaidMoment} c=${current} onDismiss=${dismiss} />`
    : html`<${LimitMoment} c=${current} onDismiss=${dismiss} />`;
}

/* ---------- M1: bill paid ---------- */

const CONFETTI_COLORS = [color.safe, color.cyan, color.amber];

function PaidMoment({ c, onDismiss }) {
  // 10 confetti pieces with random trajectories, computed once
  const confetti = React.useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    dx: (Math.random() * 2 - 1) * 110,
    dy: -30 - Math.random() * 90,
    rot: (Math.random() * 2 - 1) * 260,
    color: CONFETTI_COLORS[i % 3],
    delay: 380 + Math.random() * 150,
    w: 5 + Math.random() * 3,
    h: 8 + Math.random() * 4,
  })), []);

  const R = 30, CIRC = 2 * Math.PI * R;

  return html`<div onClick=${onDismiss} style=${{
    position: 'absolute', inset: 0, zIndex: 70,
    background: 'rgba(5,8,14,0.78)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'spendr-fade-in 180ms ease-out',
  }}>
    <div onClick=${(e) => e.stopPropagation()} style=${{
      width: '290px', borderRadius: '20px', padding: '26px 22px 20px',
      background: surface.card, border: '1px solid rgba(59,232,166,0.3)',
      boxShadow: '0 0 44px rgba(59,232,166,0.12), 0 24px 60px rgba(0,0,0,0.6)',
      textAlign: 'center', position: 'relative',
      animation: `sp-pop 500ms ${motion.spring} both`,
    }}>
      <!-- ring + check draw -->
      <div style=${{ position: 'relative', width: '76px', height: '76px', margin: '0 auto' }}>
        <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
          <circle cx="38" cy="38" r=${R} stroke="rgba(59,232,166,0.18)" stroke-width="3" />
          <circle cx="38" cy="38" r=${R} stroke=${color.safe} stroke-width="3" stroke-linecap="round"
            transform="rotate(-90 38 38)"
            stroke-dasharray=${CIRC} stroke-dashoffset=${CIRC}
            style=${{ animation: 'sp-ring 700ms ease-out 120ms forwards' }} />
          <polyline points="26,39 34.5,47 51,29" stroke=${color.safe} stroke-width="3.5"
            stroke-linecap="round" stroke-linejoin="round" fill="none"
            stroke-dasharray="36" stroke-dashoffset="36"
            style=${{ animation: 'sp-check 320ms ease-out 700ms forwards' }} />
        </svg>
        <!-- confetti burst from center -->
        ${confetti.map((p, i) => html`<span key=${i} style=${{
          position: 'absolute', left: '36px', top: '36px',
          width: p.w + 'px', height: p.h + 'px', borderRadius: '1.5px',
          background: p.color, opacity: 0,
          '--dx': p.dx + 'px', '--dy': p.dy + 'px', '--rot': p.rot + 'deg',
          animation: `sp-confetti 900ms ease-out ${p.delay}ms forwards`,
        }}></span>`)}
      </div>

      <div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '2px', color: color.safe, marginTop: '14px' }}>BILL PAID</div>
      <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '15px', color: color.textHi, marginTop: '6px' }}>${c.name}</div>
      <div style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '26px', color: color.textHi, marginTop: '4px' }}>${money(c.amount, { cents: true })}</div>

      ${c.debtPct != null && html`<div style=${{ marginTop: '14px' }}>
        <div style=${{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style=${{ height: '100%', width: c.debtPct + '%', background: color.safe, borderRadius: '4px', transition: `width 700ms ${motion.barEase} 400ms` }}></div>
        </div>
        <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: color.textDim, marginTop: '7px' }}>${c.debtPct}% of July debt cleared</div>
      </div>`}

      <div style=${{ marginTop: '18px' }}>
        <${Button} variant="confirm" full onClick=${onDismiss}>NICE<//>
      </div>
    </div>
  </div>`;
}

/* ---------- M3: budget limit reached (calm) ---------- */

function LimitMoment({ c, onDismiss }) {
  const shift = () => {
    c.onShift && c.onShift();
    onDismiss();
  };
  return html`<div style=${{ position: 'absolute', left: '16px', right: '16px', bottom: '86px', zIndex: 70 }}>
    <div style=${{
      borderRadius: '16px', padding: '16px',
      background: surface.sheet,
      border: '1px solid rgba(255,180,55,0.32)',
      animation: `spendr-toast-up 260ms ${motion.spring}, sp-pulse 900ms ease-in-out 260ms 2`,
      boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
    }}>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style=${{ width: '6px', height: '6px', borderRadius: '50%', background: color.amber }}></span>
        <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1.5px', fontWeight: 600, color: color.amber }}>${c.cat.toUpperCase()} · LIMIT REACHED</span>
      </div>
      <div style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid, marginTop: '9px', lineHeight: 1.45 }}>
        ${c.cat} is done for July. Safe to Spend already had this covered — nothing else changes.
      </div>
      <div style=${{ display: 'flex', gap: '9px', marginTop: '13px' }}>
        ${c.canShift && html`<${Button} variant="ghost" onClick=${shift} style=${{ flex: 1, minHeight: '38px', padding: '10px' }}>SHIFT $20 FROM OTHER<//>`}
        <${Button} variant="neutral" onClick=${onDismiss} style=${{ flex: c.canShift ? '0 0 auto' : 1, minHeight: '38px', padding: '10px 18px' }}>OK<//>
      </div>
    </div>
  </div>`;
}
