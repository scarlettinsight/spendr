// Tiny pub/sub for transient feedback. Two channels:
//  - toasts: top "state pills" (status voice) + M2 bottom undo-toasts
//  - celebrations: M1 bill-paid takeover, M3 calm budget-limit moment
// Module-level so any sheet/screen can push without prop drilling.

let toastListeners = new Set();
let celebrationListeners = new Set();
let nextId = 0;

// Bottom action toast (M2): { detail, undo?: fn, undoLabel?, duration? }
// Top state pill:          { lane: 'state', label, detail, color, rgb }
export function pushToast(t) {
  const toast = { id: ++nextId, lane: 'bottom', duration: t.undo ? 5000 : 3000, ...t };
  toastListeners.forEach((fn) => fn(toast));
}

export function onToast(fn) {
  toastListeners.add(fn);
  return () => toastListeners.delete(fn);
}

// Celebrations (one at a time — hub ignores new while one is active):
//  { type: 'paid', name, amount, debtCaption?, onDone? }
//  { type: 'limit', cat, over, canShift, onShift?, onDone? }
export function pushCelebration(c) {
  celebrationListeners.forEach((fn) => fn({ id: ++nextId, ...c }));
}

export function onCelebration(fn) {
  celebrationListeners.add(fn);
  return () => celebrationListeners.delete(fn);
}

export const reduceMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Payday channel (M4): fired when income is marked received; Home's hero
// subscribes to run the sweep + motes.
let paydayListeners = new Set();

export function pushPayday() {
  if (reduceMotion()) return;
  paydayListeners.forEach((fn) => fn());
}

export function onPayday(fn) {
  paydayListeners.add(fn);
  return () => paydayListeners.delete(fn);
}
