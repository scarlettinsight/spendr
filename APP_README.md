# Spendr — implementation (V3: real dates + recurrence + double-entry)

**V3 (2026-07-02)** rebuilt the data model per the improvement spec:
- **Bills vs Expenses**: bills are scheduled series (once/weekly/biweekly/monthly/
  yearly/custom-interval, or monthly-anytime); expenses are the ledger. Paying a
  bill occurrence atomically creates a linked, amount-editable ledger expense.
- **Committed vs Paid**: unpaid occurrences count as Committed against their
  category (dim bar segment); only PAID entries touch the balance. Paying releases
  the committed amount and books the actual paid amount.
- **Occurrence editing (Google Calendar pattern)**: editing a recurring bill
  prompts "This occurrence only" (persistent keyed override) vs "This and all
  future" (series split; future overrides carried forward).
- **Calendar tab**: MONTH (free navigation + jump-to-month picker, day detail,
  anytime strip) · WEEK (full weeks across month boundaries) · FLOW (day-by-day
  projection: table + SVG line chart with zero line, ⚠ first-negative + lowest
  point). Horizon 30/45/60 days.
- **Budget tab**: BUDGETS (monthly envelopes, Spent+Committed segments, month
  navigation, over/under for closed months) · REPORT (% of total spending by
  category AND by flag; This/Last month, 30/90d ranges).
- **Safe to spend** = balance − upcoming unpaid bills before next income − buffer,
  floored at $0 with the shortfall amount + date surfaced.
- Negative starting balances supported everywhere; Settings has both "Reset to
  Sample" and "Delete All Data" (double-confirmed).
- Storage `spendr.state.v3`; v2 data migrates best-effort on first load.

---

# Prior: V2 + Motion/Delight

A faithful, runnable recreation of the Spendr design handoff, updated to the
**V2 visual overhaul** (4-accent palette, flat surfaces, strict glow budget) and the
**Motion/Delight pass** (M1–M4 celebration moments, swipe-to-pay, quick-log, undo
everywhere). `README.md`/`BUILD_ORDER.md` describe v1; the V2 handoff supersedes
their tokens and hero/bill/budget structure. Note: the V2 reference boards
(`#2a`/`#3a` in Spendr.dc.html, SpendrBill2/SpendrNav2.dc.html) were not present in
the bundle — this implementation was built from the written V2 spec, with keyframes
authored to match the described shapes.

**V2 rules implemented:** exactly 4 accents (emerald/amber/red/cyan) + neutral
`#5f7fae` bars; color means state, never category; cyan only on interactive
elements; glow only on the hero number, header status dot, and celebrations
(plus, by user choice, the FAB hover bloom and faint toast shadows); type floors
10px/13px, tracking ≤2px; flat cards, no gradients except the hero.

**Motion:** fast 150ms / base 220ms / celebrate 600–1200ms spring, one-shot only.
Numbers roll (~600ms), bars glide, celebrations fire once per action.
- **M1 bill paid** — takeover card (spring pop), SVG ring+check draw, confetti
  burst, debt bar to new fraction ("63% of July debt cleared"); NICE/tap dismisses,
  then a 5s undo toast.
- **M2 expense logged** — hero rolls down; bottom slide-up toast with UNDO (5s);
  quick-log chips (top 5 repeated expenses) log in one tap with a cyan ripple.
- **M3 budget limit** — calm amber panel (2-cycle pulse, no red/shake/confetti),
  supportive copy, one-tap "SHIFT $20 FROM OTHER" + OK.
- **M4 payday** — tap a planned income row when it lands: emerald sweep + rising
  motes on the hero, number rolls up, RECEIVED ✓ flips in, streak card increments.
- **Swipe-to-pay** — drag a bill card right past 40% to pay (→ M1); otherwise
  spring-back. **Undo everywhere** — every log/pay/receive/shift leaves a 5s undo.
- `prefers-reduced-motion`: celebrations are skipped, rolls snap; state updates
  instantly either way.

## Stack

- **React 18 + htm**, no build step, no Node required. `htm` replaces JSX so components
  are authored in plain `.js`. React/ReactDOM (UMD) and htm are **vendored in `vendor/`**,
  along with the Chakra Petch + Space Grotesk woff2 fonts — the app runs **fully offline**
  with zero external requests.
- Served as static files (any static server works). For development use
  `python3 serve.py 5177` (see `.claude/launch.json`) — it sends `Cache-Control:
  no-cache` so the browser picks up edits on reload. Plain `python3 -m http.server`
  works too, but browsers will heuristically cache the ES modules and can keep
  running stale code after you edit.
- Dark-mode only. Fonts: **Chakra Petch** (readouts/numbers/labels) + **Space Grotesk**
  (UI/body), vendored locally (latin subset).
- State persists to `localStorage`.

> Chosen because the workstation has no Node/npm. The structure still follows the
> phased build order (tokens → primitives → components → screens → flows → logic), so
> porting to React + Vite/TypeScript or React Native later is mechanical.

## Run

```bash
python3 serve.py 5177
# open http://localhost:5177/
```

The app targets a 390px device frame; view in a narrow window or mobile emulation.

## Structure

```
vendor/       react + react-dom (UMD), htm (ESM), fonts.css + woff2 files — all local
src/
  theme/      tokens.js (single source of truth), global.css
  lib/        html.js (htm binding), format.js (money helpers)
  state/      model.js (seed data) · derive.js (money engine) · store.js (reducer+context)
  primitives/ StatusDot, Chip, StatTile, ProgressBar, ProgressRing, Button, Fab, SectionLabel
  components/ SafeToSpendHero, BillCard, BillGroup, DebtPulseCard, IncomeRow,
              CategoryCard(+MiniCard), TransactionRow, BottomNav, BottomSheet,
              Banners (Warning/Empty), StatusBar
  screens/    Home, Bills, Budget, History, Settings
  sheets/     AddSheet (Expense/Income/Bill), MarkPaid, fields.js
  App.js      device frame, tab routing, FAB, sheet management
```

