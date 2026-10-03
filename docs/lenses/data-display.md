# Lens research — data display

Researched 2026-10-03 for the uxcli "lenses" idea. This cluster covers how data is laid out and shown: tables, summary lists, numbers, empty and loading states for data, and charts. Sources are the published design systems of IBM (Carbon), GOV.UK (GDS), the U.S. government (USWDS), GitHub (Primer) and Shopify (Polaris), plus the W3C WAI tables tutorial.

## How the sources were read

Direct fetches of the public design-system sites were blocked from this session (every public URL below returned no response through the proxy). Each site's documentation lives in a public GitHub repository, so the source text was read from the raw Markdown/MDX that builds the public page, via `https://raw.githubusercontent.com/...`. File paths were found by a blobless `git clone --no-checkout` and `git ls-tree`.

Every quote in `skills/uxcli/lenses/viewpoints/data-display.json` was checked by script against the fetched raw file after normalising only what the site renderer removes: Markdown emphasis (`**`), inline-code backticks, link syntax (`[text](url)` → `text`) and line wrapping/whitespace. Quotes that join two passages use ` … `; each part was checked separately. No quote was paraphrased.

The `url` in each viewpoint is the public page that the raw file builds, derived from the repository's path and the site's URL scheme; it was **not** fetched directly. The raw file is named below for each.

## Sources fetched

| source | owner | public page (`url`) | raw file read |
|---|---|---|---|
| Data table — usage | IBM Carbon | https://carbondesignsystem.com/components/data-table/usage/ | carbon-design-system/carbon-website `main` `src/pages/components/data-table/usage.mdx` |
| Empty states pattern | IBM Carbon | https://carbondesignsystem.com/patterns/empty-states-pattern/ | carbon-design-system/carbon-website `main` `src/pages/patterns/empty-states-pattern/index.mdx` |
| Loading pattern | IBM Carbon | https://carbondesignsystem.com/patterns/loading-pattern/ | carbon-design-system/carbon-website `main` `src/pages/patterns/loading-pattern/index.mdx` |
| Axes and labels | IBM Carbon | https://carbondesignsystem.com/data-visualization/axes-and-labels/ | carbon-design-system/carbon-website `main` `src/pages/data-visualization/axes-and-labels/index.mdx` |
| Table | GOV.UK Design System | https://design-system.service.gov.uk/components/table/ | alphagov/govuk-design-system `main` `src/components/table/index.md` |
| Summary list | GOV.UK Design System | https://design-system.service.gov.uk/components/summary-list/ | alphagov/govuk-design-system `main` `src/components/summary-list/index.md` |
| Table (usability, accessibility, when to consider something else) | USWDS | https://designsystem.digital.gov/components/table/ | uswds/uswds-site `main` `_components/table/guidance/usability.md`, `accessibility.md`, `when-to-consider-something-else.md` |
| Data table | GitHub Primer | https://primer.style/product/components/data-table/ | primer/design `main` `content/components/data-table.mdx` |
| Loading | GitHub Primer | https://primer.style/product/ui-patterns/loading/ | primer/design `main` `content/ui-patterns/loading.mdx` |
| Empty states | GitHub Primer | https://primer.style/product/ui-patterns/empty-states/ | primer/design `main` `content/ui-patterns/empty-states.mdx` |
| Data visualization | GitHub Primer | https://primer.style/product/ui-patterns/data-visualization/ | primer/design `main` `content/ui-patterns/data-visualization.mdx` |
| Data table | Shopify Polaris | https://polaris-react.shopify.com/components/tables/data-table | Shopify/polaris `main` `polaris.shopify.com/content/components/tables/data-table.mdx` |
| Empty state | Shopify Polaris | https://polaris-react.shopify.com/components/layout-and-structure/empty-state | Shopify/polaris `main` `polaris.shopify.com/content/components/layout-and-structure/empty-state.mdx` |
| Data visualizations | Shopify Polaris | https://polaris-react.shopify.com/design/data-visualizations | Shopify/polaris `main` `polaris.shopify.com/content/design/data-visualizations.mdx` |
| Tables Tutorial; Tips and Tricks | W3C WAI (eds. Eric Eggert, Shadi Abou-Zahra) | https://www.w3.org/WAI/tutorials/tables/ , https://www.w3.org/WAI/tutorials/tables/tips/ | w3c/wai-tutorials `master-2.0` `content/tables/index.md`, `content/tables/tips.md` (front matter `permalink` gives the public path) |

