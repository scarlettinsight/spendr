import { html, React } from '../lib/html.js';
import { font, color, surface, stateTheme } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { onPayday } from '../lib/toast.js';
import { payOccurrence } from '../lib/actions.js';
import { useClock, greetingFor } from '../lib/useClock.js';
import { fmtShort, monthName } from '../lib/dates.js';
import { StatusBar } from '../components/StatusBar.js';
import { SectionLabel } from '../primitives/SectionLabel.js';
import { Button } from '../primitives/Button.js';
import { SafeToSpendHero } from '../components/SafeToSpendHero.js';
import { BillGroup } from '../components/BillGroup.js';
import { DebtPulseCard } from '../components/DebtPulseCard.js';
import { IncomeRow } from '../components/IncomeRow.js';
import { CategoryMiniCard } from '../components/CategoryCard.js';
import { WarningBanner } from '../components/Banners.js';

export function Home({ open, onNav }) {
  const { state, derived, dispatch } = useStore();
  const s = stateTheme[derived.financialState];
  const now = useClock();
  const [paydayTick, setPaydayTick] = React.useState(0);

  React.useEffect(() => onPayday(() => setPaydayTick((t) => t + 1)), []);

  const homeGroups = derived.groups.slice(0, 2);
  const homeIncome = derived.incomeOcc.filter((o) => !o.received && o.date >= derived.today).slice(0, 3);
  const homeCats = derived.categoriesNow.filter((r) => r.budget > 0).slice(0, 4);

  // shortfall/negative-projection warning (planner-driven)
  const warning = React.useMemo(() => {
    if (derived.firstNegative) {
      return {
        tone: 'critical',
        headline: `Projected balance ${money(derived.firstNegative.balance, { cents: true })} on ${fmtShort(derived.firstNegative.date)}`,
        detail: `lowest point ${money(derived.minPoint.balance, { cents: true })} · see Calendar → Flow`,
      };
    }
    if (derived.shortfall) {
      return {
        tone: 'caution',
        headline: `Dips below buffer on ${fmtShort(derived.shortfall.date)}`,
        detail: `${money(derived.shortfall.amount)} short before next income · Calendar → Flow`,
      };
    }
    return null;
  }, [derived.firstNegative, derived.shortfall, derived.minPoint]);

  return html`<div>
    <${StatusBar} />

    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px 6px' }}>
      <div onClick=${() => open({ type: 'value', config: { field: 'userName', title: 'Your name', label: 'NAME', kind: 'text', caption: 'Used in the Home greeting' } })}
        style=${{ cursor: 'pointer' }}>
        <div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim }}>
          ${greetingFor(now)}, ${state.settings.userName} <span style=${{ color: color.textFaint }}>✎</span>
        </div>
        <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '17px', color: color.textHi }}>${monthName(derived.today)} Cycle</div>
      </div>
      <div style=${{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 11px', borderRadius: '9px',
        background: s.chipBg, border: `1px solid ${s.chipBorder}`,
      }}>
        <span style=${{ width: '7px', height: '7px', borderRadius: '50%', background: s.color, boxShadow: s.dotGlow }}></span>
        <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1.5px', color: s.labelText }}>${s.label}</span>
      </div>
    </div>

    <div style=${{ flex: 1, padding: '8px 16px 96px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <${SafeToSpendHero}
        amount=${derived.safeToSpend}
        state=${derived.financialState}
        expectedChecking=${derived.currentBalance}
        spokenFor=${derived.upcomingTotal}
        buffer=${derived.buffer}
        subline=${derived.subline}
        paydayTick=${paydayTick} />

      ${warning && html`<${WarningBanner} tone=${warning.tone} headline=${warning.headline} detail=${warning.detail} />`}

      <div style=${{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <${SectionLabel} right="SEE ALL ›" onRight=${() => onNav('Bills')}>COMING UP<//>
        ${homeGroups.map((g) => html`<${BillGroup} key=${g.key} group=${g}
          onBill=${(o) => open({ type: 'bill', occ: o })} onPay=${(o) => payOccurrence(dispatch, derived, o)} />`)}
      </div>

      <${DebtPulseCard} debt=${derived.debt} />

      <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <${SectionLabel} right="MANAGE ›" onRight=${() => open({ type: 'incomeList' })}>INCOME AHEAD<//>
        ${homeIncome.map((o) => html`<${IncomeRow} key=${o.incomeId + o.key} occ=${o} onOpen=${(x) => open({ type: 'income', occ: x })} />`)}
        ${homeIncome.length === 0 && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, padding: '6px 2px' }}>no planned income ahead · add it under MANAGE</div>`}
      </div>

      ${derived.streak > 0 && html`<div style=${{
        display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 14px',
        borderRadius: '14px', background: surface.card, border: `1px solid ${color.border}`,
      }}>
        <span key=${derived.streak} style=${{
          fontFamily: font.readout, fontWeight: 700, fontSize: '21px', color: color.safe,
          animation: 'spendr-pop-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', flex: '0 0 auto',
        }}>×${derived.streak}</span>
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '13px', color: color.textHi }}>
            ${derived.streak} cycle${derived.streak === 1 ? '' : 's'} ended above buffer
          </div>
          <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: color.textDim, marginTop: '2px' }}>keep the buffer whole to extend it</div>
        </div>
        <${Button} variant="ghost" onClick=${() => onNav('Budget')} style=${{ minHeight: '34px', padding: '8px 12px', fontSize: '10px', letterSpacing: '1px', flex: '0 0 auto' }}>PLAN THIS CYCLE<//>
      </div>`}

      <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <${SectionLabel} right="SEE ALL ›" onRight=${() => onNav('Budget')}>BUDGET<//>
        <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
          ${homeCats.map((r) => html`<${CategoryMiniCard} key=${r.id} row=${r} onClick=${() => open({ type: 'category', cat: state.categories.find((c) => c.id === r.id) })} />`)}
        </div>
      </div>
    </div>
  </div>`;
}
