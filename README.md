# Handoff: Spendr — Cyberpunk / Retrowave Personal Finance App

## Overview
Spendr is a mobile-first personal finance & bill-management app. Its single emotional job is to answer:
**"What money is already spoken for, and what is actually safe to spend?"**

The hero metric is **Safe to Spend**. Everything else (bills, debt, income, budgets) exists to explain and protect that number. The aesthetic is a calm-but-high-tech "financial command center at midnight": cyberpunk 2077 / synthwave / neon-city-dashboard — dark, moody, glowing, premium — but clean, legible, and fast to scan. **Not** a loud arcade game.

## About the Design Files
The files in this bundle are **design references authored in HTML** (as "Design Components"). They are prototypes that show the intended look, layout, hierarchy, and states — **not production code to copy verbatim**.

The task is to **recreate these designs in the target codebase's environment** using its established patterns, component library, and conventions. If the project targets React Native / Expo, SwiftUI, Flutter, or a React web stack, build native components there. If no environment exists yet, choose the most appropriate framework for a mobile-first finance app and implement the designs there. Do not ship the raw HTML.

The HTML uses a small custom runtime (`<x-dc>`, `<sc-for>`, `<dc-import>`). Ignore the runtime mechanics — read the markup for structure/styling and the `.dc.html` logic classes for the data model and computed values.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, glows, and component states are all intentional. Recreate the UI faithfully using the codebase's libraries. Exact hex values, fonts, and sizes are documented below.

---

## Design Tokens

### Color — surfaces
| Token | Hex | Use |
|---|---|---|
| `bg` | `#04060c` / `#05070d` | App background (near-black, navy-tinted) |
| `bg.elev` | `#080b13` | Phone/screen base |
| `panel` | `#101724` | Charcoal panel base |
| `card.grad.top` | `rgba(22,30,48,0.72)` | Card gradient top (glass) |
| `card.grad.bottom` | `rgba(12,16,26,0.66)` | Card gradient bottom |
| `border` | `rgba(120,160,220,0.12–0.14)` | Default hairline border |
| `divider` | `linear-gradient(90deg, rgba(120,160,220,0.18), transparent)` | HUD divider line |

### Color — money status (semantic)
| Token | Hex | Meaning |
|---|---|---|
| `safe` (emerald) | `#35e6a1` | Safe / available / paid / positive |
| `cyan` | `#2fe1f0` | Primary accent, info, active nav |
| `violet` | `#8b7bff` | Buffer, planned, housing |
| `magenta` | `#ff3d9a` | Brand gradient endpoint, accent |
| `purple` (sub) | `#c07dff` | Subscriptions |
| `amber` | `#ffb236` | Caution / due soon / spent / tight |
| `orange` (bnpl) | `#ff7a3d` | BNPL / Affirm |
| `red` (debt) | `#ff4d68` | Debt / danger / critical |
| `red.text` | `#ff6d84` / `#ff8497` | Debt amount / danger text |
| `slate` | `#57657f` | Muted labels, skipped, "Later this month" |
| `text.hi` | `#eafff5` / `#e9eefb` | Primary text / big numbers |
| `text.mid` | `#c7d2e6` | Secondary text |
| `text.dim` | `#8493ad` / `#7d8aa3` | Tertiary / captions |
| `text.faint` | `#57657f` | Micro labels |

### Glow (use sparingly — key financial states only)
- Number glow: `text-shadow: 0 0 24px rgba(53,230,161,0.5)` (color matches status)
- Dot/status glow: `box-shadow: 0 0 8px <color>`
- Bar/ring glow: `box-shadow: 0 0 8–10px <color>`
- Card accent glow (debt): `box-shadow: 0 0 14px rgba(255,77,104,0.5)`

### Typography
Two families (Google Fonts):
- **Chakra Petch** — dashboard readouts, all numbers, ALL-CAPS labels, section headers, chips, nav labels. Weights 400/500/600/700. This is the "terminal" voice.
- **Space Grotesk** — UI body, merchant/bill names, settings rows, human copy. Weights 400/500/600/700.

Scale (px):
| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Hero number (Safe to Spend) | Chakra Petch | 47 (cents 26) | 700 | — |
| Screen title (BILLS/BUDGET…) | Chakra Petch | 24 | 700 | 2px |
| Big stat / debt total | Chakra Petch | 30–40 | 700 | — |
| Card number / amount | Chakra Petch | 14–16 | 600 | — |
| Bill/merchant name | Space Grotesk | 13.5–15 | 600 | — |
| Section label | Chakra Petch | 11 | 500 | 2.5px, uppercase |
| Micro label (stat caption) | Chakra Petch | 8.5–9 | 500 | 1px, uppercase |
| Chip | Chakra Petch | 8.5–9 | 600 | 1px, uppercase |
| Nav label | Chakra Petch | 9.5 | 500 | 1.4px, uppercase |
| Body copy | Space Grotesk | 12–13 | 400 | — |