Note: the Polaris repository's data-visualizations page opens with "This section is currently being reworked to provide better guidance aligned with Polaris v12." Its guidance is still Shopify's published word, but it may change.

Evidence grade: every entry is `author` — a design system's published guidance, not a study. Several of these systems cite research (Carbon's loading pattern cites NN/g on progress indicators), but the rules quoted here are their own.

## Viewpoints

### data-display.right-align-numbers-tabular-figures

- **Source:** GitHub Primer, Data table, "Make numbers easier to compare". https://primer.style/product/components/data-table/ (raw: `primer/design/content/components/data-table.mdx`)
- **Quote:** "Right-align numeric values and use the tabular-num font variant when possible." (In the raw file `tabular-num` is inline code wrapped in a link to MDN `font-variant-numeric`; the link text and backticks were removed.)
- **Corroboration, verified the same way:**
  - GOV.UK Table, "Numbers in a table": "When comparing columns of numbers, align the numbers to the right in table cells."
  - USWDS Table usability: "Right-align numerical data." and "Use a monospace font for numerical data." The same bullet adds: "(There’s no need to apply monospace formatting or alignment to phone numbers, zip codes, dates, or other number content that can’t be totaled.)" This is the source of the identifier exception.
  - Polaris Data table, Alignment: "Numerical = Right aligned".
- **Overlap:** `craft.align-with-readability-in-mind` and `modern.numbers-and-text-do-not-shift-layout` both touch tabular figures; this entry makes the table-cell rule specific and countable.

### data-display.text-left-headers-follow-their-column

- **Source:** W3C WAI Tables Tutorial, Tips and Tricks, "Alignment". https://www.w3.org/WAI/tutorials/tables/tips/ (raw: `w3c/wai-tutorials/content/tables/tips.md`, last_updated 2024-05-13)
- **Quote:** "Align text to the left and numeric data to the right (in left-to-right languages), so that people using larger text sizes or smaller screens will be able to find it. … It’s helpful to give column headers the same alignment as the data in the cells below." (The raw file has a double space in "It’s  helpful", which HTML rendering collapses.)
- **Corroboration:** Polaris Data table, Alignment: "Textual data = Left aligned", "Align headers with their related data", "Don’t center align".

### data-display.one-unit-and-format-per-column

- **Source:** USWDS Table, usability guidance. https://designsystem.digital.gov/components/table/ (raw: `uswds/uswds-site/_components/table/guidance/usability.md`)
- **Quote:** "Predictably format columns. Take care not to vary units or formatting within the same column. Instead, normalize values so they can be easily compared." (The first sentence is bold in the raw file.)
- **Corroboration:** Polaris Data table: "Keep decimals consistent. For example, don’t use 3 decimals in one row and 2 in others." and headers should "Include units of measurement symbols so they aren’t repeated throughout the columns". Polaris's Do/Don't example is "Temperature °C" versus "Temperature".

### data-display.header-cells-are-th-with-scope

- **Source:** W3C WAI Tables Tutorial (index). https://www.w3.org/WAI/tutorials/tables/ (raw: `w3c/wai-tutorials/content/tables/index.md`, WCAG SC 1.3.1)
- **Quote:** "Header cells must be marked up with <th>, and data cells with <td> to make tables accessible. For more complex tables, explicit associations may be needed using scope, id, and headers attributes." (`<th>`, `<td>`, `scope`, `id` and `headers` are inline code in the raw file.)
- **Corroboration:**
  - GOV.UK Table: "Use table headers to tell users what the rows and columns represent. Use the scope attribute to help users of assistive technology distinguish between row and column headers."
  - USWDS Table accessibility: "Simple tables can have up to two rows of headers. Each header cell should have scope="col" or scope="row"."
  - WAI Tips: "Table separation: If several tables follow one another, don’t use a single table and put in an additional row of <th> cells."

