# Spendr — Build Order & Component Checklist

A suggested implementation sequence for Claude Code. Build bottom-up (tokens → primitives → components → screens → flows) so each screen is assembled from parts that already exist. Check items off as you go.

Screenshots of every screen live in `screens/` (referenced below). Exact specs are in `README.md`. The HTML references (`Spendr.dc.html`, `SpendrBill.dc.html`, `SpendrNav.dc.html`) hold the sample data model and computed values.

---

## Phase 0 — Foundation
- [ ] Confirm target stack (React web / React Native / SwiftUI / Flutter). Match its conventions; don't port the HTML runtime.
- [ ] Add fonts: **Chakra Petch** (numbers/labels) + **Space Grotesk** (UI/body).
- [ ] Create the token layer from README → Design Tokens: color constants, spacing, radii, type scale, glow presets. One source of truth (theme file / design tokens).
- [ ] Set the app to **dark mode only**. Global background = grid + radial-glow motif (`#04060c` base).
- [ ] Establish the two type roles as text styles/variants (`Readout` = Chakra Petch, `Body` = Space Grotesk).

## Phase 1 — Primitives (dumb, reusable)
- [ ] **StatusDot** — colored dot + glow; sizes 6/8/12px.
- [ ] **Chip** — variants: AUTOPAY, DEBT, BNPL, SUB, PAID, DUE SOON, UNPAID, SKIPPED, WATCH THIS (each = semantic color + tinted bg + border). *Ref: component panel in `Spendr.dc.html`.*
- [ ] **StatTile** — micro label + value; optional semantic tint.
- [ ] **ProgressBar** — track + colored fill with glow; supports split fills (Debt Pulse).
- [ ] **ProgressRing** — conic ring + inner disc; center value + caption (used for committed % and allocated %).
- [ ] **Button** — Primary (cyan→violet gradient, dark text, glow), Ghost (cyan outline), Danger (red outline). Min height 44px.
- [ ] **FAB** — 56px gradient circle `+`.
- [ ] **SectionLabel** — uppercase Chakra Petch 11px, 2.5px tracking, optional leading dot + trailing fade divider.

## Phase 2 — Composite components
- [ ] **SafeToSpendHero** — the hero card. Props: `amount`, `state` (stable/caution/critical → drives border/glow/label/ring color), `committedPct`, `expectedChecking`, `spokenFor`, `buffer`, `safeUntil`. Includes ProgressRing + 3 StatTiles + horizon motif. *Screens: `screens/01-home.png`; states → README "Financial-state thresholds".*
- [ ] **BillCard** (`SpendrBill.dc.html`) — props: name, amount, due, category(+color), source, flags (autopay/debt/bnpl/sub/paid/urgent). Left accent bar + chips + status. Debt/BNPL variant = red/orange styling. *Screens: `screens/02-bills.png`.*
- [ ] **BillGroup** — urgency header (accent dot + label + total) wrapping a list of BillCards.
- [ ] **DebtPulseCard** — total + split ProgressBar + Paid/Upcoming/BNPL stats. Red-tinted, tactical tone.
- [ ] **IncomeRow** — name + date + amount + status chip (Received/Planned/Skipped).
- [ ] **CategoryCard** — name + dot + status chip + ProgressBar + 4-up stat row (Budget/Planned/Spent/Left). Also a **CategoryMiniCard** (2-col, used on Home).
- [ ] **TransactionRow** — date block + name + category + source + amount + checking-impact indicator (↓/↑ Checking, Card·no impact).
- [ ] **BottomNav** (`SpendrNav.dc.html`) — 5 tabs, active = cyan + glow + top indicator bar.
- [ ] **BottomSheet** — dimmed/blurred backdrop, grabber, title + close, status-colored border; slide-up 150–220ms.
- [ ] **WarningBanner** and **EmptyState**.

## Phase 3 — Screens (assemble from Phase 1–2)
- [ ] **Home** — header → SafeToSpendHero → Coming Up (BillGroups) → DebtPulseCard → Income rows → Budget mini-grid → FAB → BottomNav. *`screens/01-home.png`*
- [ ] **Bills** — header + filter chips → BillGroups by urgency (Due Today / This Week / Before Next Paycheck / Later This Month). *`screens/02-bills.png`*
- [ ] **Budget** — summary card (ring + Budget/Spent/Remaining) → CategoryCard list. *`screens/03-budget.png`*
- [ ] **History** — header + filter chips → TransactionRow list with checking-impact. *`screens/04-history.png`*
- [ ] **Settings** — grouped lists: Money Engine, Payment Sources, Configure, Data (Export/Reset). *`screens/05-settings.png`*

## Phase 4 — Quick-add flows (bottom sheets)
- [ ] **Add Expense** — amount readout + Expense/Income/Bill segment + category chips + source selector + live Safe-to-Spend impact preview + Save. *`screens/06-add-expense.png`*
- [ ] **Mark Bill Paid** — bill summary + Paid From / Date / Amount + "Deduct now" toggle + Confirm. *`screens/07-mark-paid.png`*
- [ ] **Add Income** — same sheet pattern; status = Received/Planned.
- [ ] **Add Recurring Bill** — name, amount, cadence, due date, category, source, autopay, debt/BNPL/sub flags.

## Phase 5 — Logic & state
- [ ] Model the data (see README → State Management): sources, bills, plannedIncome, budgetCategories, transactions + the `requiredBuffer` / `startingCheckingBalance` settings.
- [ ] Implement the **Safe to Spend** derivation: `expectedChecking − alreadySpokenFor − requiredBuffer`, plus `committedPct` and the `financialState` (Stable/Caution/Critical) thresholds that drive the hero's color.
- [ ] Wire actions: mark paid → updates Debt Pulse + (optionally) checking → recomputes Safe to Spend; add expense → live impact preview then commit.
- [ ] Persist state (local DB / storage appropriate to the platform).

## Phase 6 — Polish
- [ ] Sheet slide + tab transitions (150–220ms ease-out). Keep glows **static** — no pulsing (stay calm).
- [ ] Verify contrast/legibility at a glance (README type minimums). Numbers always Chakra Petch.
- [ ] Audit copy against README's approved calm/tactical vocabulary — no shame-based language anywhere.
- [ ] States pass: render Home in Stable / Caution / Critical and confirm hero color + messaging swap correctly.

---

### Order rationale
Tokens and primitives first means every screen in Phase 3 is just composition — no restyling. BillCard and BottomNav are the highest-reuse components (start there among composites). Leave the Safe-to-Spend derivation (Phase 5) until the UI can display it, but keep the data shape from README in mind while building components so props line up.
