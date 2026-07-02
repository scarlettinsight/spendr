import { html } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';

// V2: warning tone matches the state — amber for caution, red for critical. Flat.
const TONES = {
  caution: { rgb: '255,180,55', text: color.amber },
  critical: { rgb: '255,84,112', text: color.redText },
};

export function WarningBanner({ headline, detail, tone = 'critical' }) {
  const t = TONES[tone] || TONES.critical;
  return html`<div style=${{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
    borderRadius: '13px', background: `rgba(${t.rgb},0.06)`, border: `1px solid rgba(${t.rgb},0.26)`,
  }}>
    <span style=${{
      width: '26px', height: '26px', borderRadius: '50%', background: `rgba(${t.rgb},0.12)`,
      border: `1px solid rgba(${t.rgb},0.34)`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: t.text, fontFamily: font.readout, fontWeight: 700, flex: '0 0 auto',
    }}>!</span>
    <div>
      <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '13px', color: t.text }}>${headline}</div>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, marginTop: '2px' }}>${detail}</div>
    </div>
  </div>`;
}

// Dashed tile + rotated diamond glyph + reassuring copy. Never shame-based.
export function EmptyState({ title = 'All clear', caption = 'No bills due before payday' }) {
  return html`<div style=${{
    textAlign: 'center', padding: '26px 18px', borderRadius: '13px',
    border: `1px dashed ${color.borderStrong}`, background: 'rgba(255,255,255,0.02)',
  }}>
    <div style=${{
      width: '40px', height: '40px', borderRadius: '11px', border: `1px solid ${color.borderStrong}`,
      margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color.textFaint, fontSize: '22px', transform: 'rotate(45deg)',
    }}>◇</div>
    <div style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid }}>${title}</div>
    <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, marginTop: '3px', letterSpacing: '0.5px' }}>${caption}</div>
  </div>`;
}
