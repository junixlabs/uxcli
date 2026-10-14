# Kit a07-w7-antd

Formula: `A07 + B-W7, B-W2 + C2 + D02 + F1 + G2`. Library versions checked on 2026-10-14. A proposal: choosing it is a decision with at least one other option (another --lib, another formula), recorded under .uxcli/designer/decisions/.

## Warnings

- G2 with A07: Mobile first rarely suits desktop work screens; consider G1, still responsive.
- light: the action colour is close to info (OKLab 0.04) — a button can read as a status; move the action hue or keep info badges word-led (one-meaning)
- dark: the action colour is close to info (OKLab 0.04) — a button can read as a status; move the action hue or keep info badges word-led (one-meaning)

## Library — Ant Design 6

Why: the usual library for A07 Operations workspace (CRM, ERP, HRM, admin). Alternatives: shadcn, mui, mantine.

Install: `antd@6.6.6` `@ant-design/icons@6.3.4`

Theming: ConfigProvider theme={{ token, algorithm }}; v6 writes CSS variables. Density: algorithm: theme.defaultAlgorithm.

- The four status colours map one to one onto antd's semantic tokens.

## Theme keys

Dark mode: algorithm: [theme.darkAlgorithm] (with theme.compactAlgorithm for C1) and the dark tokens in a second ConfigProvider theme.

| Library key | Token | Light | Dark |
|---|---|---|---|
| `token.colorPrimary` | action | #0f62fe | #0f62fe |
| `token.colorText` | text | #1d2733 | #bfc9d4 |
| `token.colorTextSecondary` | muted | #5f6b7a | #919ba6 |
| `token.colorBgLayout` | bg | #f4f6f9 | #070e16 |
| `token.colorBgContainer` | surface | #ffffff | #0e141d |
| `token.colorBorderSecondary` | line | #dde3ea | #323a44 |
| `token.borderRadius` | radius | 6 | 6 |
| `token.fontFamily` | fontBody | system-ui, -apple-system, "Segoe UI", Roboto, sans-serif | system-ui, -apple-system, "Segoe UI", Roboto, sans-serif |
| `token.fontSize` | bodySize | 14 | 14 |
| `token.controlHeight` | controlHeight | 40 | 40 |
| `token.colorPrimaryHover` | actionHover | #0055ed | #0055ed |
| `token.colorPrimaryActive` | actionPressed | #004cd5 | #004cd5 |
| `token.colorLink` | actionText | #2858b8 | #4e83e6 |
| `token.colorBorder` | lineStrong | #90959c | #5a636d |
| `token.colorFillTertiary` | hoverBg | #e2ecf9 | #181f27 |
| `token.colorBgElevated` | raised | #ffffff | #181f27 |
| `token.colorError` | criticalSolid | #d92d20 | #d92d20 |
| `token.colorErrorText` | critical | #ae3428 | #da5d4d |
| `token.colorErrorBg` | criticalSoft | #fce5e2 | #2c1815 |
| `token.colorWarning` | warningSolid | #f79009 | #f79009 |
| `token.colorWarningText` | warning | #9c5900 | #ffad5f |
| `token.colorWarningBg` | warningSoft | #f6e9de | #271b10 |
| `token.colorSuccess` | successSolid | #17b26a | #17b26a |
| `token.colorSuccessText` | success | #007945 | #3cc87e |
| `token.colorSuccessBg` | successSoft | #e2efe6 | #142219 |
| `token.colorInfo` | infoSolid | #1570ef | #1570ef |
| `token.colorInfoText` | info | #2360be | #4584e5 |
| `token.colorInfoBg` | infoSoft | #e1ecfc | #141e2e |

## Colour

Modes: light, dark. Components use roles; scales are where the roles come from. Every pair below was measured; nothing here is hoped for.

### Roles

