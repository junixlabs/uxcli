# The design catalog

Seven axes describe a screen. Write a brief as a formula, one or more codes per axis joined by `+`: `A07 + B-W1, B-W2, B-W4, B-W7 + C1 + D02 + E-Ant + F1 + G1`. `uxcli designer propose "<formula>"` checks it and proposes a kit. Libraries checked on 2026-10-14.

## A — Product type

One primary type, at most two secondary. Sorted by what the person comes to do, not by industry.

| Code | Type | What the person comes to do | Layout groups | Default layout |
|---|---|---|---|---|
| A01 | Company or service site | Trust the organisation and get in touch | M, T | B-M2 |
| A02 | Landing page | Do one thing: sign up, buy, download | M | B-M1 |
| A03 | Online shop | Find, compare and buy | S, T | B-S1 |
| A04 | Marketplace | Find a seller or a service and transact, with two sides | S, T | B-S4 |
| A05 | Content, news or blog | Read | C | B-C1 |
| A06 | Docs, help or wiki | Look something up and follow it | C | B-C3 |
| A07 | Operations workspace (CRM, ERP, HRM, admin) | Work through existing records every day | W, D | B-W1 |
| A08 | SaaS tool or editor | Make something new on a canvas or in a document | W | B-W9 |
| A09 | Reporting, BI or dashboard | Understand numbers to decide | D | B-D1 |
| A10 | Self-service portal | See and do one's own things | W, T | B-W4 |
| A11 | Transaction or booking flow | Finish a multi-step process | T | B-T2 |
| A12 | Community or social | Post, read, react | C | B-C5 |
| A13 | Learning | Learn along a path | C, T | B-C7 |
| A14 | Media or streaming | Watch, listen | C | B-C8 |
| A15 | Chat or AI assistant | Ask and hand over work in words | X | B-X1 |

## B — Layout variant

One variant per screen; one to three per type.

### M — Marketing

- **B-M1 Hero, features, call to action.** The default when the product is easy to grasp. Regions: site-header → hero → logo-strip → feature-grid → call-to-action → site-footer.
- **B-M2 Hero with social proof.** When trust matters more than explanation. Regions: site-header → hero → logo-strip → testimonial → feature-grid → call-to-action.
- **B-M3 Demo or video first.** When the product has to be seen to be understood. Regions: site-header → media-player → feature-grid → call-to-action.
- **B-M4 Single minimal column.** One message, one action. Regions: site-header → hero → article → call-to-action.
- **B-M5 Long sales page.** High price, long decision. Regions: site-header → hero → story → testimonial → pricing → faq → call-to-action.
- **B-M6 Pricing and plan comparison.** SaaS and subscription services. Regions: site-header → hero → pricing → comparison-table → faq.
- **B-M7 Lead magnet with form.** Collecting B2B leads. Regions: site-header → hero → form → logo-strip → feature-grid.
- **B-M8 Waitlist or coming soon.** No product yet. Regions: hero → form.
- **B-M9 Scroll storytelling.** Brand launches. Costly and easily slow. Regions: site-header → hero → story → call-to-action.
- **B-M10 Event or webinar.** A date, speakers and an agenda. Regions: site-header → hero → timeline → feature-grid → call-to-action.

### S — Commerce

- **B-S1 Category grid with side filters.** Many items bought by attribute. Regions: site-header → page-header → facet-filters → product-grid → pagination.
- **B-S2 Product page as the home page.** Direct-to-consumer, one to ten products. Regions: site-header → product-gallery → buy-box → feature-grid → testimonial.
- **B-S3 Editorial commerce or lookbook.** Fashion and premium goods. Regions: site-header → hero → product-grid.
- **B-S4 Search first.** Marketplaces, parts, long catalogues. Regions: site-header → search → filter-bar → result-list.
- **B-S5 Map with list.** Location-based services, property. Regions: site-header → result-list → map.
- **B-S6 Product configurator.** Made-to-order goods. Regions: site-header → product-gallery → option-picker → buy-box.
- **B-S7 Subscription box.** Recurring purchase. Regions: site-header → hero → pricing → feature-grid.

### C — Content

- **B-C1 Magazine front page.** News and magazines. Regions: site-header → lead-story → story-list → card-grid.
- **B-C2 Long single column.** Blogs and analysis. Regions: site-header → article.
- **B-C3 Three-column docs.** Technical documentation. Regions: site-header → toc-nav → article → on-this-page.
- **B-C4 Help centre.** Search plus topics. Regions: site-header → search → card-grid.
- **B-C5 Feed.** Social networks and communities. Regions: app-shell → composer → feed → side-panel.
- **B-C6 Thread or forum.** Discussion by topic. Regions: site-header → thread.
- **B-C7 Lesson path.** Courses and LMS. Regions: app-shell → media-player → progress → lesson-list.
- **B-C8 Media grid with player.** Video, podcasts, music. Regions: app-shell → media-player → card-grid.

### W — Workspace

