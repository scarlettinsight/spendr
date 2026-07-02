import { html, React } from '../lib/html.js';

// Track + colored fill. V2: flat (no glow). `segments` supports split fills
// (Debt Pulse): [{ pct, color, gradient }]. Or pass a single `pct` + `color`.
// Fills sweep in from 0 on mount and glide on any recompute — bars never jump.
export function ProgressBar({ pct, color, segments, height = 6, glow = false, track = 'rgba(255,255,255,0.06)' }) {
  const fills = segments || [{ pct, color }];

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return html`<div style=${{
    height: height + 'px',
    borderRadius: '4px',
    background: track,
    overflow: 'hidden',
    display: 'flex',
  }}>
    ${fills.map((f, i) => html`<div key=${i} style=${{
      width: (mounted ? Math.max(0, Math.min(100, f.pct)) : 0) + '%',
      height: '100%',
      background: f.gradient || f.color,
      boxShadow: glow && f.color ? `0 0 8px ${f.color}` : 'none',
      borderRadius: '4px',
      transition: 'width 550ms cubic-bezier(0.22, 1, 0.36, 1)',
    }}></div>`)}
  </div>`;
}
