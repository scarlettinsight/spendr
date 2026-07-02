import { html, React } from '../lib/html.js';
import { font, color, stateTheme, surface, composition, motion } from '../theme/tokens.js';
import { moneyParts, money } from '../lib/format.js';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';

// V2 hero: label → big number → "until payday · Jul 15 · 14 days" →
// EXPECTED CHECKING row → 8px composition bar (spoken-for / striped buffer / safe)
// → 3-item legend. No ring, no tiles, no horizon. Glow only on the number.
// The number rolls odometer-style on change; the bar glides (never jumps).
// `paydayTick` > 0 fires the M4 sweep + rising motes (one-shot).
export function SafeToSpendHero({ amount, state, expectedChecking, spokenFor, buffer, subline, paydayTick = 0 }) {
  const s = stateTheme[state] || stateTheme.Stable;
  const [displayAmount, rolling] = useAnimatedNumber(amount, { duration: 600 });
  const [expectedD] = useAnimatedNumber(expectedChecking, { duration: 600 });
  const p = moneyParts(displayAmount);

  // composition of the current balance (clamped; negative balances show empty)
  const total = Math.max(1, expectedChecking);
  const safeAmt = Math.max(0, amount);
  const spokenPct = expectedChecking <= 0 ? 0 : Math.min(100, (spokenFor / total) * 100);
  const bufferPct = expectedChecking <= 0 ? 0 : Math.min(100 - spokenPct, (buffer / total) * 100);
  const safePct = expectedChecking <= 0 ? 0 : Math.max(0, Math.min(100 - spokenPct - bufferPct, (safeAmt / total) * 100));

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const seg = (w, bg) => html`<div style=${{
    width: (mounted ? w : 0) + '%',
    background: bg,
    transition: `width 550ms ${motion.barEase}`,
  }}></div>`;

  const legendItem = (swatch, label, value, valueColor) => html`<div style=${{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style=${{ width: '8px', height: '8px', borderRadius: '2px', background: swatch, flex: '0 0 auto' }}></span>
    <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.8px', color: color.textFaint }}>${label}</span>
    <span style=${{ fontFamily: font.readout, fontSize: '11px', fontWeight: 600, color: valueColor }}>${value}</span>
  </div>`;

  return html`<div style=${{
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '20px',
    padding: '19px',
    background: surface.hero,
    border: `1px solid ${s.border}`,
  }}>
    <!-- M4 payday: emerald light band sweeps across once; motes rise -->
    ${paydayTick > 0 && html`<div key=${'sweep' + paydayTick} style=${{
      position: 'absolute', top: 0, bottom: 0, left: 0, width: '55%',
      background: 'linear-gradient(90deg, transparent, rgba(59,232,166,0.14) 45%, rgba(59,232,166,0.22) 50%, rgba(59,232,166,0.14) 55%, transparent)',
      animation: 'sp-sweep 1000ms ease-in-out forwards',
      pointerEvents: 'none',
    }}></div>`}
    ${paydayTick > 0 && [0, 1, 2, 3, 4].map((i) => html`<span key=${'mote' + paydayTick + '-' + i} style=${{
      position: 'absolute',
      left: (14 + i * 17) + '%',
      bottom: '18px',
      width: '4px', height: '4px', borderRadius: '50%',
      background: color.safe,
      opacity: 0,
      animation: `sp-rise 900ms ease-out ${120 + i * 130}ms forwards`,
      pointerEvents: 'none',
    }}></span>`)}

    <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style=${{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }}></span>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '2px', color: s.labelText }}>SAFE TO SPEND</span>
    </div>

    <div style=${{
      fontFamily: font.readout, fontWeight: 700, fontSize: '47px', lineHeight: 1.02,
      color: color.textHi, marginTop: '9px',
      textShadow: rolling ? s.heroGlowRolling : s.heroGlow,
      transition: 'text-shadow 280ms ease-out',
    }}>
      ${p.dollars}<span style=${{ fontSize: '26px', color: s.labelText }}>${p.cents}</span>
    </div>

    <div style=${{ fontFamily: font.readout, fontSize: '11px', color: color.textDim, marginTop: '7px', letterSpacing: '0.4px' }}>${subline}</div>

    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '15px' }}>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.textFaint }}>CURRENT BALANCE</span>
      <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: expectedD < 0 ? color.redText : color.textMid }}>${money(expectedD, { cents: true })}</span>
    </div>

    <!-- composition bar: spoken-for · striped buffer · safe -->
    <div style=${{ height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginTop: '9px', background: 'rgba(255,255,255,0.05)' }}>
      ${seg(spokenPct, composition.spokenFor)}
      ${seg(bufferPct, composition.buffer)}
      ${seg(safePct, composition.safe)}
    </div>

    <div style=${{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px' }}>
      ${legendItem(composition.spokenFor, 'SPOKEN FOR', money(-spokenFor), color.textMid)}
      ${legendItem(composition.buffer, 'BUFFER', money(buffer), color.textMid)}
      ${legendItem(composition.safe, 'SAFE', money(Math.round(amount)), amount < 0 ? color.redText : color.safe)}
    </div>
  </div>`;
}
