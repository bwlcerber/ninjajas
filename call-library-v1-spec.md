# V1 — "Modern Clean Grid" Call Library Page

Design handoff spec for the **NinjaPromo Sales Portal → Call Library** page.
Hand this to Antigravity / Claude Code / any coding agent to implement V1
inside the existing portal.

---

## 0. Non-negotiable constraints

1. **Reuse the portal's existing typography.** Do NOT install a new font
   family, do NOT swap the global `font-family`, and do NOT touch any
   `<link rel="stylesheet">` font tags. Use whatever `--font-sans` /
   `font-family` token the portal already exposes. If a heading font token
   exists (e.g. `--font-display`), use it for `h1`/`h2` only.
2. **Both themes must work.** Ship a dark theme AND a light theme, driven
   by the portal's existing theme switching mechanism (class-based `.dark`
   on `<html>` is the assumption below — adapt to whatever the portal
   uses). Every color must resolve to a semantic token so `.dark` flips
   the whole surface without component-level overrides.
3. **No hardcoded color utilities in components.** No `text-white`,
   `bg-black`, `bg-[#…]`, `text-slate-400`, etc. Only semantic tokens:
   `bg-background`, `text-foreground`, `bg-card`, `border-border`,
   `text-muted-foreground`, `bg-brand`, `text-brand`, `bg-brand-secondary`.
4. **Internal-only page.** Add `<meta name="robots" content="noindex, nofollow">`.
   No marketing hero, no signup, no pricing.

---

## 1. Design tokens (add to the portal's global CSS)

Add these on top of the portal's existing token system. Keep existing
tokens intact; only add what's missing. Values are OKLCH.

```css
:root {
  /* LIGHT — clean, high-contrast */
  --background:        oklch(0.99  0.003 250);
  --foreground:        oklch(0.18  0.02  264);
  --surface-1:         oklch(0.975 0.005 250);
  --surface-2:         oklch(0.945 0.008 250);
  --card:              oklch(1     0     0);
  --card-foreground:   oklch(0.18  0.02  264);
  --muted:             oklch(0.955 0.008 250);
  --muted-foreground:  oklch(0.5   0.02  258);
  --border:            oklch(0.18  0.02  264 / 10%);
  --input:             oklch(0.18  0.02  264 / 14%);
  --ring:              oklch(0.62  0.22  295);

  /* Brand accents (same hues both themes; lightness adjusts per theme) */
  --brand:             oklch(0.62  0.22  295);   /* ~#8B5CF6 violet */
  --brand-foreground:  oklch(0.985 0     0);
  --brand-secondary:   oklch(0.62  0.27  328);   /* ~#D946EF magenta */
  --brand-secondary-foreground: oklch(0.985 0 0);
  --success:           oklch(0.6   0.17  155);
}

.dark {
  --background:        oklch(0.145 0.01  264);
  --foreground:        oklch(0.985 0.005 240);
  --surface-1:         oklch(0.19  0.015 264);
  --surface-2:         oklch(0.235 0.018 264);
  --card:              oklch(0.19  0.015 264);
  --card-foreground:   oklch(0.985 0.005 240);
  --muted:             oklch(0.27  0.02  264);
  --muted-foreground:  oklch(0.68  0.02  258);
  --border:            oklch(1     0     0 / 8%);
  --input:             oklch(1     0     0 / 12%);
  --ring:              oklch(0.68  0.22  295);

  --brand:             oklch(0.68  0.20  295);   /* slightly lifted for dark */
  --brand-secondary:   oklch(0.72  0.25  328);
  --success:           oklch(0.72  0.19  155);
}
```

Semantic shadows (theme-aware — the color-mix follows `--brand`):

```css
--shadow-glow-brand:     0 10px 40px -10px color-mix(in oklab, var(--brand) 45%, transparent);
--shadow-glow-secondary: 0 10px 40px -10px color-mix(in oklab, var(--brand-secondary) 40%, transparent);
```