- **B-W1 Sidebar and table.** The default admin screen. Regions: app-shell → page-header → kpi-inline → filter-bar → data-table → bulk-bar → pagination.
- **B-W2 List-detail.** Working through many records one after another without losing one's place. Regions: app-shell → record-list → detail-header → detail-panel → timeline.
- **B-W3 Table to detail page.** Records with much information, rarely handled in a row. Regions: app-shell → page-header → filter-bar → data-table → pagination.
- **B-W4 Record 360.** Customers, staff, partners. Regions: app-shell → detail-header → tabs → detail-panel → timeline.
- **B-W5 Kanban.** Records whose status changes often. Regions: app-shell → page-header → kanban.
- **B-W6 Calendar, timeline or Gantt.** Appointments, shifts, projects. Regions: app-shell → page-header → calendar.
- **B-W7 Inbox or queue.** Tickets, things to handle, approvals. Regions: app-shell → record-list → detail-header → notice → bulk-bar.
- **B-W8 Multi-step form or wizard.** Creating a complex record. Regions: app-shell → stepper → form.
- **B-W9 Canvas or editor.** Design, diagrams, documents. Regions: toolbar → layer-list → canvas → inspector.
- **B-W10 Settings.** Sub-navigation with forms. Regions: app-shell → settings-nav → form.
- **B-W11 Tree or org chart.** Hierarchy, teams, permissions. Regions: app-shell → page-header → tree.
- **B-W12 Command palette.** People who live on the keyboard. Regions: app-shell → record-list → command-palette.

### D — Data

- **B-D1 Executive dashboard.** Leadership: few numbers, against last period and target. Regions: app-shell → page-header → kpi → chart.
- **B-D2 Operational dashboard.** People on shift: near real time, alerts, thresholds. Regions: app-shell → page-header → kpi → chart → alert-list.
- **B-D3 Analytical dashboard.** Analysts: filter, drill down, compare. Regions: app-shell → page-header → filter-bar → chart → data-table.
- **B-D4 Tactical dashboard.** Team leads: progress against target by team. Regions: app-shell → page-header → progress.
- **B-D5 Report as a document.** Read top to bottom, printed or exported. Regions: site-header → article → kpi → chart → data-table.
- **B-D6 Funnel or conversion flow.** Marketing and sales. Regions: app-shell → page-header → funnel → kpi.
- **B-D7 Map or geography.** Operations by region. Regions: app-shell → page-header → map → result-list.
- **B-D8 Dense number table (pivot).** Accounting and finance. Regions: app-shell → page-header → data-table.

### T — Transaction

- **B-T1 One-page checkout.** Few fields. Regions: site-header → form → order-summary.
- **B-T2 Steps with progress.** Many fields; people may stop halfway. Regions: site-header → stepper → form.
- **B-T3 One question per page.** The general public and hard forms (GOV.UK style). Regions: site-header → question.
- **B-T4 Date and time slots.** Appointments, tables, courts. Regions: site-header → date-strip → slot-grid → order-summary.
- **B-T5 Conversational form.** Gathering soft information. Regions: site-header → chat.

### X — AI

- **B-X1 Chat with a context panel.** A standalone assistant. Regions: app-shell → chat → side-panel.
- **B-X2 AI inside the work screen.** A suggestion panel beside the data. Regions: app-shell → page-header → data-table → assistant-panel.
- **B-X3 Prompt first.** A page that starts with a question. Regions: prompt → card-grid.

## C — Density

Chosen for the people who use it, not for looks.

- **C1 Compact.** Experienced people on large screens all day. Rows 36px, controls 32px, body 13px, type scale 12/13/15/18/24, spacing unit 4px.
- **C2 Comfortable.** The default for web applications. Rows 48px, controls 40px, body 14px, type scale 12/14/16/20/28, spacing unit 8px.
- **C3 Spacious.** Marketing, reading and touch. Rows 60px, controls 48px, body 16px, type scale 13/16/18/24/36, spacing unit 8px.

## D — Visual style

One base style and at most one accent style.

