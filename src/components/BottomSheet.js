import { html } from '../lib/html.js';
import { font, color, surface, motion } from '../theme/tokens.js';

// V2: flat sheet surface (#0d1320), hairline border, 220ms base slide-up.
// Backdrop tap or ✕ dismisses.
export function BottomSheet({ title, onClose, children }) {
  return html`<div style=${{ position: 'absolute', inset: 0, zIndex: 40 }}>
    <div onClick=${onClose} style=${{
      position: 'absolute', inset: 0, background: 'rgba(5,8,14,0.72)',
      backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      animation: `spendr-fade-in ${motion.base} ease-out`,
    }}></div>

    <div style=${{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      borderRadius: '28px 28px 0 0', padding: '12px 20px 26px',
      background: surface.sheet,
      border: `1px solid ${color.borderStrong}`, borderBottom: 'none',
      boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
      animation: `spendr-sheet-up ${motion.base} ease-out`,
      maxHeight: '92%', overflowY: 'auto',
    }} className="scroll-hide">
      <div style=${{ width: '42px', height: '4px', borderRadius: '3px', background: 'rgba(136,160,205,0.3)', margin: '2px auto 16px' }}></div>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '17px', letterSpacing: '1px', color: color.textHi }}>${title}</span>
        <button onClick=${onClose} style=${{
          width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${color.border}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: color.textDim, fontSize: '15px', cursor: 'pointer',
        }}>×</button>
      </div>
      ${children}
    </div>
  </div>`;
}
