# Lens research — colour

Researched 2026-10-03 for the uxcli "lenses" pool `color` (`skills/uxcli/lenses/viewpoints/color.json`). This cluster covers colour as the open-source design systems and the W3C state it: colour never as the only signal, status colours that keep their meaning, tokens instead of hex, a few families in proportion, one action colour, 3:1 for controls and focus indicators, light/dark modes, and colour in charts.

**How the text was fetched.** The public design-system sites are blocked to WebFetch in this environment, and the GitHub API returned "access not enabled" for these repositories. Every source below was therefore read as the raw Markdown/MDX/HTML that the public page is built from, fetched in-session with `curl https://raw.githubusercontent.com/<owner>/<repo>/main/<path>` (file paths found with `git clone --depth 1 --filter=blob:none --no-checkout` and `git ls-tree`). The `url` in each viewpoint is the public page built from that file; the raw file is named in each section.

**How quotes were verified.** Each quote was checked with `grep -F` against the fetched file. Where the source text wraps across lines (Carbon MDX, WCAG HTML) or carries inline markup (`<a>`, `<em>` in WCAG), the check ran on the file with tags stripped and whitespace collapsed (`tr -s ' \n\t' ' ' | sed 's/<[^>]*>//g'`), which is how the sentence reads on the rendered page. No quote was altered; none needed paraphrase to fit.

Existing viewpoints this pool overlaps and names in `agrees`: `craft.wcag-contrast-and-dont-rely-on-colour-alone`, `modern.contrast-and-not-colour-alone`, `craft.black-and-white-first-limit-hues`, `canon.gestalt-similarity`, `canon.tufte-graphical-integrity`. Text contrast (WCAG 1.4.3) is already a validated probe (`page.contrast`) and is not repeated here; focus *presence* (2.4.7) is the probe `page.focus-visible`, and the focus viewpoint below covers only the contrast of the indicator.

## Sources fetched

| source | author | public URL | raw file verified against |
|---|---|---|---|
| Understanding SC 1.4.1 Use of Color | W3C AG WG | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html | `w3c/wcag` `understanding/20/use-of-color.html` |
| Understanding SC 1.4.11 Non-text Contrast | W3C AG WG | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html | `w3c/wcag` `understanding/21/non-text-contrast.html` |
| Styles: Colour | GOV.UK Design System | https://design-system.service.gov.uk/styles/colour/ | `alphagov/govuk-design-system` `src/styles/colour/index.md` |
| Color overview | USWDS | https://designsystem.digital.gov/design-tokens/color/overview/ | `uswds/uswds-site` `pages/design-tokens/color/overview.md` |
| Theme color tokens | USWDS | https://designsystem.digital.gov/design-tokens/color/theme-tokens/ | `uswds/uswds-site` `pages/design-tokens/color/theme-tokens.md` |
| State color tokens | USWDS | https://designsystem.digital.gov/design-tokens/color/state-tokens/ | `uswds/uswds-site` `pages/design-tokens/color/state-tokens.md` |
| Data visualizations | USWDS | https://designsystem.digital.gov/components/data-visualizations/ | `uswds/uswds-site` `_components/data-visualizations/data-visualizations.md` |
| Color overview | IBM Carbon | https://carbondesignsystem.com/elements/color/overview/ | `carbon-design-system/carbon-website` `src/pages/elements/color/overview.mdx` |
| Color usage | IBM Carbon | https://carbondesignsystem.com/elements/color/usage/ | `.../src/pages/elements/color/usage.mdx` |
| Accessibility: Color | IBM Carbon | https://carbondesignsystem.com/guidelines/accessibility/color/ | `.../src/pages/guidelines/accessibility/color.mdx` |
| Data visualization: Color palettes | IBM Carbon | https://carbondesignsystem.com/data-visualization/color-palettes/ | `.../src/pages/data-visualization/color-palettes/index.mdx` |
| UI color system | GitHub Primer | https://primer.style/foundations/color/overview | `primer/design` `content/foundations/color/overview.mdx` |
| Color: Accessibility | GitHub Primer | https://primer.style/foundations/color/accessibility | `primer/design` `content/foundations/color/accessibility.mdx` |
| Color considerations | GitHub Primer | https://primer.style/guides/accessibility/color-considerations | `primer/design` `content/guides/accessibility/color-considerations.mdx` |
| Data visualization | GitHub Primer | https://primer.style/ui-patterns/data-visualization | `primer/design` `content/ui-patterns/data-visualization.mdx` |
| Palettes and roles | Shopify Polaris | https://polaris.shopify.com/design/colors/palettes-and-roles | `Shopify/polaris` `polaris.shopify.com/content/design/colors/palettes-and-roles.mdx` |
| Using color | Shopify Polaris | https://polaris.shopify.com/design/colors/using-color | `Shopify/polaris` `polaris.shopify.com/content/design/colors/using-color.mdx` |
| Data visualizations | Shopify Polaris | https://polaris.shopify.com/design/data-visualizations | `Shopify/polaris` `polaris.shopify.com/content/design/data-visualizations.mdx` |