- **D01 Minimal / Swiss.** Grid, white space, type leads, black and white with one accent kept for meaning. Modes: light, dark. Fits Any type.
- **D02 Enterprise clean.** Neutral ground, one brand colour, thin rules, clear tables. Modes: light, dark. Fits A07, A09, A10.
- **D03 Flat / Material.** Flat surfaces, elevation shadows, colour blocks. Modes: light, dark. Fits A07, A08, apps.
- **D04 Soft depth (neumorphism, clay).** Soft shadows lifting elements out of a same-colour ground. Modes: light, dark. Fits Accents, personal apps. Avoid for A07, A09, A11.
- **D05 Glass (glassmorphism, Liquid Glass) (accent).** Translucent layers over a blurred ground. Modes: dark. Fits Overlays, navigation, A02. Avoid for A07, A09.
- **D06 Bento grid (accent).** Rectangles of many sizes in one grid, large radius. Modes: light, dark. Fits A02 feature sections, executive dashboards.
- **D07 Brutalism / neubrutalism.** Thick black borders, hard shadows, loud colour, monospace. Modes: light, dark. Fits A02 for creators and startups, portfolios. Avoid for A07, A09, A10, A11.
- **D08 Editorial / magazine.** Large serif type, a newspaper grid, big pictures, hairlines. Modes: light, dark. Fits A05, premium A03, A01. Avoid for A07.
- **D09 Dark / OLED.** A dark ground leads, with a bright accent. Modes: dark. Fits Developer tools, media, control rooms. Avoid for A05.
- **D10 Vibrant colour blocks.** Saturated colour, big blocks, heavy type. Modes: light, dark. Fits A02, young communities, consumer apps. Avoid for A07, A10.
- **D11 Playful / illustrated.** Illustration, large radius, warm colour. Modes: light, dark. Fits Learning, children, empty states. Avoid for A09.
- **D12 Luxury / premium.** Much white space, thin serif, deep tones, gold. Modes: light, dark. Fits Premium A03, hotels, property. Avoid for A07.
- **D13 Organic / biophilic.** Earth colours, curves, natural material. Modes: light, dark. Fits Wellness, spas, agriculture. Avoid for A09.
- **D14 Retro (Y2K, Memphis).** Nostalgia, patterns, candy colours. Modes: light, dark. Fits Young brands, events. Avoid for A07, A09, A10, A11.
- **D15 Futuristic / HUD.** Neon, grids, glow, monospace. Modes: dark. Fits Games, web3, AI launches. Avoid for A07, A10, A11.
- **D16 3D / motion (accent).** 3D models, depth, scroll motion. Modes: dark. Fits Physical product launches. Avoid for A07, A09, A10, A11.
- **D17 AI-native.** The input is the centre; generated content; suggestions in context. Modes: light, dark. Fits Assistants, AI features inside A07 and A08.
- **D18 Accessible-first (GOV.UK).** Large type, high contrast, one column, no decoration. Modes: light, dark. Fits A10, A11, public services, healthcare for the public.

## E — Reference design system

Where components and rules come from; never copied as a look.

- **E-Ant Ant Design.** Dense admin, a complete component set, compact mode built in. Library: `antd`.
- **E-shadcn shadcn/ui on Base UI.** Fast start, the code is copied into the project and owned there. Library: `shadcn`.
- **E-Material Material (MUI).** Apps and mobile, Material look, data grid with density. Library: `mui`.
- **E-Mantine Mantine.** Neutral look themed from JSON, many hooks and components. Library: `mantine`.
- **E-Carbon IBM Carbon.** Dense data, tables, accessibility. Reference only in this version: @carbon/react is current but themed through Sass; not adapted yet.
- **E-Fluent Microsoft Fluent 2.** Productivity, consistency across platforms. Reference only in this version: the theme needs a 16-shade brand ramp; not adapted yet.
- **E-Atlassian Atlassian.** Complex forms, progressive disclosure. Reference only: the icons and logos are licensed for products that integrate with Atlassian.
- **E-Polaris Shopify Polaris.** Commerce admin, content guidelines. Reference only: @shopify/polaris (React) is deprecated outside Shopify admin apps.
- **E-HIG Apple Human Interface Guidelines.** Apple apps, Liquid Glass. Reference only: Apple ships no web component library.
- **E-GOVUK GOV.UK Design System.** Forms, public services, plain content. Reference only: govuk-frontend is not React and its palette and brand are fixed for government services.

## F — Brand personality

One or two.

- **F1 Trustworthy / professional.** Deep colours, little effect, sans-serif.
- **F2 Friendly / warm.** Rounded corners, warm colours, plain close wording.
- **F3 Premium.** White space, serif, few colours.
- **F4 Energetic / young.** Strong colour, motion, short words.
- **F5 Technical / precise.** Monospace, numbers, a tight grid.
- **F6 Playful.** Illustration, mascots, micro-interactions.

## G — Platform priority

One.

- **G1 Desktop first.** Still responsive. A07, A08, A09.
- **G2 Mobile first.** A02, A03, A05, A10, A11.
- **G3 Both equally.** A01, A12.
- **G4 App or PWA.** Used daily on a phone.
- **G5 Special screen.** Kiosk, TV, control-room wall.

## Presets

