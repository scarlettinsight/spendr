import { html, React } from './lib/html.js';
import { color, motion } from './theme/tokens.js';
import { Home } from './screens/Home.js';
import { Calendar } from './screens/Calendar.js';
import { Bills } from './screens/Bills.js';
import { Budget } from './screens/Budget.js';
import { History } from './screens/History.js';
import { Settings } from './screens/Settings.js';
import { BottomNav } from './components/BottomNav.js';
import { Fab } from './primitives/Fab.js';
import { AddSheet } from './sheets/AddSheet.js';
import { MarkPaid } from './sheets/MarkPaid.js';
import { IncomeSheet } from './sheets/IncomeSheet.js';
import { CategorySheet } from './sheets/CategorySheet.js';
import { TxSheet } from './sheets/TxSheet.js';
import { ValueSheet } from './sheets/ValueSheet.js';
import { SourceSheet } from './sheets/SourceSheet.js';
import { IncomeListSheet } from './sheets/IncomeListSheet.js';
import { FlagSheet } from './sheets/FlagSheet.js';
import { ToastHub } from './components/ToastHub.js';
import { CelebrationHub } from './components/CelebrationHub.js';

export function App() {
  const [tab, setTab] = React.useState('Home');
  // sheet router:
  //   {type:'add', kind?, date?} | {type:'bill', occ} | {type:'income', occ}
  //   {type:'category', cat|null} | {type:'tx', tx} | {type:'value', config}
  //   {type:'source', source|null} | {type:'incomeList'} | {type:'flag', flag|null}
  const [sheet, setSheet] = React.useState(null);
  const scrollRef = React.useRef(null);

  const open = (s) => setSheet(s);
  const close = () => setSheet(null);
  const goTab = (t) => {
    setTab(t);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const screens = {
    Home: html`<${Home} open=${open} onNav=${goTab} />`,
    Calendar: html`<${Calendar} open=${open} />`,
    Bills: html`<${Bills} open=${open} />`,
    Budget: html`<${Budget} open=${open} />`,
    History: html`<${History} open=${open} />`,
    Settings: html`<${Settings} open=${open} onNav=${goTab} />`,
  };

  const phone = window.matchMedia('(max-width: 520px)').matches;

  return html`<div style=${{ minHeight: phone ? '100dvh' : '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: phone ? '0' : '20px 0 40px' }}>
    <div style=${{
      width: phone ? '100%' : '390px', flex: '0 0 auto',
      borderRadius: phone ? '0' : '46px', background: color.bg2,
      border: phone ? 'none' : `1px solid ${color.borderStrong}`,
      boxShadow: phone ? 'none' : '0 0 0 9px #0b0e16, 0 40px 90px rgba(0,0,0,0.7)',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style=${{
        height: phone ? '100dvh' : 'min(880px, calc(100vh - 60px))',
        minHeight: phone ? '0' : '640px',
        background: 'radial-gradient(120% 55% at 50% -8%, rgba(43,110,219,0.08), transparent 60%), linear-gradient(180deg, #0a0f19, #070a12)',
        display: 'flex', flexDirection: 'column', position: 'relative',
      }}>
        <div ref=${scrollRef} className="scroll-hide" style=${{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div key=${tab} style=${{ display: 'flex', flexDirection: 'column', flex: 1, animation: `spendr-fade-in ${motion.base} ease-out` }}>
            ${screens[tab]}
          </div>
        </div>

        <!-- context-aware FAB: Bills/Calendar add a bill, Budget a category, else an expense -->
        ${tab !== 'Settings' && html`<${Fab} onClick=${() => open(
          tab === 'Bills' || tab === 'Calendar' ? { type: 'add', kind: 'Bill' }
          : tab === 'Budget' ? { type: 'category', cat: null }
          : { type: 'add', kind: 'Expense' }
        )} />`}

        <${BottomNav} active=${tab} onTab=${goTab} />

        ${sheet?.type === 'add' && html`<${AddSheet} onClose=${close} initialKind=${sheet.kind || 'Expense'} initialDate=${sheet.date} />`}
        ${sheet?.type === 'bill' && html`<${MarkPaid} occ=${sheet.occ} onClose=${close} />`}
        ${sheet?.type === 'income' && html`<${IncomeSheet} occ=${sheet.occ} onClose=${close} />`}
        ${sheet?.type === 'category' && html`<${CategorySheet} cat=${sheet.cat} onClose=${close} />`}
        ${sheet?.type === 'tx' && html`<${TxSheet} tx=${sheet.tx} onClose=${close} />`}
        ${sheet?.type === 'value' && html`<${ValueSheet} config=${sheet.config} onClose=${close} />`}
        ${sheet?.type === 'source' && html`<${SourceSheet} source=${sheet.source} onClose=${close} />`}
        ${sheet?.type === 'incomeList' && html`<${IncomeListSheet} open=${open} onClose=${close} />`}
        ${sheet?.type === 'flag' && html`<${FlagSheet} flag=${sheet.flag} onClose=${close} />`}

        <${ToastHub} />
        <${CelebrationHub} />
      </div>
    </div>
  </div>`;
}
