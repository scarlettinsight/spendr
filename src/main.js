import { html } from './lib/html.js';
import { StoreProvider } from './state/store.js';
import { App } from './App.js';

// ReactDOM comes from the vendored UMD build loaded in index.html.
const { createRoot } = window.ReactDOM;

createRoot(document.getElementById('root')).render(
  html`<${StoreProvider}><${App} /></${StoreProvider}>`
);