| Role | light | dark |
|---|---|---|
| bg | #f4f6f9 | #070e16 |
| surface | #ffffff | #0e141d |
| raised | #ffffff | #181f27 |
| line | #dde3ea | #323a44 |
| lineStrong | #90959c | #5a636d |
| text | #1d2733 | #bfc9d4 |
| muted | #5f6b7a | #919ba6 |
| disabledText | #969fab | #565e69 |
| action | #0f62fe | #0f62fe |
| actionHover | #0055ed | #0055ed |
| actionPressed | #004cd5 | #004cd5 |
| onAction | #ffffff | #ffffff |
| actionText | #2858b8 | #4e83e6 |
| focusRing | #0f62fe | #0f62fe |
| selectedBg | #d2e2ff | #182640 |
| hoverBg | #e2ecf9 | #181f27 |
| activeBg | #d8e2ef | #202730 |
| disabledBg | #e2ecf9 | #181f27 |
| critical | #ae3428 | #da5d4d |
| criticalSoft | #fce5e2 | #2c1815 |
| criticalSolid | #d92d20 | #d92d20 |
| onCriticalSolid | #ffffff | #ffffff |
| warning | #9c5900 | #ffad5f |
| warningSoft | #f6e9de | #271b10 |
| warningSolid | #f79009 | #f79009 |
| onWarningSolid | #111111 | #111111 |
| success | #007945 | #3cc87e |
| successSoft | #e2efe6 | #142219 |
| successSolid | #17b26a | #17b26a |
| onSuccessSolid | #111111 | #111111 |
| info | #2360be | #4584e5 |
| infoSoft | #e1ecfc | #141e2e |
| infoSolid | #1570ef | #1570ef |
| onInfoSolid | #ffffff | #ffffff |

### Scales — light

| Step | Use | neutral | action | critical | warning | success | info |
|---|---|---|---|---|---|---|---|
| 1 | App background | #f7faff | #f7faff | #fef9f8 | #fdf9f7 | #f8fbf9 | #f8fafe |
| 2 | Subtle background: page bands, striped rows | #eff6ff | #f0f5ff | #fef2f0 | #faf4ee | #f0f7f2 | #f0f6fe |
| 3 | Element background: chips, inputs, hover of a neutral row | #e2ecf9 | #e1ecff | #fce5e2 | #f6e9de | #e2efe6 | #e1ecfc |
| 4 | Hovered element; selected background (action) | #d8e2ef | #d2e2ff | #f9d9d3 | #f1ddcd | #d3e7d9 | #d3e3fb |
| 5 | Active or pressed element background | #cfd9e5 | #c3d8ff | #f7ccc4 | #ecd2bd | #c4dfcd | #c4d9f9 |
| 6 | Subtle border, divider | #c2ccd8 | #afcbfe | #f3bbb1 | #e5c3a7 | #b1d5bd | #b1ccf6 |
| 7 | Border of a component that is not interactive | #afb8c4 | #91b7fe | #eda194 | #dbad85 | #92c6a4 | #93b9f3 |
| 8 | Strong border; disabled text | #969fab | #6b9cf8 | #e27e70 | #cc9059 | #6bb085 | #6e9feb |
| 9 | Solid: the seed colour — buttons, badges, chart marks | #6a727d | #0f62fe | #d92d20 | #f79009 | #17b26a | #1570ef |
| 10 | Hovered solid | #5f6771 | #0055ed | #cb180e | #ffa03f | #2fbf76 | #0063e0 |
| 11 | Low-contrast text on the scale (5:1 or more) | #59606b | #2858b8 | #ae3428 | #9c5900 | #007945 | #2360be |
| 12 | High-contrast text on the scale (11:1 or more) | #303741 | #1f3560 | #5b261f | #532d00 | #003f22 | #1c3660 |

Chart (light): categorical #507ed3 #9667c1 #bd5989 #c55d3f #a57700 #6a8f21 #009678 #008faa; sequential #e1ecff #c3d8ff #91b7fe #0f62fe #2858b8; diverging #ae3428 #e27e70 #cfd9e5 #6e9feb #2360be. Label series directly; hue alone does not tell them apart for everyone.

### Scales — dark