If the project is Tailwind v4, expose them under `@theme inline` so
utilities like `bg-brand`, `text-brand-secondary`, `border-border`,
`shadow-glow-brand` are generated.

---

## 2. Page layout (V1 — Modern Clean Grid)

Single-column, centered `max-w-7xl`, `p-6 md:p-12`. `bg-background`,
`text-foreground`. Vertical rhythm: **header → filters → Section A →
Section B**.

### 2.1 Page header

- Small pill badge above the title: dot + "INTERNAL ACCESS ONLY", `bg-brand/10`,
  `border-brand/20`, `text-brand`, uppercase 10px, letter-spaced. The dot
  pulses (`animate-pulse`).
- H1 "Call Library" — `text-4xl md:text-5xl font-bold tracking-tight`.
- Subtitle "Internal archive of successful sales calls." —
  `text-muted-foreground text-lg`.
- Right-aligned primary CTA "Add Call Record" — `h-12 px-8`,
  `bg-brand text-brand-foreground`, `rounded-xl`, `font-semibold`,
  `shadow-glow-brand`, opens the Add Call modal (§4.1).

### 2.2 Filter bar

Glassmorphic strip: `bg-surface-1/60 backdrop-blur-xl border border-border
rounded-2xl p-4`, flex-wrap, `gap-4`. Three filter selects + a Clear button.

Each filter is a stacked label + `<select>`:
- **Deal Size** → All sizes | 120 hours | 240 hours | Commission
- **Industry** → All industries | Fintech | Web3 | SaaS
- **Objection Type** → All types | Budget / Price | Timing | Competitor

Select styling: `bg-white/5 dark:bg-white/5 border border-border rounded-lg
px-4 h-9 text-sm focus:border-brand/50`. (In light mode `bg-white/5` reads
as a subtle tint on the surface — acceptable; alternative:
`bg-surface-2`.)

**Clear Filters** button appears only when at least one filter is active.
Ghost style: `h-9 px-4 border border-border text-muted-foreground
hover:text-foreground hover:border-brand/30`.

Filters must actually filter the data below (client-side).

### 2.3 Section header component

```
┌ CLOSED WON DEALS   6 records  ────────────────────────────────
```

- Uppercase title, `text-xl font-bold tracking-tight`.
- Count in tiny mono-uppercase muted text: `6 records`.
- `h-px flex-1` gradient rule to the right:
  - Section A rule: `bg-gradient-to-r from-brand/50 to-transparent`
  - Section B rule + title color: `text-brand-secondary`,
    `from-brand-secondary/50 to-transparent`.

### 2.4 Section A — Closed Won Deals

Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.

**Card** (`bg-card border border-border rounded-2xl overflow-hidden
hover:border-brand/40 hover:-translate-y-0.5 transition-all group`):

1. **Thumbnail** — `aspect-video`, gradient background (see §5), overlay
   `bg-gradient-to-t from-background/60 to-transparent`.
   - Top-left tiny label: "Fathom · Recording" in `text-white/70` (theme-safe
     over the gradient — use `text-primary-foreground/70` if the surface
     already provides one).
   - Top-right pill "WON": `bg-success/15 border border-success/30
     text-success`.
   - Bottom-right circular play button `size-11 rounded-full bg-white/90
     text-background` with ▶ glyph; scales on group-hover.
2. **Body** (`p-6`):
   - Row: avatar circle (initial) + salesperson name + date.
     Avatar: `size-8 rounded-full bg-brand/15 border border-brand/25
     text-brand font-bold`.
   - Title: `font-bold text-lg leading-tight
     group-hover:text-brand transition-colors`.
   - Tag row: `<Tag>Industry</Tag> <Tag>Deal size</Tag>`.
     Tag = `bg-muted border border-border px-2.5 py-1 rounded text-xs
     text-foreground/80`.
   - Action row: flex, `gap-2`.
     - Primary: `<a href={fathomUrl} target="_blank">` styled
       `flex-1 h-10 grid place-items-center bg-muted hover:bg-muted/70
       rounded-lg text-xs font-bold`. Label: **Watch on Fathom**.
     - Secondary: `h-10 px-4 border border-border bg-transparent
       hover:bg-muted/50 rounded-lg text-xs font-bold`. Label:
       **Related**. Opens the Related Calls modal (§4.2).

