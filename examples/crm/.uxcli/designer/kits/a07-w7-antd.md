# Kit a07-w7-antd

Formula: `A07 + B-W7, B-W2 + C2 + D02 + F1 + G2`. Library versions checked on 2026-10-14. A proposal: choosing it is a decision with at least one other option (another --lib, another formula), recorded under .uxcli/designer/decisions/.

## Warnings

- G2 with A07: Mobile first rarely suits desktop work screens; consider G1, still responsive.

## Library — Ant Design 6

Why: the usual library for A07 Operations workspace (CRM, ERP, HRM, admin). Alternatives: shadcn, mui, mantine.

Install: `antd@6.6.6` `@ant-design/icons@6.3.4`

Theming: ConfigProvider theme={{ token, algorithm }}; v6 writes CSS variables. Density: algorithm: theme.defaultAlgorithm.

- The four status colours map one to one onto antd's semantic tokens.

## Theme keys

| Library key | Token | Value |
|---|---|---|
| `token.colorPrimary` | action | #0f62fe |
| `token.colorError` | critical | #b42318 |
| `token.colorWarning` | warning | #8a5300 |
| `token.colorSuccess` | success | #157034 |
| `token.colorInfo` | info | #0b5cad |
| `token.colorText` | text | #1d2733 |
| `token.colorTextSecondary` | muted | #5f6b7a |
| `token.colorBgLayout` | bg | #f4f6f9 |
| `token.colorBgContainer` | surface | #ffffff |
| `token.colorBorderSecondary` | line | #dde3ea |
| `token.borderRadius` | radius | 6 |
| `token.fontFamily` | fontBody | system-ui, -apple-system, "Segoe UI", Roboto, sans-serif |
| `token.fontSize` | bodySize | 14 |
| `token.controlHeight` | controlHeight | 40 |

## Contrast

- ok text on bg: 13.95:1 (needs 4.5:1)
- ok text on surface: 15.11:1 (needs 4.5:1)
- ok muted on bg: 5.01:1 (needs 4.5:1)
- ok muted on surface: 5.43:1 (needs 4.5:1)
- ok onAction on action: 5:1 (needs 4.5:1)
- ok action on bg: 4.62:1 (needs 3:1)
- ok critical on criticalSoft: 5.75:1 (needs 4.5:1)
- ok critical on surface: 6.57:1 (needs 4.5:1)
- ok warning on warningSoft: 5.79:1 (needs 4.5:1)
- ok warning on surface: 6.33:1 (needs 4.5:1)
- ok success on successSoft: 5.44:1 (needs 4.5:1)
- ok success on surface: 6.18:1 (needs 4.5:1)
- ok info on infoSoft: 5.8:1 (needs 4.5:1)
- ok info on surface: 6.67:1 (needs 4.5:1)

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
