import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useClock, clockLabel } from '../lib/useClock.js';

// Device status bar: LIVE time left · "SPENDR OS" + battery right. The battery
// reads the real level where the browser exposes it (Chromium); otherwise it
// holds a steady 72%.
export function StatusBar() {
  const now = useClock();
  const [battery, setBattery] = React.useState(72);

  React.useEffect(() => {
    let batt, onChange;
    if (navigator.getBattery) {
      navigator.getBattery().then((b) => {
        batt = b;
        onChange = () => setBattery(Math.round(b.level * 100));
        onChange();
        b.addEventListener('levelchange', onChange);
      }).catch(() => { /* keep fallback */ });
    }
    return () => { if (batt && onChange) batt.removeEventListener('levelchange', onChange); };
  }, []);

  const low = battery <= 20;
  return html`<div style=${{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px 2px', fontFamily: font.readout, fontSize: '12px', color: color.textMid,
  }}>
    <span>${clockLabel(now)}</span>
    <div style=${{ display: 'flex', gap: '7px', alignItems: 'center' }}>
      <span style=${{ fontSize: '10px', letterSpacing: '1.5px', color: color.textFaint }}>SPENDR OS</span>
      <div style=${{ width: '22px', height: '10px', border: '1px solid ' + color.textFaint, borderRadius: '2px', padding: '1px' }}>
        <div style=${{ width: battery + '%', height: '100%', background: low ? color.amber : color.safe, borderRadius: '1px', transition: 'width 300ms ease-out' }}></div>
      </div>
    </div>
  </div>`;
}

// Screen title block (BILLS/BUDGET…) + subtitle.
export function ScreenTitle({ title, subtitle, right }) {
  return html`<div style=${{ padding: '12px 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
    <div>
      <div style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '24px', letterSpacing: '2px', color: color.textHi }}>${title}</div>
      ${subtitle && html`<div style=${{ fontFamily: font.readout, fontSize: '11px', color: color.textDim, letterSpacing: '0.5px', marginTop: '2px' }}>${subtitle}</div>`}
    </div>
    ${right}
  </div>`;
}