### 2.5 Section B — Objection Handling

Same grid, **no thumbnail** (denser card, `p-6`).

Top row:
- Left: objection-type pill — `bg-brand-secondary/10 text-brand-secondary
  border border-brand-secondary/20 text-[10px] font-black uppercase
  tracking-widest px-2 py-1 rounded`.
- Right: timestamp pill — `text-xs font-mono text-muted-foreground bg-muted
  px-2 py-1 rounded`, prefixed with the ⏱ glyph, e.g. `⏱ 16:54`.

Body:
- Title: `font-bold text-lg leading-tight
  group-hover:text-brand-secondary transition-colors`.
- Summary paragraph: `text-sm text-muted-foreground line-clamp-3`.
- Avatar + salesperson + "Added {date}" row (same avatar treatment).

Actions (stacked, `space-y-2`):
- Primary: `<a href={fathomUrl + "?t=<seconds>"} target="_blank">` styled
  `w-full h-10 grid place-items-center bg-brand-secondary
  text-brand-secondary-foreground rounded-lg text-xs font-bold
  shadow-glow-secondary hover:opacity-90`. Label: **Watch Specific Moment**.
- Secondary: `w-full h-10 bg-muted hover:bg-muted/70 border border-border
  rounded-lg text-xs font-bold`. Label: **Related Calls**.

Hide industry and deal-size fields on objection cards. Do not repurpose
those columns for anything else.

---

## 3. Data model

```ts
type Industry     = "Fintech" | "Web3" | "SaaS";
type DealSize     = "120 hours" | "240 hours" | "Commission";
type ObjectionType = "Budget / Price" | "Timing" | "Competitor";

interface RelatedAsset {
  kind: "Follow-up" | "Prospecting" | "Discovery" | "Proposal";
  title: string;
  salesperson: string;
  date: string;      // YYYY-MM-DD
  fathomUrl: string;
}

interface ClosedWonCall {
  id: string;
  title: string;
  salesperson: string;
  date: string;
  industry: Industry;
  dealSize: DealSize;
  fathomUrl: string;
  thumbnail: string;         // CSS gradient string, see §5
  related: RelatedAsset[];
}

interface ObjectionCall {
  id: string;
  title: string;
  summary: string;
  salesperson: string;
  date: string;
  objection: ObjectionType;
  timestamp: string;         // "mm:ss"
  fathomUrl: string;          // include ?t=<seconds> deep link
  related: RelatedAsset[];
}
```

Seed 6 Closed Won and 5 Objection records with realistic sales content
(names: Alex, Melina, Marcus, Sarah, Jordan). No lorem ipsum.

Filtering rules:
- Deal Size + Industry apply to Section A only.
- Objection Type applies to Section B only.
- Empty section → dashed empty state card:
  `rounded-2xl border border-dashed border-border p-12 text-center
  text-sm text-muted-foreground`.

---

## 4. Modals (both use the portal's existing Dialog primitive)

### 4.1 Add Call Record

- Title: "Add Call Record". Description: "Archive a Fathom recording for
  the sales team."
- Category segmented control (2 tabs): **Closed Won** | **Objection**.
  Active tab: `bg-brand text-brand-foreground shadow-glow-brand`.
  Inactive: `text-muted-foreground hover:text-foreground`. Rail:
  `bg-surface-2 rounded-xl border border-border p-1`.