| Step | Use | neutral | action | critical | warning | success | info |
|---|---|---|---|---|---|---|---|
| 1 | App background | #070e16 | #090d16 | #140b09 | #120c07 | #090f0b | #090d14 |
| 2 | Subtle background: page bands, striped rows | #0e141d | #0e141f | #1c100e | #19120c | #0e1611 | #0e141d |
| 3 | Element background: chips, inputs, hover of a neutral row | #181f27 | #141e30 | #2c1815 | #271b10 | #142219 | #141e2e |
| 4 | Hovered element; selected background (action) | #202730 | #182640 | #3a1d19 | #342213 | #182c1f | #18273d |
| 5 | Active or pressed element background | #283039 | #1b2e51 | #48231d | #402914 | #1b3625 | #1c2f4c |
| 6 | Subtle border, divider | #323a44 | #203864 | #582923 | #4f3217 | #20422d | #22395e |
| 7 | Border of a component that is not interactive | #404853 | #264581 | #713229 | #643e18 | #245337 | #284778 |
| 8 | Strong border; disabled text | #565e69 | #305aa9 | #943f34 | #83501b | #2c6c47 | #325d9e |
| 9 | Solid: the seed colour — buttons, badges, chart marks | #7e8792 | #0f62fe | #d92d20 | #f79009 | #17b26a | #1570ef |
| 10 | Hovered solid | #8a939e | #0055ed | #cb180e | #ffa03f | #2fbf76 | #0063e0 |
| 11 | Low-contrast text on the scale (5:1 or more) | #919ba6 | #4e83e6 | #da5d4d | #ffad5f | #3cc87e | #4584e5 |
| 12 | High-contrast text on the scale (11:1 or more) | #bfc9d4 | #acc9fd | #fab7ab | #ffecdb | #b1ebc5 | #a9cafc |

Chart (dark): categorical #7caaff #c292ef #ed83b4 #f58869 #d6a12b #93bb53 #19c7a1 #00bee1; sequential #141e30 #1b2e51 #264581 #0f62fe #4e83e6; diverging #da5d4d #943f34 #283039 #325d9e #4584e5. Label series directly; hue alone does not tell them apart for everyone.

### Checks on the colours

- light: 34/34 contrast pairs hold; the closest is lineStrong on surface at 3.02:1 (needs 3:1). Colour blindness: 18 status pairs simulated, none close.
- dark: 34/34 contrast pairs hold; the closest is critical on criticalSoft at 4.53:1 (needs 4.5:1). Colour blindness: 18 status pairs simulated, none close.

## B-W7 Inbox or queue

Tickets, things to handle, approvals.

| Region | Component | Note |
|---|---|---|
| app-shell | Layout, Layout.Sider, Menu |  |
| record-list | List, List.Item |  |
| detail-header | Flex, Avatar, Typography.Title, Tag, Button |  |
| notice | Alert |  |
| bulk-bar | Flex, Button, Typography.Text |  |

Checks for this layout: bulk-visible-only, bulk-server-allowed, selection-across-pages, no-nested-scroll, sort-visible, drop-flat-columns, tier-one-on-top, alert-with-fix, no-dead-links, default-view-has-data, dialog-cancel.

## B-W2 List-detail

Working through many records one after another without losing one's place.

| Region | Component | Note |
|---|---|---|
| app-shell | Layout, Layout.Sider, Menu |  |
| record-list | List, List.Item |  |
| detail-header | Flex, Avatar, Typography.Title, Tag, Button |  |
| detail-panel | Descriptions |  |
| timeline | Timeline |  |

Checks for this layout: tier-one-on-top, alert-with-fix, no-dead-links, dialog-cancel.

## Structure