### data-display.no-tables-for-layout

- **Source:** GOV.UK Design System, Table, "When not to use this component". https://design-system.service.gov.uk/components/table/ (raw: `alphagov/govuk-design-system/src/components/table/index.md`)
- **Quote:** "Never use the table component to layout content on a page."
- **Corroboration:**
  - USWDS, When to consider something else: "Don’t use tables in place of a layout grid."
  - Polaris Data table accessibility, under "Don’t": "Use tables for layout."
  - Primer Data table, "Use a list or something else": "When rows and columns are only a means of layout".
- The HTML-email exception is ours, not a quoted source, and is marked as such only by being in `exceptions`.

### data-display.summary-list-for-key-value-facts

- **Source:** GOV.UK Design System, Summary list. https://design-system.service.gov.uk/components/summary-list/ (raw: `alphagov/govuk-design-system/src/components/summary-list/index.md`)
- **Quote:** "Use a summary list to show information as a list of key facts. … only use it to present information that has a key and at least one value." The second passage is from "The summary list uses the description list (`<dl>`) HTML element, so only use it to present information that has a key and at least one value."
- **Also on the page:** "Do not use it for tabular data or a simple list of information or tasks". The page also describes visually hidden text on row actions, such as 'Change name', which is the source of the row-action preference.
- **Measure:** `question`. Whether a block of text is "a record's fields" is a judgement call, so no fixture-backed count was claimed.

### data-display.long-tables-sort-and-say-so

- **Source:** USWDS Table, usability guidance. https://designsystem.digital.gov/components/table/ (raw: `usability.md`)
- **Quote:** "Enable sort where useful. Add row sorting to individual columns of long tables where the data can be logically ordered either alphabetically or numerically."
- **Corroboration:**
  - Primer Data table, Sorting: "If a table is sortable, it must start with one column sorted on page load."
  - Polaris Data table: "Sortable tables use the aria-sort attribute to convey which columns are sortable (and in what direction)."
  - USWDS accessibility: "Add an aria-live region to the page when enabling row sorting."
  - USWDS usability, the merged-cell prohibition: "Don’t use row sorting with merged cells."
  - Primer pagination: "20 rows is a good place to start." This is the threshold used in the measure.

### data-display.empty-data-explains-and-offers-next-step

- **Source:** IBM Carbon, Empty states pattern, Anatomy. https://carbondesignsystem.com/patterns/empty-states-pattern/ (raw: `carbon-website/src/pages/patterns/empty-states-pattern/index.mdx`)
- **Quote:** "Body: Explain clearly the next action to populate the space. You may also explain why the space is empty and include the benefit of taking this step." ("Body:" is bold in the raw file.)
- **Also from Carbon:**
  - "Empty states always appear in the otherwise empty space, in the context of the data that’s missing."
  - The page's table of no-data, user-action (no results) and error-management empty states.
  - The multiple-empty-states rule: "we recommend using a tertiary button for the call to action."
- **Corroboration:**
  - Primer Data table: "Communicate when the table has no data to show" / "Show a Blankslate component in place of the table".
  - Primer Empty states, on errors with no fix: "secondary text can provide additional revelevant context or explain what they can do to get help". "revelevant" is sic in the source.
  - Polaris Empty state: "Use only one primary call-to-action button".
- **Overlap:** `craft.dont-overlook-empty-states-teach-by-example` and `modern.every-state-is-designed` cover empty states in general. This entry adds placement in the data region and the distinction between first use, no results and error.

### data-display.loading-skeleton-holds-the-layout