**Never smaller than 8.5px on chips; body/interactive text ≥12px.** Numbers are always Chakra Petch and always tabular-feeling.

### Spacing & shape
- Screen horizontal padding: **16px**; header padding: 18px.
- Card padding: 12–20px. Section gap: 14–16px. Item gap in lists: 7–11px.
- Radius: cards **14–16px**, hero **20–22px**, chips **5–6px**, pills/segments **9–12px**, phone frame **46px**, bottom sheet **28px top corners**, FAB/dots **50%**.
- Hairline borders `1px`; left accent bar on bill cards `3px`, inset 10–11px top/bottom.
- Bottom nav height ~72px; FAB 56px; hit targets ≥44px.

### Motifs (do not let them hurt legibility)
- **Grid background**: two `repeating-linear-gradient` at `rgba(120,160,220,0.035)`, 46px cells, plus two radial glows (blue top-left, magenta top-right) at ~0.07–0.12 alpha, `background-attachment: fixed`.
- **Retrowave horizon** (hero only): bottom 78px strip = magenta→cyan gradient at ~0.05 alpha + vertical scanlines masked to fade upward.
- **Conic progress ring**: `conic-gradient(<status> 0% N%, rgba(255,255,255,0.06) N% 100%)` with a `#0a0e17` inner disc — used for "committed %" (Home) and "allocated %" (Budget).
- **Status dots**: 6–12px circles with matching glow.

---

## Screens / Views

Device frame: **390px wide** (iPhone-class), dark bezel, content scrolls; a status bar row (time left, "SPENDR OS" + battery glyph right) tops every screen; bottom nav is fixed.

### 1. Home (dashboard)
**Purpose:** At-a-glance answer to "am I safe to spend right now?"
Layout top→bottom:
1. **Status bar** → **App header**: "Good evening, Alex" + "July Cycle"; right = STABLE status pill (emerald dot + label).
2. **Safe-to-Spend hero card** (the largest element):
   - Border `1px rgba(53,230,161,0.24)`, glow `0 0 34px rgba(53,230,161,0.09)`, gradient bg, horizon motif at bottom.
   - Left: "● SAFE TO SPEND" label (emerald), then `$1,284.50` at 47px, then `safe until Jul 15 · next paycheck`.
   - Right: 82px conic ring showing `62% COMMITTED`.
   - Bottom: 3 mini stat tiles — **Expected Checking** `$3,420` (neutral), **Spoken For** `−$2,135` (amber tile), **Buffer** `$500` (violet tile).
3. **Coming Up** section — grouped bills (Due Today, This Week…), each group has an accent dot + label + fading divider; bills rendered as Bill Cards (see components). Debt/BNPL cards look different (red/orange).
4. **Debt Pulse card** — red-tinted. `$823 due this month`, a split progress bar (paid emerald vs upcoming orange→red), and 3 stats: Paid `$132`, Upcoming `$691`, BNPL/Affirm `$220`. Tone: tactical, never shaming.
5. **Income Status** — rows: name + date + amount + status chip (RECEIVED/PLANNED/SKIPPED).
6. **Budget** snapshot — 2-col grid of 4 category mini-cards (name, remaining, mini bar, "spent of budget · left").
7. **FAB** — 56px, cyan→violet gradient `+`, bottom-right above nav.
8. **Bottom nav** (Home active).

### 2. Bills
**Purpose:** Every recurring/upcoming bill occurrence, grouped by urgency.
- Header "BILLS" + "10 active · $2,536 remaining this cycle".
- Filter chips: **ALL** (active = cyan solid, `#04060c` text), Autopay, Debt (red-tinted), Subs (purple-tinted).
- Groups with urgency headers + right-aligned group total: **DUE TODAY** (red), **THIS WEEK** (amber), **BEFORE NEXT PAYCHECK** (cyan), **LATER THIS MONTH** (slate).
- Each row = Bill Card. Debt/BNPL styled red/orange; each shows AUTOPAY / DEBT / BNPL / SUB chips and a PAID / DUE SOON / UNPAID status.