- src/theme/tokens.json  (this kit's tokens)
- src/theme/theme.ts  (the Ant Design 6 theme, keys as below)
- src/components/  (a component at its second use)
- src/features/<area>/  (screens, by what the person does)

## Rules that hold in every style

- **colour-roles.** Colour has fixed roles: a neutral ground, one action colour and four status colours (critical, warning, success, info). No colour outside a role. *Check:* List the tokens; count colours used outside them — zero.
- **one-meaning.** One colour, one meaning across the product; the action colour is not a status colour. *Check:* Compare the colour-to-meaning table between screens.
- **quiet-normal.** The normal state is quiet; only what needs attention carries colour. *Check:* The share of rows with a warm status chip on one screen stays low.
- **few-codes.** At most five to seven status colours per entity, and about four new colour codes to learn per screen. *Check:* Count them.
- **never-colour-alone.** Colour is never the only signal: a short word or an icon always goes with it. *Check:* In greyscale every state is still told apart.
- **contrast.** Text 4.5:1, large text and component parts 3:1, in light and dark. *Check:* Measure automatically.
- **scales.** About four type sizes on one scale and spacing from one scale; space between groups is clearly larger than space within them. *Check:* Count the distinct values in the CSS.
- **one-primary.** One dominant element and one primary button per screen. *Check:* Squint test; count primary buttons.
- **space-lines-boxes.** Separate with space first, a line second, a box last; no box inside a box. *Check:* Count nested boxed layers.
- **first-screen.** The most important thing is on the first screen; long pages have headings that read alone; no scroll box inside a scrolling page. *Check:* Position of the main element against 100vh; count nested scroll areas.
- **table-card-list.** Compare in a table, browse independent items with pictures in cards, read in order in a list. *Check:* Check against what the person does on the screen.
- **table-basics.** Tables: numbers right-aligned in tabular figures, text left, one unit per column, sort state visible, sticky header, empty and loading states. *Check:* Check column by column.

## Checks before done

- **bulk-visible-only** (bug, S1). Bulk actions touch only the rows the filter shows; filtering cuts the selection in the same render.
- **bulk-server-allowed** (contract, S2). Bulk sends only rows the server marked as allowed, and says beforehand how many are skipped and why.
- **selection-across-pages** (usability, N3). With pagination, the selection bar says which page the selection is on and offers "select all N".
- **no-nested-scroll** (usability, N2). The table is not its own scroll box inside a scrolling page; the header sticks, the pager sticks.
- **sort-visible** (usability, N2). Sort arrows are always visible, faintly, not only on hover.
- **drop-flat-columns** (usability, N1). A column holding one value in 80% or more of rows is dropped or merged; no "Open" button column when the name is a link.
- **tier-one-on-top** (usability, N3). Identity, status, next action and what is overdue sit on top; standing explanatory paragraphs go behind a "?".
- **alert-with-fix** (usability, N3). Every alert carries the way to fix it right there.
- **no-dead-links** (usability, N3). No link leads to a refusal (403) or nothing (404); say why in words instead.
- **default-view-has-data** (usability, N2). A screen does not open on an empty view while the view beside it has data.
- **refusals-in-words** (contract, S2). A refusal shows a sentence from one shared table of reason codes, never a raw code or the backend's English.
- **read-the-backend** (contract, S2). Field names of errors and allowlists are read from the backend code, not guessed; "" clears a field, it is not "do not send".
- **why-on-rule-errors** (usability, N2). An error caused by a business rule links to "Why?" explained in place; an input error does not.
- **no-typed-codes** (usability, N3). Nobody types a reason code; offer sentences with the code behind them; a choice list over ten items has search.
- **dialog-cancel** (usability, N2). Long create or edit forms open in a dialog or a page, never inline pushing the page down; a writing dialog ends with "Cancel", a reading one with "Close".
- **open-every-layer** (bug, S1). Open every overlay (select, popover, dialog) and confirm it has content; reading text on the page is not enough.
- **layer-order** (bug, S2). A select or popover opened in a dialog sits above the dialog's backdrop; every floating layer has its own z-index.
- **tokens-in-dark** (a11y, S2). Text and ground colours go through tokens; open dark mode and measure contrast.
- **no-sideways-scroll** (a11y, S2). No horizontal scroll at 390px; header button rows may wrap. Check 1920, 1280, 860 and 390.
- **no-button-in-button** (a11y, S2). No button inside a button; a long screen-reader name goes in aria-label, not in visible text.
- **one-word-one-meaning** (usability, N2). One word, one meaning per screen; buttons with one role share one label; one way of saying "empty".
- **component-at-second-use** (debt, -). Sizes, weights and colours come from tokens; markup used on a second screen becomes a component.
- **count-boxes** (usability, N1). Count boxed nesting before showing a page: space first, lines next, boxes last.
- **measure-not-eyeball** (drift, N2). When a prototype exists, compare the build by measurement, not by eye.