- **Source:** GitHub Primer, Data table, "Use “skeleton” placeholders to indicate loading content". https://primer.style/product/components/data-table/ (raw: `data-table.mdx`)
- **Quote:** "Use “skeleton” placeholders to indicate loading content … The placeholder should match the real content as closely as possible. … Ideally, the height of the cell will not change once the data is loaded." The first passage is the section heading.
- **Corroboration:**
  - Carbon Data table: "If extra load time is expected to display information, use skeleton states instead of spinners."
  - Carbon Loading pattern: "Never represent toast notifications, overflow menus, dropdown items, modals, and loaders with skeleton states."
  - Primer Loading: "Avoid creating a jarring layout shift when the loaded content replaces the loading indicator." and "Less than 1 second: Don't show a loading state." The second is the source of the sub-second exception.
  - The Primer Loading caption: "Have a single loading announcement for a collection of skeleton loaders".

### data-display.wrap-before-truncating-and-reveal-the-rest

- **Source:** GitHub Primer, Data table, "Avoid wrapping or truncation of cell content as much as possible". https://primer.style/product/components/data-table/
- **Quote:** "Cells that are likely to contain long strings may choose to wrap the content. This is the preferred way to accommodate long content because it doesn't hide the content. … Content truncation is available as a last resort when column widths are set. The full content may be exposed in a tooltip."
- **Corroboration:**
  - Polaris Data table: "Wrap instead of truncate content. This is because if row titles start with the same word, they’ll all appear the same when truncated."
  - Carbon Data table, column titles: "In cases where a column title is too long, wrap the text to two lines and then truncate the rest of the text. The full text should be shown in a tooltip on hover."
- "Truncating numbers" is listed in `forbids` as our inference from the same principle. No source quoted says it in those words.

### data-display.chart-axes-are-honest

- **Source:** IBM Carbon, Data visualization, Axes and labels. https://carbondesignsystem.com/data-visualization/axes-and-labels/ (raw: `carbon-website/src/pages/data-visualization/axes-and-labels/index.mdx`)
- **Quote:** "Always start numerical axes at zero for part-to-whole and comparisons charts, such as bar and area chart. … Never interpolate between periods when data is unavailable."
- **Exception from the same page:** "Line charts and scatter plots are less sensitive to this distortion because they are intended to communicate trends and not the relative size of the difference." The same page says "Never change axis ticks increments to accommodate data availability."
- **Overlap:** `canon.tufte-graphical-integrity` already says bars start at zero. This entry adds Carbon's line-chart exception and the rule against interpolating gaps.

### data-display.chart-axes-and-bars-are-labelled

- **Source:** Shopify Polaris, Data visualizations. https://polaris-react.shopify.com/design/data-visualizations (raw: `Shopify/polaris/polaris.shopify.com/content/design/data-visualizations.mdx`)
- **Quote:** "All standard charts that show quantitative data have 2 axes that should be labeled for clarity. … Label each bar with what it’s displaying, as well as the value."
- **Also from Polaris:**
  - "Labelling should be outside and separate from the data area."
  - Do "Skip labels in regular intervals." / Don't "Slant labels to make them fit."
  - Horizontal bar charts, Don't use: "When the number of data points can exceed 6. In this case, use a table."
- **Corroboration:** Primer Data visualization anatomy table, Legend row: "Only show a legend when showing more than 1 data set".

## Considered and dropped

- **Row density and the hover state.** Carbon's Data table says "The data table’s row hover state should always be enabled as it can help the user visually scan the columns of data in a row even if the row is not interactive." It also offers five row sizes. Primer offers Condensed/Normal/Spacious density. Both quotes were verified, but the entry was dropped: the pool was already at twelve, and the guidance is a menu of options rather than a rule a rendered page can break. A future entry could count tables whose `tr:hover` changes nothing.
- **Empty cells shown as "-" or "x".** Primer: "You may show a message to explain an absence of data. Just don't use a character like “x” or “-”." This was verified. It was left out to keep the pool near the target size and because it is a single-source rule. It is a good candidate for the next revision.
- **GOV.UK "less data in tables".** "If possible, you should aim to have less data in your tables." This was verified but is too general to measure.