### 3. Budget
**Purpose:** Category-level plan vs actual.
- Header "BUDGET" + "July · day 1 of 31".
- **Summary card**: 96px cyan conic ring `71% ALLOCATED` + Budget `$2,490` / Spent `$1,769` (amber) / Remaining `$721` (emerald).
- **Category cards** (full width): color dot + name + status chip (ON TRACK/STABLE/TIGHT/WATCH/FUNDED), a progress bar (spent/budget, colored by category), then a 4-up stat row: Budget / Planned (violet) / Spent (amber) / Left (category color).

### 4. History
**Purpose:** Transaction ledger with checking-impact clarity.
- Header "HISTORY" + "last 7 days · net −$113". Filter chips: ALL / Spent / Income / Checking.
- **Transaction rows**: left date block (MON + big day) · vertical divider · name + category dot/label + payment source · right = amount (green for income, neutral/red for spend) + **checking-impact indicator** (`↓ Checking` red, `↑ Checking` emerald, `Card · no impact` slate).

### 5. Settings
**Purpose:** Configure the money engine.
- Grouped list sections with cyan section labels:
  - **MONEY ENGINE**: Starting checking balance `$3,540.00`; Required buffer `$500.00` (+ caption "Protected · never counted as safe").
  - **PAYMENT SOURCES**: Checking ··1247 (PRIMARY, emerald dot); Amex ··8 (CREDIT, purple dot).
  - **CONFIGURE**: Budget categories (7 ›); Planned income (3 ›).
  - **DATA** (red label): Export CSV (cyan outline) / Reset App (red outline) buttons.

### Quick-add bottom sheets (modals)
Rounded-top (28px) sheet over a dimmed/blurred backdrop; grabber handle; title + close ✕.
- **Add Expense**: big amount readout `$48.00`; segmented Expense/Income/Bill (active = cyan→violet gradient); category chips; payment-source selectors; **impact preview** ("SAFE TO SPEND AFTER $1,236.50", amber); primary "SAVE EXPENSE" button.
- **Mark Bill Paid**: red-accented bill summary (Car Payment — Toyota $389, DEBT + AUTOPAY chips); fields Paid From / Date Paid / Amount; toggle "Deduct from checking now" (on, emerald); primary "CONFIRM PAID" (emerald→cyan).
Also design **Add Income** and **Add Recurring Bill** on the same sheet pattern.

---

## Components (reusable specs)

- **Safe-to-Spend hero card** — see Home #2. Status-colored: emerald/amber/red border+glow, ring %, and label swap by state.
- **Stat tile** — small rounded tile: micro uppercase label (Chakra Petch 8.5px) + value (Chakra Petch 15px). Optional tinted bg/border for semantic emphasis.
- **Bill card** (`SpendrBill`) — left 3px accent bar (cyan normal / amber urgent / red debt / orange bnpl) with glow; category dot + name; due + source line (due turns amber when urgent); chip row (AUTOPAY/DEBT/BNPL/SUB); right = amount + status chip (PAID emerald / DUE SOON amber / UNPAID slate). Debt variant uses red-tinted bg + border and red amount.
- **Chips** — 8.5–9px Chakra Petch, 1px tracking, radius 5–6px, tinted bg (~0.1–0.13 alpha) + border (~0.28–0.34 alpha) in the semantic color. Variants: AUTOPAY (cyan), DEBT (red), BNPL (orange), SUB (purple), PAID (emerald), DUE SOON (amber), UNPAID (slate), SKIPPED (slate), WATCH THIS (red).
- **Category budget card** — see Budget. Progress bar colored by category, glow on fill.
- **Transaction row** — see History. Includes checking-impact indicator.
- **Bottom navigation** (`SpendrNav`) — 5 tabs Home/Bills/Budget/History/Settings. Inactive `#57657f`; active `#2fe1f0` with icon drop-shadow glow + 24×2px top indicator bar (cyan, glowing). Simple geometric icons (diamond, stacked bars, donut, clock, three dots).
- **FAB** — 56px circle, `linear-gradient(145deg,#2fe1f0,#8b7bff)`, `+` in `#04060c`, glow `0 0 24px rgba(47,225,240,0.5)`.
- **Primary button** — cyan→violet gradient, dark text, letter-spacing 2px, glow. **Ghost button** — cyan text, `rgba(47,225,240,0.06)` bg, cyan 0.3 border.
- **Bottom sheet / modal** — dimmed blurred backdrop, 28px top radius, grabber, status-colored border/glow matching the action.
- **Warning state** — red-tinted row: `!` badge + bold red headline + dim explanation (e.g. "Rent clears in 2 days / $1,450 will drop you below buffer").
- **Empty state** — dashed border tile, rotated diamond glyph, "All clear" + reassuring caption.
- **Status lights** — Stable (emerald) / Caution (amber) / Critical (red), 12px glowing dots.

