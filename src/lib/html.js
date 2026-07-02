// Zero-build JSX alternative: htm bound to React.createElement.
// React comes from the vendored UMD build loaded in index.html (window.React),
// so the app has no CDN/network dependency. htm is a dependency-free ES module.
import htm from '../../vendor/htm.module.js';

const React = window.React;

export const html = htm.bind(React.createElement);
export { React };
