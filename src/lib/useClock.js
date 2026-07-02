import { React } from './html.js';

// Live clock — re-renders subscribers every 15s (plenty for a minute display).
export function useClock() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// "12:47" — 12-hour, no AM/PM (status-bar style)
export function clockLabel(d) {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// time-of-day greeting
export function greetingFor(d) {
  const h = d.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function monthName(d) {
  return d.toLocaleString('en-US', { month: 'long' });
}