## Interactions & Behavior
- Tabs switch root screen; active tab gets cyan color + glow + top indicator bar.
- FAB opens the Add sheet; sheet slides up from bottom over a blur+dim backdrop; ✕ or backdrop tap dismisses.
- Segmented control (Expense/Income/Bill) swaps form + which fields show.
- **Live impact preview**: as amount/source change in Add Expense, recompute and show resulting Safe to Spend (amber if it pushes toward caution).
- Marking a bill paid moves it Unpaid→Paid, updates Debt Pulse (paid/upcoming split) and, if "deduct now" is on, reduces checking → recomputes Safe to Spend.
- Suggested transitions: 150–220ms ease-out for sheets/among tabs; glow is static (no pulsing) to stay calm.
- Copy rule: calm/tactical only — Safe to Spend, Already Spoken For, Coming Up, Protected Buffer, Due Soon, Paid, Skipped, Watch This, Tight, Stable, Critical, On Track. **Never** shame-based language.

## State Management
Core model & derived values (see logic classes in `Spendr.dc.html`):
- Inputs: `startingCheckingBalance`, `requiredBuffer`, `paymentSources[]`, `bills[]` (name, amount, dueDate, category, source, flags: autopay/debt/bnpl/sub/paid, urgency), `plannedIncome[]` (name, amount, date, status), `budgetCategories[]` (budget, planned, spent → remaining), `transactions[]` (date, name, amount, category, source, checkingImpact).
- **Derived**: `expectedChecking` = starting + received/planned income − cleared; `alreadySpokenFor` = sum of committed bills before next paycheck; **`safeToSpend` = expectedChecking − alreadySpokenFor − requiredBuffer**; `committedPct` for ring; `financialState` = Stable/Caution/Critical thresholds driving hero color; Debt Pulse aggregates (dueThisMonth, paid, upcoming, bnpl).
- State example values live in the HTML logic classes as realistic sample data.

## Financial-state thresholds (design intent)
- **Stable** (emerald): safe-to-spend positive with comfortable margin; committed ≲ 75%.
- **Caution** (amber): safe-to-spend low / committed ~75–100%; "tight, keep it lean."
- **Critical** (red): safe-to-spend ≤ 0 / committed > 100%; bills exceed safe funds — prompt to move money. (Confirm exact cutoffs with product.)

## Design Tokens (quick copy list)
Colors: `#04060c #05070d #080b13 #101724 #e9eefb #eafff5 #c7d2e6 #8493ad #7d8aa3 #57657f #2fe1f0 #35e6a1 #8b7bff #ff3d9a #c07dff #ffb236 #ff7a3d #ff4d68 #ff6d84 #ff8497`
Radii: `5 6 9 12 14 16 20 22 28 46 / 50%`  · Borders: `1px`, accent `3px`
Fonts: Chakra Petch (numbers/labels), Space Grotesk (UI/body)

## Assets
- **Fonts**: Google Fonts — Chakra Petch, Space Grotesk. No other external assets.
- **Icons**: simple geometric glyphs drawn inline (diamond, stacked bars, donut/circle, clock, three dots); swap for the codebase's icon set if preferred, keeping the minimal HUD feel.
- No raster images or logos required. No brand assets.

## Screenshots
Reference renders of every screen are in `screens/` (retina PNGs):
`01-home.png`, `02-bills.png`, `03-budget.png`, `04-history.png`, `05-settings.png`, `06-add-expense.png`, `07-mark-paid.png`.

## Build order
`BUILD_ORDER.md` is a phased, checkable implementation sequence (tokens → primitives → components → screens → flows → logic) — a good first read for whoever implements this.

## Files (in this bundle)
- `BUILD_ORDER.md` — phased build checklist.
- `screens/` — per-screen reference screenshots.
- `Spendr.dc.html` — the full board: all 5 screens, both quick-add sheets, the 3 Safe-to-Spend states (Stable/Caution/Critical), and a component/color/type reference panel. **Data model + derived values live in its logic class.**
- `SpendrBill.dc.html` — Bill Card component (props + variant logic: debt/bnpl/urgent/paid styling).
- `SpendrNav.dc.html` — Bottom navigation component (active-tab logic).

To view: open `Spendr.dc.html` in a browser. Read the markup for structure/styling and the trailing `<script data-dc-script>` class for the data + computed fields.