## The money engine (`src/state/derive.js`)

```
safeToSpend   = expectedChecking − alreadySpokenFor − requiredBuffer
committedPct  = alreadySpokenFor / (expectedChecking − requiredBuffer)
financialState= Critical (safe ≤ 0 | committed > 100%)
              | Caution  (committed ≥ 75% | safe < ½ buffer)
              | Stable
```

Everything on Home derives from this: the hero number/color, the committed ring, the
stat tiles, Debt Pulse aggregates, and the budget summary. Actions recompute it:

- **Mark bill paid** → moves Unpaid→Paid, updates the Debt Pulse paid/upcoming split, and
  (if "deduct now") reduces checking.
- **Add expense** → live "Safe to Spend after" preview (amber when it pushes below the
  buffer), then commits a transaction + bumps the category's spent.

## Everything is editable (tap it)

- **Bills** — tap any bill card: Mark Paid (M1), EDIT BILL (name, amount, due day
  or "Anytime this month", budget category, flags, source), DELETE. Paid bills can
  be marked unpaid.
- **Bills ↔ budget**: link a bill to a budget category with a "Counts toward
  budget" toggle — the bill adds to the category's planned; paying it adds to the
  category's spent. Category bars show a dim segment for bill money still ahead.
  Flexible ("anytime this month") bills group separately and are reserved in
  Safe-to-Spend immediately.
- **Category colors**: each budget category has a chosen color (8-swatch palette,
  distinct from the emerald/amber/red status accents). The color shows on category
  cards, linked bill cards, transaction rows, and the picker pills.
- **Income manager**: Settings → Planned income opens the full list (tap to
  edit/receive/delete, + add).
- **Flags**: Autopay/Debt/BNPL/Sub are system flags (engine meaning; not
  deletable). Custom flags are user-managed — create/rename/delete in Settings →
  Flags, or mint one inline with "+ new" in any flag picker. Attach to bills
  (shown as chips on the card) and to expenses/ledger entries (shown in the
  History meta line; toggle instantly in the entry sheet). Deleting a flag hides
  it everywhere; undo restores it with all attachments intact.
- **Budget** — tap a category card to edit its name/budget/planned or delete it;
  "+ ADD CATEGORY" creates new ones (they appear in the Add sheet's pills).
  Category status (ON TRACK/WATCH/TIGHT/LIMIT REACHED) is live-computed.
- **Income** — tap a row: MARK RECEIVED (fires the M4 payday), edit name/amount/
  expected day, or delete.
- **History** — tap an entry to delete it.
- **Payment sources** — tap a source to rename it, change its type (bank account
  vs credit card — the type drives the Safe-to-Spend engine), or remove it;
  "+ Add payment source" creates new ones. At least one source is always kept.
- **Settings** — tap Starting balance / Required buffer / Your name to edit;
  Configure rows jump to the right screen.
- **Money entry** — all currency fields use a dedicated $-prefixed input:
  decimal keypad on phones, one decimal point, max 2 decimals; the big Add-sheet
  readout shows the raw string as you type (pending "." included).
- Every mutation leaves a **5s undo toast** that fully reverses it.

## Interactions to try

- Bottom nav switches screens (180ms ease-out fade); active tab glows with a top
  indicator bar. **SEE ALL ›** on Home jumps to Bills / Budget.
- **FAB** (Home) opens the Add sheet; the segment swaps Expense / Income / Bill forms.
- Tap any bill → **Mark Paid** sheet.
- **Settings → States Preview** forces Stable / Caution / Critical (Phase-6 states
  pass) — the hero color + messaging swap, and in Caution/Critical a data-driven
  **warning banner** appears under the hero (e.g. "Rent clears today · $1,450 will
  drop you below buffer").
- Settings → **Export CSV** downloads the ledger; **Reset App** restores seed data.
- Keyboard-accessible focus rings; honors `prefers-reduced-motion`.

## Event juice (action-driven — idle UI stays calm)

- **HUD toasts** drop in under the status bar for every money moment: EXPENSE LOGGED,
  INCOME ADDED, BILL ADDED, PAID, plus threshold alerts (RUNNING TIGHT at 90% of a
  category budget, BUDGET REACHED at 100%) and financial-state transitions
  (ENTERING CAUTION / CRITICAL / BACK TO STABLE).
- **Scanner sweep** — a band of light passes up the screen once on the big moments
  (expense logged = cyan, income/paid/back-to-stable = emerald).
- **Rolling numbers** — the Safe-to-Spend hero counts to its new value with a glow
  bloom; Debt Pulse paid/upcoming stats roll when a payment lands.
- **Live meters** — progress bars fill on mount and glide on recompute; the committed/
  allocated rings sweep with a rolling % label.
- **PAID chip pops** in with an overshoot when a bill flips from unpaid.
- **FAB** blooms on hover and rotates on press.
- All of it is one-shot and action-driven — no idle pulsing, per the design's
  "calm command center" rule — and collapses to instant under `prefers-reduced-motion`.

## Notes on fidelity vs. the static mockup

The `.dc.html` references contain a few standalone sample numbers that aren't internally
consistent with the detailed data (e.g. the History "net" string, the Budget summary
totals vs. the sum of category cards, and the hero's Expected Checking tile). This
implementation drives **every** value from one consistent model, so a handful of
computed figures differ slightly from those illustrative samples while the layout,
type, color, states, and the headline behaviour (committed 62%, Stable) match.