- Shared fields: Title, Salesperson, Date, Fathom URL.
- Closed Won extra fields: Industry (select), Deal Size (select).
- Objection extra fields: Objection Type (select), Timestamp `mm:ss`,
  Summary (textarea).
- Footer: Cancel (ghost) + **Save Record** (`bg-brand text-brand-foreground
  shadow-glow-brand`). On submit → toast "Call record added". No backend
  wiring for V1 — just optimistic add to local state.

### 4.2 Related Calls

- Title: "Related Calls". Description: `Assets connected to <parent title>`.
- Empty state (parent has no related): dashed border card, "No related
  assets yet. Add follow-up or prospecting calls to this deal."
- List of assets — each row:
  - Kind pill (`bg-brand/10 text-brand border border-brand/20`).
  - Title + `salesperson • date` (muted).
  - Trailing `Watch ↗` link — opens `fathomUrl` in new tab.

---

## 5. Thumbnails

No stock photos. Each Closed Won card gets a unique 2-stop OKLCH gradient
so the grid feels alive across both themes. Store on the record as
`thumbnail: string` and apply via `style={{ background: thumbnail }}`.
Examples (rotate hue by industry for scannability):

```
Web3    → linear-gradient(135deg, oklch(0.35 0.18 295), oklch(0.25 0.12 328))
Fintech → linear-gradient(135deg, oklch(0.32 0.14 240), oklch(0.28 0.16 210))
SaaS    → linear-gradient(135deg, oklch(0.35 0.15 155), oklch(0.28 0.10 180))
```

The card overlay (`from-background/60`) keeps text legible in both themes
because it follows the theme's background token.

---

## 6. Theme switching

- The portal already has a theme mechanism. Wire the page to it — do NOT
  add a new toggle on this page unless the portal doesn't have one.
- If no global toggle exists: add a small icon-only toggle in the header,
  right of the "Add Call Record" button, that flips `.dark` on
  `document.documentElement` and persists to `localStorage`. Never render
  a divergent value on first paint (avoid hydration mismatch — read the
  stored value inside `useEffect`).
- QA both themes: check contrast on the "Fathom · Recording" thumbnail
  label, the "WON" success pill, and the timestamp mono pill.

---

## 7. Motion & interaction

- Card hover: `hover:-translate-y-0.5 hover:border-brand/40` (or
  `hover:border-brand-secondary/40` for objection cards). 150ms
  transition-all.
- Play-button scale on group-hover: `group-hover:scale-110`.
- Title color shift on group-hover to `text-brand` (Section A) or
  `text-brand-secondary` (Section B).
- Filter pulse dot in the "Internal Access Only" pill.
- No page-load stagger, no marquee, no parallax. This is an internal
  tool — restraint.

---

## 8. Acceptance checklist

- [ ] Uses the portal's existing font. No new `@fontsource` install, no
      new `<link>` to Google Fonts.
- [ ] `.dark` on `<html>` flips the entire page cleanly (background,
      cards, borders, tags, modal, buttons, gradients-overlays remain
      legible).
- [ ] Every color in every component resolves to a semantic token — grep
      the diff for `text-white`, `bg-black`, `bg-slate-`, `bg-zinc-`,
      `bg-[#`, `text-[#` and remove all matches.
- [ ] Header, filter bar (3 selects + Clear), Section A, Section B all
      render as described.
- [ ] Filters actually filter; Clear resets and hides itself.
- [ ] Objection cards do NOT show industry or deal size and DO show
      objection type + `⏱ mm:ss`.
- [ ] "Add Call Record" opens the modal, category tabs swap the field
      set, submit toasts and closes.
- [ ] "Related" / "Related Calls" opens the modal and lists assets or
      shows the empty state.
- [ ] Fathom links open in a new tab with `rel="noreferrer"`.
- [ ] `<meta name="robots" content="noindex, nofollow">` on the route.
- [ ] Page passes typecheck and build.