- **P1 Internal CRM / HRM.** Dense tables, list-detail, record 360, queues; enterprise clean. `A07 + B-W1, B-W2, B-W4, B-W7 + C1 + D02 + E-Ant + F1 + G1`
- **P2 Executive BI.** Executive numbers, analysis, funnel; bento for the overview. `A09 + B-D1, B-D3, B-D6 + C2 + D02, D06 + E-Ant + F1 + G1`
- **P3 Control room.** Wall screen, dark ground, alerts by threshold. `A09 + B-D2 + C1 + D09 + F5 + G5`
- **P4 SaaS tool.** Canvas, command palette, settings; with its landing and docs. `A08, A02, A06 + B-W9, B-W12, B-W10, B-M3, B-M6, B-C3 + C2 + D01 + E-shadcn + F5 + G1`
- **P5 B2B landing.** Minimal, social proof, pricing. `A02 + B-M1, B-M2, B-M6 + C3 + D01, D06 + F1 + G2`
- **P6 Consumer product launch.** Demo first, scroll storytelling, vibrant colour, motion. `A02 + B-M3, B-M9 + C3 + D10, D16 + F4 + G2`
- **P7 Everyday shop.** Category grid, search, one-page checkout. `A03 + B-S1, B-S4, B-T1 + C2 + D03 + F2 + G2`
- **P8 Premium shop.** Lookbook, product page, luxury. `A03 + B-S3, B-S2 + C3 + D12 + F3 + G2`
- **P9 Local service site.** Clinics, salons, restaurants: trust, then book. `A01, A11 + B-M2, B-T4 + C3 + D01 + F1, F2 + G2`
- **P10 Self-service portal.** My records, my tasks, one question per page; accessible-first. `A10, A11 + B-W4, B-W7, B-T2, B-T3 + C2 + D18 + F1 + G2`
- **P11 Docs and help.** Three-column docs and a help centre. `A06 + B-C3, B-C4 + C2 + D01 + F5 + G3`
- **P12 AI inside the product.** An AI panel in the work screen and a chat with context. `A15, A07 + B-X2, B-X1 + C2 + D17 + F5 + G1`

## Combinations the catalog warns about

- C3 with A07, A09: Spacious density loses rows on every screen; work screens used all day usually take C1 or C2.
- C1 with A01, A02, A05: Compact density rarely suits marketing or reading pages.
- G2 with A07, A08, A09: Mobile first rarely suits desktop work screens; consider G1, still responsive.
- A style is warned against for the types in its "avoid for"; an accent style is not a base; a layout outside the type's groups is unusual.

## Rules that hold in every style

Evidence: standard (WCAG), study (peer-reviewed), system (published design systems agree), designer (named practitioners), trend.

### Colour