Primer's public URLs are the ones the Primer files themselves link to (`color-considerations.mdx` links `https://primer.style/foundations/color/overview` and `.../color/accessibility`); the site may have since moved under `primer.style/product/`. Not used: Atlassian and Material, whose colour guidance was not looked for on GitHub in this session.

## Viewpoints

### never-the-only-signal
- **Claim:** "Use information in addition to color, such as shape or text, to convey meaning." (WCAG 1.4.1, "In brief: What to do")
- **Source:** W3C, https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html — raw `understanding/20/use-of-color.html`, `grep -F` exact on one line.
- **Corroboration (all grep-verified):** USWDS overview: "Color should only be used as progressive enhancement — if color is the only signal, that signal won’t get through as intended to everyone." Carbon accessibility: "Don't rely on color alone to convey meaning. This includes conveying information, indicating an action, prompting the user for a response, or distinguishing one visual element from another." Primer accessibility: "To make sure everyone can understand and use your UI you should show state with more than a change in color." Primer color considerations, validation state: "Validation state **must not** rely on color as the sole way of determining if an input is valid." (bold markup is in the source).
- **Exceptions (source text):** WCAG: hues that also differ in lightness at 3:1 or more count as a second cue, "However, if content relies on the user's ability to accurately perceive or differentiate a particular color an additional visual indicator will be required regardless of the contrast ratio between those colors"; visited-link colour is not an author responsibility. Primer: "Unless color is only used as a visual \"flourish\"".
- **Measurable?** Yes as a count: greyscale the render and count state pairs that become indistinguishable (hue-only difference under 3:1 with no text/icon/shape difference). Must-fail/must-pass are in the JSON.
- **Evidence:** standard (WCAG level A) — recorded as `author`.
- **Overlap:** states the same rule as `craft.wcag-contrast-and-dont-rely-on-colour-alone` and `modern.contrast-and-not-colour-alone`; kept because the colour pool needs it as its base and the measure (greyscale diff of states) is specific.

