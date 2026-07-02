import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';

// V2 FAB: solid cyan (interactive), flat at rest — plain elevation shadow only.
// Hover bloom + press-rotate live in .fab (global.css), kept as a signature touch.
export function Fab({ onClick }) {
  return html`<button onClick=${onClick} aria-label="Add" className="fab" style=${{
    position: 'absolute',
    right: '20px',
    bottom: '92px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    background: color.cyan,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
    color: color.onCyan,
    fontSize: '30px',
    fontWeight: 300,
    fontFamily: font.body,
    lineHeight: 1,
    zIndex: 20,
  }}>+</button>`;
}