- **colour-roles** (system). Colour has fixed roles: a neutral ground, one action colour and four status colours (critical, warning, success, info). No colour outside a role. *Check:* List the tokens; count colours used outside them — zero. Sources: [Shopify Polaris — colour roles](https://polaris.shopify.com/design/colors/palettes-and-roles); [IBM Carbon — colour](https://carbondesignsystem.com/elements/color/overview/); [USWDS — theme tokens](https://designsystem.digital.gov/design-tokens/color/theme-tokens/).
- **one-meaning** (study). One colour, one meaning across the product; the action colour is not a status colour. *Check:* Compare the colour-to-meaning table between screens. Sources: [Shopify Polaris — colour roles](https://polaris.shopify.com/design/colors/palettes-and-roles); [IBM Carbon — colour](https://carbondesignsystem.com/elements/color/overview/); [Stroop and reverse Stroop on an interactive tabletop](https://hal.archives-ouvertes.fr/hal-01370664).
- **quiet-normal** (study). The normal state is quiet; only what needs attention carries colour. *Check:* The share of rows with a warm status chip on one screen stays low. Sources: [Treisman, preattentive processing (eagereyes summary)](https://eagereyes.org/blog/2015/treisman-preattentive-processing); [Healey, preattentive features (TVCG)](https://www.csc2.ncsu.edu/faculty/healey/download/tvcg.11.pdf).
- **few-codes** (study). At most five to seven status colours per entity, and about four new colour codes to learn per screen. *Check:* Count them. Sources: [Munzner after Ware — distinguishable colours](https://www.cs.ubc.ca/~tmm/courses/533-09/slides/color.pdf); [Cowan 2001 — the magical number 4](https://memory.psych.missouri.edu/assets/doc/articles/2001/cowan-bbs-2001.pdf).
- **never-colour-alone** (standard). Colour is never the only signal: a short word or an icon always goes with it. *Check:* In greyscale every state is still told apart. Sources: [WCAG 2.2 — 1.4.1 Use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- **contrast** (standard). Text 4.5:1, large text and component parts 3:1, in light and dark. *Check:* Measure automatically. Sources: [WCAG 2.2 — 1.4.3 Contrast (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [WCAG 2.2 — 1.4.11 Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

#### Building the palette

1. Tokens come in three tiers: primitive scales (action-9), semantic roles (action, critical, text-muted), and the library's own keys. Components use roles, never scale steps or hex.
2. Every colour family is a 12-step scale in OKLCH, where equal steps of lightness look equal; HSL lightness does not (yellow at 50% is far brighter than blue at 50%).
3. Steps 1–8 follow a fixed lightness ladder per mode; step 9 is the seed; step 10 its hover; steps 11 and 12 are solved for contrast on step 2, so text on the scale passes by construction, not by luck.
4. The neutral scale comes first and carries a trace of the style's hue (chroma at most neutralChroma). One action family; four status families with conventional hues.
5. Interaction states are neighbouring steps, never new colours: hover = step 10 or a neutral step 3, pressed = 0.08 lightness further from the ground, selected = action step 4, disabled = neutral 3 and 8, focus ring = the action colour where it reaches 3:1, otherwise solved to 3:1.
6. Each mode is its own mapping, not an inversion: dark grounds are not pure black, raised surfaces get lighter, and every pair is checked again in that mode.
7. Status colours are checked under simulated protanopia, deuteranopia and tritanopia, and the action colour against every status colour; a close pair is a warning that the word or icon carries the meaning (never-colour-alone, one-meaning).
8. Chart colours are a separate palette: categorical hues spaced evenly at one lightness, each 3:1 on the surface; sequential = one hue in lightness steps; diverging = two hues through a neutral middle.

| Step | Use |
|---|---|
| 1 | App background |
| 2 | Subtle background: page bands, striped rows |
| 3 | Element background: chips, inputs, hover of a neutral row |
| 4 | Hovered element; selected background (action) |
| 5 | Active or pressed element background |
| 6 | Subtle border, divider |
| 7 | Border of a component that is not interactive |
| 8 | Strong border; disabled text |
| 9 | Solid: the seed colour — buttons, badges, chart marks |
| 10 | Hovered solid |
| 11 | Low-contrast text on the scale (5:1 or more) |
| 12 | High-contrast text on the scale (11:1 or more) |

Status seeds: critical `#d92d20`, warning `#f79009`, success `#17b26a`, info `#1570ef`. Neutral chroma at most 0.02. Colour-blind check: pairs closer than 0.06 in OKLab are warned (uxcli's threshold for a glanceable difference in OKLab distance; not a standard). Chart: 8 categorical hues; sequential steps 3, 5, 7, 9, 11. `uxcli designer propose` builds all of it for a style, in each of its modes, and checks it.

Lens viewpoints on colour (`lenses/<kind>.md`): `color.never-the-only-signal`, `color.status-colours-keep-their-meaning`, `color.from-tokens-not-hex`, `color.few-families-in-proportion`, `color.one-action-colour-apart-from-status`, `color.controls-and-graphics-3-to-1`, `color.focus-ring-contrasts-with-its-surroundings`, `color.mode-aware-tokens-in-every-theme`, `color.chart-palette-fits-the-data`, `color.chart-marks-readable-without-hue`.

Sources: [Björn Ottosson — A perceptual color space for image processing (OKLab)](https://bottosson.github.io/posts/oklab/); [Radix Colors — understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale); [Material 3 — how the color system works (HCT tones)](https://m3.material.io/styles/color/system/how-the-system-works); [USWDS — color tokens and the magic number](https://designsystem.digital.gov/design-tokens/color/overview/); [Refactoring UI — you need more colours than you think](https://www.refactoringui.com/previews/building-your-color-palette); [Machado, Oliveira, Fernandes 2009 — physiologically-based simulation of colour vision deficiency](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html); [IBM Carbon — data visualization colour palettes](https://carbondesignsystem.com/data-visualization/color-palettes/); [CSS Color 4 — gamut mapping](https://www.w3.org/TR/css-color-4/#gamut-mapping).

### Type and space

- **scales** (designer). About four type sizes on one scale and spacing from one scale; space between groups is clearly larger than space within them. *Check:* Count the distinct values in the CSS. Sources: [Bringhurst — compose with a scale](http://webtypography.net/3.1.1); [NN/g — Gestalt proximity](https://www.nngroup.com/articles/gestalt-proximity/).
- **space-lines-boxes** (designer). Separate with space first, a line second, a box last; no box inside a box. *Check:* Count nested boxed layers. Sources: [Refactoring UI (Wathan, Schoger)](https://www.refactoringui.com/); [NN/g — common region](https://www.nngroup.com/articles/common-region/).

### Hierarchy

- **one-primary** (designer). One dominant element and one primary button per screen. *Check:* Squint test; count primary buttons. Sources: [Erik Kennedy — 7 rules for gorgeous UI](https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html).
- **first-screen** (study). The most important thing is on the first screen; long pages have headings that read alone; no scroll box inside a scrolling page. *Check:* Position of the main element against 100vh; count nested scroll areas. Sources: [NN/g — Scrolling and attention (2018)](https://www.nngroup.com/articles/scrolling-and-attention/); [NN/g — F-shaped pattern (2017)](https://nngroup.com/articles/f-shaped-pattern-reading-web-content/).

### Data

- **table-card-list** (system). Compare in a table, browse independent items with pictures in cards, read in order in a list. *Check:* Check against what the person does on the screen. Sources: [NN/g — Data tables: four major user tasks](https://nngroup.com/articles/data-tables); [Queensland Design System — card](https://www.designsystem.qld.gov.au/components/card/tabs/overview).
- **table-basics** (system). Tables: numbers right-aligned in tabular figures, text left, one unit per column, sort state visible, sticky header, empty and loading states. *Check:* Check column by column. Sources: [GitHub Primer — data table](https://primer.style/product/components/data-table/); [W3C WAI — table tips](https://www.w3.org/WAI/tutorials/tables/tips/); [USWDS — table](https://designsystem.digital.gov/components/table/).


## Checks before done

Drawn from a real CRM review. Kind: bug, contract (front end and back end disagree), a11y, usability, drift, debt. Severity: S1–S4 for bugs, N0–N4 (Nielsen) for usability.

- **bulk-visible-only** (bug, S1; B-W1, B-W3, B-D3, B-D8, B-X2, B-W7). Bulk actions touch only the rows the filter shows; filtering cuts the selection in the same render.
- **bulk-server-allowed** (contract, S2; B-W1, B-W3, B-D3, B-D8, B-X2, B-W7). Bulk sends only rows the server marked as allowed, and says beforehand how many are skipped and why.
- **selection-across-pages** (usability, N3; B-W1, B-W3, B-D3, B-D8, B-X2, B-W7). With pagination, the selection bar says which page the selection is on and offers "select all N".
- **no-nested-scroll** (usability, N2; B-W1, B-W3, B-D3, B-D8, B-X2, B-W7). The table is not its own scroll box inside a scrolling page; the header sticks, the pager sticks.
- **sort-visible** (usability, N2; B-W1, B-W3, B-D3, B-D8, B-X2, B-W7). Sort arrows are always visible, faintly, not only on hover.
- **drop-flat-columns** (usability, N1; B-W1, B-W3, B-D3, B-D8, B-X2, B-W7). A column holding one value in 80% or more of rows is dropped or merged; no "Open" button column when the name is a link.
- **tier-one-on-top** (usability, N3; B-W2, B-W4, B-W7). Identity, status, next action and what is overdue sit on top; standing explanatory paragraphs go behind a "?".
- **alert-with-fix** (usability, N3; B-W2, B-W4, B-W7, B-D2). Every alert carries the way to fix it right there.
- **no-dead-links** (usability, N3; B-W1, B-W2, B-W4, B-W7). No link leads to a refusal (403) or nothing (404); say why in words instead.
- **default-view-has-data** (usability, N2; B-W6, B-W7, B-T4). A screen does not open on an empty view while the view beside it has data.
- **refusals-in-words** (contract, S2; A07, A10, A11). A refusal shows a sentence from one shared table of reason codes, never a raw code or the backend's English.
- **read-the-backend** (contract, S2; A07, A10). Field names of errors and allowlists are read from the backend code, not guessed; "" clears a field, it is not "do not send".
- **why-on-rule-errors** (usability, N2; A07, A10, A11). An error caused by a business rule links to "Why?" explained in place; an input error does not.
- **no-typed-codes** (usability, N3; A07). Nobody types a reason code; offer sentences with the code behind them; a choice list over ten items has search.
- **dialog-cancel** (usability, N2; B-W1, B-W2, B-W4, B-W7, B-W8, B-W10). Long create or edit forms open in a dialog or a page, never inline pushing the page down; a writing dialog ends with "Cancel", a reading one with "Close".
- **open-every-layer** (bug, S1; A07, A08, A09, A10, A11, A15). Open every overlay (select, popover, dialog) and confirm it has content; reading text on the page is not enough.
- **layer-order** (bug, S2; A07, A08, A09, A10, A11, A15). A select or popover opened in a dialog sits above the dialog's backdrop; every floating layer has its own z-index.
- **no-money-in-funnel** (bug, S2; B-D6). Money is not a step of a funnel; counted steps go in the funnel, money is a result line beneath.
- **empty-has-meanings** (usability, N3; A09). An empty cell has distinct meanings — hidden for privacy, capped, never measured — and each says so.
- **no-duplicate-kpis** (usability, N1; B-D1, B-D6). No row of KPI cards repeating the numbers the chart right below already draws.
- **wait-for-main-source** (bug, S2; A09). Numbers are drawn only once the main source has answered; never "0 …" while waiting.
- **tokens-in-dark** (a11y, S2; every screen). Text and ground colours go through tokens; open dark mode and measure contrast.
- **no-sideways-scroll** (a11y, S2; every screen). No horizontal scroll at 390px; header button rows may wrap. Check 1920, 1280, 860 and 390.
- **no-button-in-button** (a11y, S2; every screen). No button inside a button; a long screen-reader name goes in aria-label, not in visible text.
- **one-word-one-meaning** (usability, N2; every screen). One word, one meaning per screen; buttons with one role share one label; one way of saying "empty".
- **component-at-second-use** (debt, -; every screen). Sizes, weights and colours come from tokens; markup used on a second screen becomes a component.
- **count-boxes** (usability, N1; every screen). Count boxed nesting before showing a page: space first, lines next, boxes last.
- **measure-not-eyeball** (drift, N2; every screen). When a prototype exists, compare the build by measurement, not by eye.
- **translucent-contrast** (a11y, S2; D04, D05, D16). Translucent or soft-shadow styles: measure text contrast on every layer, and states must show without colour.
- **motion-limits** (a11y, N2; B-M9, D05, D16). Motion under 200–300 ms, transform and opacity only, honour prefers-reduced-motion.

## Libraries

### `antd` — Ant Design 6

Packages: antd@6.6.6, @ant-design/icons@6.3.4. Extras: @ant-design/charts@2.6.7 (chart), @dnd-kit/core@6.3.1 (kanban). ConfigProvider theme={{ token, algorithm }}; v6 writes CSS variables. Dark mode: algorithm: [theme.darkAlgorithm] (with theme.compactAlgorithm for C1) and the dark tokens in a second ConfigProvider theme.

- The four status colours map one to one onto antd's semantic tokens.

### `shadcn` — shadcn/ui on Base UI, with TanStack Table

Packages: shadcn@4.21.4, @base-ui/react@1.9.0, tailwindcss@4.3.3, @tanstack/react-table@9.3.1, lucide-react@1.57.0. Extras: recharts@3.10.1 (chart), sonner@2.0.8 (toast), @dnd-kit/core@6.3.1 (kanban). CSS variables mapped through Tailwind v4 @theme; components are edited in place. Dark mode: the same variables again inside .dark { … }; toggle the class on <html>.

- shadcn ships neutral, primary and destructive only: add --warning, --success and --info and a Badge variant for each.
- Run the init with Base UI primitives (--base base-ui).

### `mui` — MUI 9 (Material)

Packages: @mui/material@9.5.0, @mui/icons-material@9.5.0, @mui/x-data-grid@9.15.0. Extras: @mui/x-charts@9.15.0 (chart), @mui/x-date-pickers@9.15.0 (dates), @dnd-kit/core@6.3.1 (kanban). createTheme({ cssVariables: true, palette, shape, typography }). Dark mode: createTheme({ cssVariables: true, colorSchemes: { light: { palette }, dark: { palette } } }).

- The four status colours map one to one onto palette.error, warning, success and info.

### `mantine` — Mantine 9

Packages: @mantine/core@9.7.2, @tabler/icons-react@3.49.0, mantine-datatable@9.4.0. Extras: @mantine/charts@9.7.2 (chart), @mantine/dates@9.7.2 (dates), @dnd-kit/core@6.3.1 (kanban). createTheme({ primaryColor, colors, defaultRadius, fontFamily, fontSizes }); writes --mantine-* variables. Dark mode: defaultColorScheme="auto"; light and dark values through cssVariablesResolver; primaryColor gets the 10-shade tuple below.

- Mantine has no semantic status roles: assign the four status colours to colour families and use them by name everywhere.
- colors.brand is the light action scale's steps 1–5, 7 and 9–12: shade 6 is the seed in both schemes; the other roles go in through cssVariablesResolver per scheme.

By product type, when E names no library: `antd` for A07, A09, A10; `shadcn` for A01, A02, A03, A04, A05, A06, A08, A11, A12, A13, A14, A15; `mui` for none; `mantine` for none.

## Regions and the component each library offers

| Region | antd | shadcn | mui | mantine |
|---|---|---|---|---|
| app-shell | Layout, Layout.Sider, Menu | Sidebar (block) | Drawer, AppBar, List | AppShell, NavLink |
| site-header | Layout.Header, Menu (horizontal) | NavigationMenu | AppBar, Toolbar | Group, Anchor, Burger |
| site-footer | Layout.Footer | footer markup | Box, Link | Group, Anchor |
| page-header | Flex, Typography.Title, Button type="primary" | heading markup, Button | Stack, Typography, Button variant="contained" | Group, Title, Button |
| filter-bar | Input.Search, Select, Segmented | Input, Select, ToggleGroup | TextField, Select, ToggleButtonGroup | TextInput, Select, SegmentedControl |
| facet-filters | Checkbox.Group, Slider, Collapse | Checkbox, Slider, Accordion | Checkbox, Slider, Accordion | Checkbox.Group, RangeSlider, Accordion |
| data-table | Table (rowSelection, sticky, sorter) | Table + @tanstack/react-table | DataGrid (@mui/x-data-grid) | DataTable (mantine-datatable) |
| record-list | List, List.Item | ScrollArea, Item | List, ListItemButton | ScrollArea, NavLink |
| result-list | List | Item list markup | List, Card | Stack, Card |
| pagination | Pagination | Pagination | Pagination | Pagination |
| bulk-bar | Flex, Button, Typography.Text | Button group markup | Toolbar, Button | Group, Button |
| kpi | Statistic, Card | Card | Card, Typography | Paper, Text |
| kpi-inline | Statistic (small), Space | inline markup | Stack direction="row", Typography | Group, Text |
| status | Tag with color and icon | Badge with a lucide icon | Chip with color and icon | Badge with leftSection |
| detail-header | Flex, Avatar, Typography.Title, Tag, Button | Avatar, heading markup, Badge, Button | Avatar, Typography, Chip, Button | Avatar, Title, Badge, Button |
| detail-panel | Descriptions | description list markup (dl) | Grid, Typography | SimpleGrid, Text |
| tabs | Tabs | Tabs | Tabs | Tabs |
| timeline | Timeline | list markup | List | Timeline |
| form | Form, Form.Item | Field, Input, Select, Textarea | TextField, FormControl | TextInput, Select (+ @mantine/form) |
| stepper | Steps | Progress with step markup | Stepper | Stepper |
| question | Radio.Group, Button | RadioGroup, Button | RadioGroup, Button | Radio.Group, Button |
| dialog | Modal | Dialog, AlertDialog | Dialog | Modal |
| notice | Alert | Alert | Alert | Alert |
| alert-list | List with Tag | Item list with Badge | List with Chip | Stack with Badge |
| empty-state | Empty, Result | Empty | Box, Typography, Button | Stack, Text, Button |
| kanban | Card + @dnd-kit/core | Card + @dnd-kit/core | Card + @dnd-kit/core | Card + @dnd-kit/core |
| calendar | Calendar | Calendar (date picking only) | DateCalendar (@mui/x-date-pickers, picking only) | Calendar (@mantine/dates) |
| date-strip | Segmented, DatePicker | Calendar, ToggleGroup | DatePicker (@mui/x-date-pickers) | DatePicker (@mantine/dates) |
| slot-grid | Radio.Group optionType="button" | ToggleGroup | ToggleButtonGroup | Chip.Group |
| chart | @ant-design/charts | Chart (recharts) | @mui/x-charts | @mantine/charts |
| funnel | @ant-design/charts (Funnel) | Chart (recharts BarChart) | @mui/x-charts (BarChart) | @mantine/charts (FunnelChart) |
| progress | Progress | Progress | LinearProgress | Progress |
| tree | Tree | — | — | Tree |
| command-palette | — | Command | — | — |
| search | Input.Search, AutoComplete | Command, Combobox | Autocomplete | Autocomplete |
| toc-nav | Menu, Anchor | Sidebar | List | NavLink, TableOfContents |
| settings-nav | Menu | Sidebar | List | NavLink |
| on-this-page | Anchor | link list markup | List | TableOfContents |
| article | Typography | prose markup | Typography | TypographyStylesProvider |
| card-grid | Card, Row, Col | Card, CSS grid | Card, Grid | Card, SimpleGrid |
| product-grid | Card, Row, Col | Card, CSS grid | Card, Grid | Card, SimpleGrid |
| product-gallery | Image, Image.PreviewGroup | Carousel | ImageList | Image, Carousel (@mantine/carousel) |
| buy-box | Typography, Radio.Group, Button | ToggleGroup, Button | ToggleButtonGroup, Button | Chip.Group, Button |
| option-picker | Radio.Group, ColorPicker | ToggleGroup | ToggleButtonGroup | Chip.Group, ColorSwatch |
| order-summary | Card, Descriptions | Card | Card, List | Card, Table |
| comparison-table | Table | Table | Table | Table |
| pricing | Card, Row, Col | Card | Card, Grid | Card, SimpleGrid |
| faq | Collapse | Accordion | Accordion | Accordion |
| hero | Typography, Button | heading markup, Button | Typography, Button | Title, Text, Button |
| logo-strip | Flex, Image | flex markup | Stack, Box | Group, Image |
| feature-grid | Card, Row, Col | Card, CSS grid | Card, Grid | Card, SimpleGrid |
| testimonial | Card, Avatar | Card, Avatar | Card, Avatar | Card, Avatar |
| call-to-action | Flex, Button | Button | Box, Button | Group, Button |
| story | Row, Col, Image, Typography | grid markup | Grid, Typography | SimpleGrid, Image, Text |
| lead-story | Card, Image, Typography | Card | Card, CardMedia | Card, Image |
| story-list | List | list markup | List | Stack |
| composer | Input.TextArea, Button | Textarea, Button | TextField multiline, Button | Textarea, Button |
| feed | List, Card | Card | Card | Card, Stack |
| side-panel | Card | Card | Card | Paper |
| thread | List, Avatar, Typography | Card, Avatar | Card, Avatar | Paper, Avatar |
| lesson-list | List, Progress | ScrollArea, Progress | List, LinearProgress | Stack, Progress |
| media-player | — | — | — | — |
| map | — | — | — | — |
| canvas | — | — | — | — |
| toolbar | Flex, Button, Tooltip | Toolbar markup, Button, Tooltip | Toolbar, IconButton | Group, ActionIcon |
| layer-list | Tree | ScrollArea | List | Tree |
| inspector | Form (small) | Field, Input | TextField size="small" | TextInput size="xs" |
| chat | List, Input.TextArea | ScrollArea, Textarea | List, TextField | ScrollArea, Textarea |
| assistant-panel | Card, List, Input | Card, Textarea | Card, List, TextField | Paper, Stack, Textarea |
| prompt | Input.TextArea, Tag | Textarea, Badge | TextField multiline, Chip | Textarea, Badge |

- **media-player:** Use the native <video>/<audio> element; no library here ships a player.
- **map:** Use a map library (for example MapLibre or Leaflet); none of these ships one.
- **canvas:** Use a canvas or diagram library (for example tldraw or React Flow); none of these ships one.
- **tree:** shadcn and MUI core have no tree; MUI has one in @mui/x-tree-view, not pinned here.
- **command-palette:** antd, MUI and Mantine core have no command palette; Mantine has @mantine/spotlight, not pinned here; otherwise a Dialog with a search list.
- **kanban:** @dnd-kit/core 6.3.1 has had no release since 2024-12; its successor @dnd-kit/react is 0.5.0, pre-1.0. Pick knowingly.
- **calendar:** Month-agenda calendars with events are not in these libraries' cores; antd Calendar comes closest.