### status-colours-keep-their-meaning
- **Claim:** "Elements using critical must convey messaging that implies that an action is impossible, blocked, or has resulted in an error."
- **Source:** Polaris, Palettes and roles, https://polaris.shopify.com/design/colors/palettes-and-roles — raw `palettes-and-roles.mdx`, `grep -F` exact.
- **Prefers / forbids (Polaris do/don't, grep-verified):** Success don't: "Use success to entice merchants or to share special offers." Warning don't: "Use warning for “under construction” or “coming soon” messaging." Info don't: "Use info to share statuses or messages that require immediate attention from the merchant." Critical don't: "Use critical for less important, non-actionable or contradicting messaging."
- **Corroboration:** GOV.UK colour: "Only use the variables in the context they're designed for." with the example of using `govuk-colour("red")` rather than `govuk-functional-colour("error")` for a plain red. Carbon data-vis alert palette: "Alert colors are used to reflect status." USWDS state tokens divide state colour into role families `info`, `error`, `warning`, `success`, `emergency`, `disabled`.
- **Measurable?** Partly → recorded as `count`: find the error/success colour from role=alert / invalid-field messages, count other painted elements in that colour that are not error/success/destructive. What counts as "destructive" needs a person on edge cases.
- **Evidence:** `author` (design-system guidance, no study cited).

### from-tokens-not-hex
- **Claim:** "Do not copy the specific hexadecimal (hex) colour values."
- **Source:** GOV.UK Design System, Colour, https://design-system.service.gov.uk/styles/colour/ — raw `src/styles/colour/index.md`, `grep -F` exact. The next sentence in the source gives the example with code formatting: use `govuk-functional-colour("brand")` rather than `#1d70b8`.
- **Corroboration:** Carbon overview, Tokens: "They are used in place of hard coded values, like hex codes." (wrapped across lines; verified on collapsed text). USWDS overview: "**Use USWDS color tokens, and avoid custom colors whenever possible.**" (bold in source). Polaris ships a stylelint rule `color-no-hex` (file `tools/stylelint-polaris/rules/color-color-no-hex.mdx` fetched).
- **Measurable?** Yes: compare painted computed colours against values of custom properties on `:root`/theme selectors; count strays and near-duplicates (ΔE < 2). Limitation: a project that uses Sass variables compiled to literals has no custom properties to compare against; then the near-duplicate count is the only signal.
- **Evidence:** `author`.

### few-families-in-proportion
- **Claim:** "about 60% of your site’s color would be the primary color family, about 30% would be the secondary color family, and about 10% would be the accent color families" (curly apostrophe as in source).
- **Source:** USWDS Theme color tokens, https://designsystem.digital.gov/design-tokens/color/theme-tokens/ — raw `theme-tokens.md`, `grep -F` exact. The sentence begins with bold role names (`**Primary**, **secondary**, and **accent** colors can be thought of as falling into a proportional 60/30/10 relationship:`); the quote is the unformatted clause after the colon. The source adds: "Note that these proportions are for non-base colors. In many cases, the neutral base text color will be the predominant tone on your site."
- **Corroboration:** Carbon overview: "The core blue family serves as the primary action color across all IBM products and experiences. Additional colors are used sparingly and purposefully." USWDS overview: "**Start in black and white.** … Then, introduce color to support that message."
- **Measurable?** Partly → `question`: hue-bin a screenshot's saturated pixels by area. The 60/30/10 split is a heuristic, not a threshold anyone validated, so it is not a count.
- **Evidence:** `author`; the 60/30/10 rule is interior-design folklore that USWDS adopts, with no study cited.
- **Overlap:** `craft.black-and-white-first-limit-hues`.

### one-action-colour-apart-from-status
- **Claim:** "The core blue family serves as the primary action color across all IBM products and experiences. Additional colors are used sparingly and purposefully."
- **Source:** Carbon, Color overview, https://carbondesignsystem.com/elements/color/overview/ — raw `overview.mdx`, verified on collapsed text (wraps across two lines).
- **Corroboration:** Polaris Using color: "Link color is used exclusively for text links that appear in lines and paragraphs of text." Polaris Palettes and roles: "Brand is used to pull additional focus on main actions in the UI." and Success don't (above).
- **Counter-evidence kept as an exception:** Primer's colour-roles table maps `success` to "Primary buttons, positive messaging and successful states" and `accent` to "Links, selected, active, and focus states, and neutral information". GitHub's primary button shares the success green, so the rule "action colour ≠ status colour" is not universal; what the sources share is that the mapping is fixed and stated.
- **Measurable?** Yes: hue of body links and primary buttons vs the error/warning/success colours; count of static text in link colour.
- **Evidence:** `author`.
- **Overlap:** `canon.gestalt-similarity` (one link colour only for links).

### controls-and-graphics-3-to-1
- **Claim:** "Unless the control is inactive, any visual information provided that is necessary for a user to identify that a control is present and how to operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
- **Source:** W3C, Understanding 1.4.11, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html — raw `understanding/21/non-text-contrast.html`; the sentence wraps across lines in the HTML, verified on collapsed text.
- **Corroboration:** Primer color considerations: "Borders communicate **the boundaries of an input**, and are considered non-text contrast." and "Inputs without visible borders must use their background color instead." Primer accessibility lists "3:1 for UI elements and graphics" and "No contrast requirement for decorative and disabled elements". Carbon accessibility: "Visual information used to indicate states and boundaries of UI components must have a contrast ratio of 3:1 against adjacent colors." Polaris Using color, Icon: "These colors are tailored to meet color contrast ratios for interactive elements that do not include text."
- **Exceptions (WCAG):** inactive controls; a control with visible text needs no contrasting boundary ("Having a visual boundary indicating the hit area is only required when there is no other visual way to identify the presence of the control"); unrounded threshold ("2.999:1 would not meet the 3:1 threshold"); thin lines may anti-alias below nominal.
- **Measurable?** Yes: per-control contrast of border/fill/icon vs the background it sits on. No uxcli probe counts this today (`page.contrast` delegates to axe `color-contrast`, which is text only), so no `probe` is set.
- **Evidence:** standard (WCAG AA) — `author`.

### focus-ring-contrasts-with-its-surroundings
- **Claim:** "In combination with 2.4.7 Focus Visible, the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused, except where the appearance of the component is determined by the user agent and not modified by the author."
- **Source:** W3C, Understanding 1.4.11, section "Relationship with Focus Visible" — raw `understanding/21/non-text-contrast.html` line 119; the source has `<a>` around "2.4.7 Focus Visible" and `<em>` around "must", verified on tag-stripped text.
- **Detail (source):** the outer yellow `#FFFF00` ring on white fails; an outer green `#008000` passes but "it is not a good indicator unless it is very thick"; a focus border that changes hue inside the component must contrast with the component; "this success criterion does not directly compare the focused and unfocused states of a control".
- **Measurable?** Yes, as an extension of `page.focus-visible`'s pixel diff: take the changed pixels and their adjacent unchanged pixels and require 3:1. Not set as `probe` because `page.focus-visible` counts presence only.
- **Evidence:** standard — `author`.
- **Overlap:** related to but not the same as `modern.focus-is-visible-and-unobscured` (visibility and obscuring, not contrast), so not listed in `agrees`.

### mode-aware-tokens-in-every-theme
- **Claim:** "Base color tokens don't respect color modes and should never be used directly in code or design."
- **Source:** Primer UI color system, https://primer.style/foundations/color/overview — raw `content/foundations/color/overview.mdx`, `grep -F` exact. Same file: "Every pattern in Primer is built to work across all color modes out of the box."
- **Corroboration:** Primer color considerations, Default theme: the default Day and Night themes "**must both** satisfy WCAG criteria for color-related concerns" (bold in source; quoted only here, not in the JSON). Non-default themes: deliberately low-contrast sub-themes such as Dark Dimmed need not meet contrast provided the defaults do (WCAG technique G174). Forced colours: "Forced color mode content presentation **should not** be overridden to satisfy aesthetic desires." Carbon overview: "In the dark themes, layers become one step lighter with each added layer." and the do/don't caption (JSX attribute, raw grep) "Do not apply components that are darker than the background unless using high-contrast mode." Carbon tokens make "possible color functionalities like inline theming and light or dark mode".
- **Measurable?** Yes: emulate `prefers-color-scheme` light and dark, run text and non-text contrast in each, count mode-only failures and elements whose background flipped while text did not.
- **Evidence:** `author`.

### chart-palette-fits-the-data
- **Claim:** "Categorical (or qualitative) palettes are best when you want to distinguish discrete categories of data that do not have an inherent correlation."
- **Source:** Carbon, Data visualization color palettes, https://carbondesignsystem.com/data-visualization/color-palettes/ — raw `index.mdx`, verified on collapsed text.
- **Prefers / forbids (grep-verified):** Carbon: "In light themes, the darkest color denotes the largest values. In dark themes, the lightest color denotes the largest values." and "Never use a gradient in place of a sequential palette." Polaris data visualizations: "All bars should be the same color." USWDS data visualizations: "Simplify color selection and don't reuse colors for different variables or within a particular variable." Primer: "Sometimes there’s also meaning that is being conveyed with color that represents a state (error, success, critical), so in those cases, it can make sense to change the colors based on the semantic intent."
- **Measurable?** Partly → `question`: whether data are categorical or ordered is a reading of the data, not of the pixels.
- **Evidence:** `author`.
- **Overlap:** loosely `canon.tufte-graphical-integrity` (one visual dimension per data dimension).

### chart-marks-readable-without-hue
- **Claim:** "Chart / visualization marks need to be at a 3:1 ratio with the background."
- **Source:** Primer, Data visualization, https://primer.style/ui-patterns/data-visualization — raw `content/ui-patterns/data-visualization.mdx`, `grep -F` exact. Same section: "Stacked bar charts and progress bars should have a high contrast divider line between each segment." and the note that "blue and purple look visually similar to some colorblind users".
- **Corroboration:** Primer accessibility: "For charts and graphs you can position the labels on top or close to each section. You can also use patterns to distinguish" (sentence continues on the next line: "different parts."). USWDS data visualizations: "If high contrast color selection is not an option, the usage of discrete dash or datapoint styles distinguishes lines without relying upon color." Polaris: "Use colors that can be distinguished from each other to support merchants with different forms of" (link follows). WCAG 1.4.11 Graphical Objects: "each line in a graph" is a graphical object.
- **Measurable?** Yes: mark-vs-plot-background contrast; presence of direct labels / dash / marker variation in multi-series charts. Canvas charts can only be read from pixels.
- **Evidence:** `author`.

## Dropped

None for lack of a verifiable quote. Considered and not made into viewpoints: USWDS "magic number" grade differences (a method for picking accessible pairs inside USWDS, not a rule about a rendered page; text contrast is already `page.contrast`); USWDS readability notes on avoiding pure black text (already `craft.greys-dont-have-to-be-grey-never-use-black`); Polaris "Use opacity or any other means to communicate disabled states." (a don't — Polaris-specific disabled scheme, too narrow); Polaris on-fill text pairing (system-internal).
