# Lens research — practitioner craft

Researched 2026-09-29 for uxcli "lenses". School: the practitioner-craft tradition — developers-turned-designers who teach *tactics, not talent* (Wathan/Schoger, Erik Kennedy) plus the critique of decorative UI (Paul Adams) and Growth.Design's psychology-principle catalogue. Every URL below was fetched in this session unless marked otherwise.

## Sources fetched

| source | author | URL (actually fetched) | what it is |
|---|---|---|---|
| Refactoring UI — landing page with full table of contents + the "Use fewer borders" tactic | Adam Wathan & Steve Schoger | https://www.refactoringui.com/ | book sales page; lists all 50 chapter titles, gives one worked tactic |
| "Practical Solutions to Common UI Design Problems", CSS Day 2019 — attendee notes | Steve Schoger (notes by ynotdraw) | https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b | talk notes (14 tips; same material as the book) |
| "The Little Details of UI Design", Laracon Online 2018 — attendee notes | Steve Schoger (notes by m1guelpf) | https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md | talk notes (type scale, spacing scale, button hierarchy, colour) |
| "Little UI Details" tweets, compiled (30 tweets, verbatim with tweet URLs) | Steve Schoger via DigitalSynopsis | https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ | compilation of tweets, quoted verbatim |
| "Little UI Details" tweets, compiled (22 tweets, verbatim) | Steve Schoger via GIGAZINE | https://gigazine.net/gsc_news/en/20170911-little-ui-details/ | compilation of tweets, quoted verbatim |
| 7 Rules for Creating Gorgeous UI — Part 1 (2024 update) | Erik D. Kennedy | https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html | article |
| 7 Rules for Creating Gorgeous UI — Part 2 (2024 update) | Erik D. Kennedy | https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html | article |
| 4 Rules for Intuitive UX | Erik D. Kennedy | https://www.learnui.design/blog/4-rules-intuitive-ux.html | article |
| 3 Pro Tips on Alignment | Erik D. Kennedy | https://www.learnui.design/blog/3-pro-tips-on-alignment.html | article |
| Why Beginning Designers Don't Need Grids, Type Scales, or Color Theory | Erik D. Kennedy | https://www.learnui.design/blog/why-beginning-designers-dont-need-grids-type-scales-color-theory.html | article |
| The Responsive Website Font Size Guidelines | Erik D. Kennedy | https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html | article (chapter of the font-size guide) |
| Font Sizes in UI Design: Principles & Resources | Erik D. Kennedy | https://www.learnui.design/blog/font-size-principles-resources.html | article (chapter) |
| Font Sizes in UI Design: The Complete Guide (intro) | Erik D. Kennedy | https://www.learnui.design/blog/ultimate-guide-font-sizes-ui-design.html | article (intro chapter) |
| 100 Things a UX/UI Designer Should Know | Erik D. Kennedy | https://www.learnui.design/blog/100-things-ux-ui-designer-know.html | list article |
| 37 Easy Ways to Spice Up Your UI Designs | Anthony Hobday (guest on learnui.design) | https://www.learnui.design/blog/spice-up-designs.html | article |
| Learn UI Design blog index | Erik D. Kennedy | https://www.learnui.design/blog/ | index (used to locate articles) |
| The dribbblisation of design | Paul Adams (Intercom) | https://www.intercom.com/blog/the-dribbblisation-of-design/ | essay (2013) |
| Psychology principles ("106 Cognitive Biases & Principles That Affect Your UX") | Growth.Design (Dan Benoni, Louis-Xavier Lavallée) | https://growth.design/psychology | reference catalogue |
| Case-studies index | Growth.Design | https://growth.design/case-studies | index (fetched via WebFetch summary only; article reader could not extract it) |
| Coder's Guide to Design (pointer to the "Little UI Details" Twitter moment) | alx-andru | https://github.com/alx-andru/coders-guide-to-design | curated list (used only to confirm the moment URL https://twitter.com/i/moments/880688233641848832, which was not fetched) |

**Fetch failures (claims from these are marked unverified):**
- https://medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886 — 403 (Cloudflare challenge) via three fetchers; mirrors freedium.cfd (DNS) and scribe.rip (404) also failed. Not cited. Its tips overlap the fetched CSS Day / Laracon notes, which are cited instead.
- The Refactoring UI book PDF itself is paid and was not read; chapter *titles* come from the public TOC on refactoringui.com, chapter *content* from Schoger's two talks, which present the same material.
- Steve Schoger's tweets were read through two compilations, not on x.com directly (the x.com status pages were not fetched).

## Viewpoints

### fewer-borders
- **Claim:** "Use fewer borders. Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered. Instead, try adding a box shadow, using contrasting background colors, or simply adding more space between elements." (Wathan & Schoger). Tweet: "Too many borders can make a design look really busy. Here's a few ideas that are a bit more subtle" (Schoger, 16 Aug 2017).
- **Source:** Wathan & Schoger, refactoringui.com landing page, https://www.refactoringui.com/ ; Schoger tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; CSS Day tip #11 "use fewer borders … Use zebra striping instead", https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; Laracon 2018 notes "Remove borders. Remove the panel that makes the nav 'pop'", https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md
- **Prefers / forbids:** Prefers separating groups by space, a background-colour shift, a shadow, or zebra striping. Forbids a 1px border as the default grouping device; forbids a panel around a nav that only needs to recede; forbids table rows separated by borders when striping would do.
- **Measurable?** yes. For every text node, count ancestors (up to `<body>`) whose computed style has a visible `border` (width > 0 and colour not transparent), a non-`none` `box-shadow`, or an `outline`; report the max nesting depth and the count of bordered boxes per viewport. Must-fail fixture: a card with `border:1px solid` inside a section with `border:1px solid` inside a page container with `border:1px solid` (depth 3) whose only job is grouping. Must-pass twin: same DOM, outer two borders replaced by `margin-top:32px` and a `background:#f7f7f8` band; only the card keeps its border (depth 1). A machine agrees on depth without judging beauty.
- **Exceptions:** The source keeps borders where they do work: form inputs and the one object a person acts on; "Keylines are not only great for dividing content but also making disconnected content feel more connected" (Schoger tweet, 5 Jul 2017). Hobday's "37 Ways" treats decorative borders (dotted, gradient) as legitimate style once the count is low.

### separation-order-space-then-lines-then-boxes
- **Claim:** The lightest separator that works wins: more space, then a background shift/shadow, then a border — the ordering implied by the fewer-borders tactic. Kennedy's "Double your whitespace" states the first step: "Put space between your lines. Put space between your elements. Put space between your groups of elements."
- **Source:** Wathan & Schoger, https://www.refactoringui.com/ ; Kennedy, Rule 3, https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html . The exact phrasing "whitespace before lines before boxes" attributed to Erik Kennedy was **not found** on any fetched learnui.design page — see reliability notes.
- **Prefers / forbids:** Prefers whitespace as the default separator; a keyline or background band when space alone fails; a box only for the object that is acted on. Forbids reaching for a card/border first.
- **Measurable?** partly. Count separators used between sibling groups: gap ≥ 2× the inner gap (space), `<hr>`/border-bottom (line), bordered/shadowed wrapper (box). Must-fail: three sibling groups each wrapped in a bordered box with 8px between boxes and 8px inside them (box used where space would do, and no proximity contrast). Must-pass twin: same groups, no wrappers, 8px inside and 32px between. What a machine cannot decide is whether space "worked"; it can only report which device was used and the inner/outer gap ratio.
- **Exceptions:** Dense data (tables, spreadsheets) where Schoger himself uses zebra stripes or keylines; interactive cards that are the unit of action.

### hierarchy-is-everything-squint-test
- **Claim:** "If you squint your eyes, the Most Important Thing should catch your eye first – and the least important elements should catch your eye last." (Kennedy). Refactoring UI's second section is titled "Hierarchy is Everything" with the chapter "Not all elements are equal".
- **Source:** Kennedy, "4 Rules for Intuitive UX", rule 3, https://www.learnui.design/blog/4-rules-intuitive-ux.html ; Wathan & Schoger TOC, https://www.refactoringui.com/
- **Prefers / forbids:** Prefers one dominant element per screen; "Emphasize the most-commonly used functionality … Deemphasize, hide, or remove the less commonly used". Forbids a primary action that is "gray and unnoticeable" beside a bigger, more visible "Help"; forbids two identical grey buttons where one is the main action.
- **Measurable?** partly. Given a declared primary action (journey/commitment names it), compute a visual-weight score for every interactive element: area × contrast-against-background × font-weight factor; the declared primary must rank first. Must-fail: `Submit` as a grey 12px text button, `Help` as a 16px filled blue button. Must-pass twin: `Submit` filled brand-colour 16px, `Help` a plain text link. Needs the actor's intent as input; without a declared MIT the probe cannot say what should win, only that nothing does (all buttons within 10% weight of each other).
- **Exceptions:** Kennedy: "Page titles are the only element to style all-out up-pop"; a page whose purpose is browsing (a gallery) may legitimately have no single MIT.

### size-isnt-everything-use-weight-and-colour
- **Claim:** "Font size isn't always the best way to emphasize or de-emphasize text, try using color and font weight instead" (Schoger, 19 Sep 2017); "Along with size and weight, using color and contrast is a great way to create typographic hierarchy" (2 Jun 2017). Book chapter: "Size isn't everything".
- **Source:** Schoger tweets via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ and https://gigazine.net/gsc_news/en/20170911-little-ui-details/ ; TOC at https://www.refactoringui.com/ ; Laracon notes "You can probably get away with three shades of grey", https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md
- **Prefers / forbids:** Prefers a hierarchy built from 2–3 text colours (primary/secondary/tertiary grey) and 2 weights, sizes only for real levels. Forbids using a distinct font-size for every level of importance; forbids labels rendered as big bold headings ("Headings don't need to be big and bold … Small, bold, uppercase text with softer color", CSS Day).
- **Measurable?** yes. Count distinct computed `color` values on text and distinct `font-weight` values; check that secondary text differs from primary by colour or weight, not only by size. Must-fail: six text levels realised as six font-sizes, all `#000`, all 400. Must-pass twin: three sizes, three greys, two weights. A machine can count; it cannot judge whether the chosen greys read well.
- **Exceptions:** Display/marketing headlines where size *is* the hierarchy (Kennedy: headline "30-50px", "underemphasizing headlines" is a common mistake).

### de-emphasize-to-emphasize-up-pop-down-pop
- **Claim:** "If an element needs emphasis, apply BOTH up-pop and down-pop styles — but slightly MORE up-pop." (Kennedy). Book chapter: "De-emphasize to emphasize".
- **Source:** Kennedy, Rule 5, https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html ; TOC https://www.refactoringui.com/ ; Schoger: "If you want text of different sizes to *feel* like the same weight, make larger text thinner and smaller text bolder" (28 Mar 2018) via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **Prefers / forbids:** Prefers big numbers in a light weight and lower-contrast colour, small labels uppercase and bold; prefers making a competitor quieter rather than the hero louder. Forbids stacking every up-pop property (big + bold + bright + uppercase) on non-title elements.
- **Measurable?** partly. Flag text elements ≥ 2× body size that are also `font-weight ≥ 700` *and* full-contrast *and* uppercase, when they are not the page `<h1>`. Must-fail: a stat card whose number is 48px/800/#000/uppercase label 18px/800/#000. Must-pass twin: number 48px/300/#334, label 12px/700/uppercase/#777 with letter-spacing. Taste remains in "how much more".
- **Exceptions:** Kennedy: the page title may be all-out up-pop.

### dont-use-grey-text-on-coloured-backgrounds
- **Claim:** "Pure grey text always looks 'off' on a colored background. A quick fix is to saturate your text with a bit of the background hue." (Schoger, 12 Jun 2017). CSS Day: "Don't reduce opacity - it'll look washed out. Better approach is to hand-pick a color based on the background color."
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; CSS Day tip #2, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; TOC chapter "Don't use grey text on colored backgrounds", https://www.refactoringui.com/
- **Prefers / forbids:** Prefers a text colour that shares the background hue with reduced contrast, or a rotated hue for perceived brightness. Forbids neutral grey (`#999`-style, saturation ≈ 0) text on a saturated background; forbids `opacity < 1` or `rgba(255,255,255,.6)` as the way to soften text on colour.
- **Measurable?** yes. For each text node whose effective background has HSL saturation > 30%: fail if text colour saturation < 5% and lightness between 20–80% (a true grey), or if text `opacity < 1` / alpha < 1 while the background is saturated. Must-fail: `background:#2563eb; color:#9ca3af`. Must-pass twin: `background:#2563eb; color:#bfdbfe` (same hue, higher lightness). Deterministic from computed styles.
- **Exceptions:** White (`lightness ≈ 100%`) and near-black text are not "grey" for this rule; disabled states are a separate convention the source does not address.

### greys-dont-have-to-be-grey-never-use-black
- **Claim:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel." (Schoger, 19 Mar 2018). Kennedy #17: "Why painters never use black — Because black rarely appears in the real world. Darker colors usually are usually saturated with some color."
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; CSS Day tip #14 "pure greys can make a UI look dull and unnatural", https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; Kennedy, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **Prefers / forbids:** Prefers a grey scale tinted toward the brand hue, saturation raised at the light and dark ends ("increase saturation for the lighter and darker shades to maintain a consistent temperature"). Forbids `#000` for text and pure 0-saturation greys as the whole neutral palette.
- **Measurable?** partly. Count text/border/background colours with saturation exactly 0 and lightness < 15% (pure black) or the share of neutral swatches with saturation 0. Must-fail: `color:#000` body text on `#fff`. Must-pass twin: `color:#1f2937`. Whether a tint is "warm enough" is taste; presence of #000 is not.
- **Exceptions:** CSS Day: "it doesn't always work, but it's worth a trial" (Laracon notes); high-contrast/accessibility modes and print.

### start-with-too-much-whitespace
- **Claim:** "To make UI that looks designed, add a lot of breathing room. … Sometimes a ridiculous amount." (Kennedy, Rule 3). Schoger: "Largest mistake, not having enough white space. Start with a ton of white space and then remove it until you're happy with it." Book chapter: "Start with too much white space".
- **Source:** Kennedy, https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html ; CSS Day tip #4, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers padding at least equal to the text's own height; Kennedy's worked example: "The vertical space between the menu items is fully *twice* the height of the text itself", "15px space between the word 'PLAYLISTS' and its own underline. That's more than the cap height". Forbids browser-default spacing ("everything is smashed towards the top").
- **Measurable?** partly. Ratio of vertical padding to font-size on list items/nav items/buttons; ratio of gap-between-groups to gap-within-group. Must-fail: nav links with `padding:2px 4px` at 14px, sections with `margin:0`. Must-pass twin: `padding:12px 16px`, sections `margin-top:48px`. The threshold ("enough") is a commitment the project must sign; the source gives ratios (≥1× text height inside, ≥2× between items) as a floor.
- **Exceptions:** Dense professional tools ("interaction-heavy pages" in Kennedy's font guide) legitimately compress; the source still asks for *consistent* spacing there.

### spacing-and-sizing-system
- **Claim:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices" (Schoger, 13 Jul 2017). Laracon: "Use a consistent spacing scale. (0.375rem 0.75rem 1rem 1.25rem...)". Book chapter: "Establish a spacing and sizing system"; "Avoid ambiguous spacing".
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; Laracon notes https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers every margin/padding/gap drawn from one scale (multiples of 4 or a Tailwind-like ladder); prefers space *between* groups clearly larger than space *within* them (ambiguous spacing = equal gaps that hide grouping). Forbids one-off values (13px, 27px) and equal gaps across a group boundary.
- **Measurable?** yes. Collect all computed `margin-*`, `padding-*`, `gap` values > 0; report the set of distinct values and how many are off a 4px grid; for each list of siblings, compare the gap between a label and its field to the gap between one field pair and the next. Must-fail: paddings {7, 11, 13, 18, 27}; label→input 12px and input→next label 12px (ambiguous). Must-pass twin: paddings {8, 12, 16, 24, 32}; label→input 4px, field→field 24px.
- **Exceptions:** Optical adjustments (icons, hanging punctuation) intentionally sit off-scale by a pixel or two.

### grids-are-overrated-content-dictates-width
- **Claim:** "The hassle with grids is that they force the content into a specific width. Content should always dictate it's own width … and the layout should follow suit." (Kennedy). Book chapter: "Grids are overrated"; "Relative sizing doesn't scale"; "You don't have to fill the whole screen".
- **Source:** Kennedy, https://www.learnui.design/blog/why-beginning-designers-dont-need-grids-type-scales-color-theory.html ; Kennedy #20–21, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** On mobile prefers three rulers — "16px from left, Center, 16px from right" — and fixed content sizes (a 72px thumbnail stays 72px). Forbids stretching every element 12.5% wider because the phone got wider; forbids percentage-sized components that shrink below their content's need.
- **Measurable?** yes for the gutter part: at 360–414px viewport, every content edge should sit at 16px from the viewport edge (or a consistent gutter) and nothing should overflow horizontally. Must-fail: page with `padding:0` at 375px whose text touches the edge, or a `width:8.33%` column producing a 26px-wide cell. Must-pass twin: 16px gutters, fixed 72px thumbnail, text fills the rest. Whether a desktop layout "should" fill the screen is taste.
- **Exceptions:** Kennedy #20: "Save strict grids for posters and websites in which the artistry of the composition matters more than the requirements of the information displayed."

### type-scale-few-font-sizes
- **Claim:** "One of the single biggest typographical mistakes from beginning UI designers is to use *way* too many font sizes. Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total." (Kennedy). Laracon: "Typographic scale. Create a hierarchy. Classic (in pixels): 12 14 16 18 21 24 36 48 60 72. Tailwind: 12 14 16 18 20 24 30 36 48". Book chapter: "Establish a type scale".
- **Source:** Kennedy, https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html ; Laracon notes https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers ~4 sizes (header, default, secondary ≈ default − 2px, one wildcard) drawn from a fixed scale; the default size reused for body, menus, lists, controls. Forbids a new size per component; Kennedy also forbids *strict* modular/golden-ratio scales on responsive pages ("Holy honkin' headlines").
- **Measurable?** yes. Count distinct computed `font-size` values on visible text per viewport; count values not in the declared scale. Must-fail: 11 distinct sizes {11,12,13,14,15,16,17,18,19,22,26}. Must-pass twin: {12,14,16,24} — 4 values, all on the scale. Deterministic.
- **Exceptions:** Kennedy: sizes need to be *distinguishable*, so "adjust your font size as needed – a few points here or there for small text, but many sizes up or down when it comes to larger text"; marketing pages may add a display size.

### body-16px-line-height-1-5
- **Claim:** "If in doubt, 16px font with 1.5 line height is pretty good safe for body copy." (Schoger, 1 Jun 2017). Kennedy: mobile body "about 16-20px", "start with size 17"; "Use a text input font size of at least 16px" or iOS zooms the field.
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; Kennedy, https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html ; Kennedy #43 "default text size … Web browsers: 16px. iOS: 17pt. Material Design: 16px", https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **Prefers / forbids:** Prefers body ≥ 16px, secondary ≈ 2px smaller ("13px or 14px"), inputs ≥ 16px on mobile, desktop text-heavy 18–24px. Forbids body text < 16px on phones and inputs < 16px on iOS.
- **Measurable?** yes. Computed `font-size` of paragraph text and of `<input>/<textarea>/<select>` at a 375px viewport; `line-height / font-size` for paragraphs. Must-fail: `p{font-size:13px;line-height:1.1}` and `input{font-size:14px}`. Must-pass twin: `p{font-size:16px;line-height:1.5} input{font-size:16px}`.
- **Exceptions:** Kennedy: "interaction-heavy" desktop pages may go to 14px; captions sit 2px under body by design.

### line-height-tightens-as-text-grows
- **Claim:** "Using the same line-height for all text is a very subtle but common mistake. 1.5 may work great for body copy, but as text gets larger, your line-height should get tighter." (Schoger, 27 Feb 2018). Kennedy #99: "If you make a line longer (as measured in characters), then it needs more line height." Book chapter: "Line-height is proportional".
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; Kennedy, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers headings at ~1.1–1.25, body at ~1.5, longer measures with more leading. Forbids a single inherited `line-height:1.5` on 40px headlines; forbids `line-height:1` on paragraphs.
- **Measurable?** yes. For each text element compute `line-height / font-size`; require ratio(headline ≥ 2× body) < ratio(body). Must-fail: `h1{font-size:40px;line-height:1.6} p{line-height:1.6}`. Must-pass twin: `h1{line-height:1.15} p{line-height:1.5}`.
- **Exceptions:** Single-line headings where line-height is invisible; the source says "there isn't a one-size-fits-all" (Laracon), so the probe should assert direction, not one number.

### line-length-50-75-characters
- **Claim:** "Body text should have 50-75 characters per line." (Kennedy). Book chapter: "Keep your line length in check".
- **Source:** Kennedy, https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html ; Kennedy #18, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers a capped measure for paragraph text (`max-width` in `ch`); forbids paragraphs stretched across a 1440px viewport ("more than 75 characters per line, readers can find it difficult to track").
- **Measurable?** yes. For each `<p>` with ≥ 3 rendered lines, estimate characters per line = element width / average glyph advance (measure with a canvas or Range rects). Must-fail: a `<p>` at 1200px wide, 16px type ≈ 150 cpl. Must-pass twin: `max-width:65ch`. Kennedy also says mobile may drop below 50 when "you have less than 30 characters per line" it is too narrow — so the floor matters too.
- **Exceptions:** Interaction-heavy pages (tables, forms) are not paragraph text; short blurbs under 3 lines are not measured.

### letter-spacing-for-all-caps
- **Claim:** "All-caps can sometimes be difficult to read. Consider using letter-spacing to give your text a little more room to breathe" (Schoger, 31 May 2017). Laracon: "Widen letter-spacing for all-caps". Book chapter: "Use letter-spacing effectively".
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; Laracon notes https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers `text-transform:uppercase` paired with positive `letter-spacing` (≈ 0.05em) and a slightly smaller size; prefers slightly *negative* tracking on large bold headlines (Kennedy: "I would add a slight bit of negative letter-spacing. Here's -1%"). Forbids uppercase labels at `letter-spacing:normal`.
- **Measurable?** yes. For text with `text-transform:uppercase` (or all-caps content ≥ 4 letters): fail if computed `letter-spacing` is `normal`/0. Must-fail: `.label{text-transform:uppercase}`. Must-pass twin: `.label{text-transform:uppercase;letter-spacing:.05em}`.
- **Exceptions:** Logos/wordmarks; single-letter avatars; monospace text.

### balance-weight-and-contrast-icons-lighter
- **Claim:** "If I am using icons that have more weight than the text, I typically make the icons slightly lighter than the text for inactive states" (Schoger, 8 Jun 2017). CSS Day: "To reduce contrast, give icon a softer color. Works like a counter balance." Book chapter: "Balance weight and contrast".
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; CSS Day tip #5, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; Laracon "Use contrast to create balance. (Make icons lighter than text)", https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md
- **Prefers / forbids:** Prefers solid icons beside text in a lighter grey than the text; prefers a "consistent icon set" and stroke weight (Laracon; Kennedy #41). Forbids icons at 100% black beside 70% grey text; forbids mixing outline and filled icon families in one bar.
- **Measurable?** partly. For each inline `svg`/icon element adjacent to text, compare fill/stroke luminance-contrast against the text's; icons should have ≤ the text's contrast. Must-fail: nav items with text `#374151` and icons `#000`. Must-pass twin: icons `#9ca3af`. Detecting "heavier" icon families is not reliable from the DOM.
- **Exceptions:** Active/selected state, where the icon takes the brand colour; icon-only buttons (nothing to balance against).

### light-comes-from-the-sky-shadow-offset
- **Claim:** "Light comes from the sky so frequently and consistently that for it to come from below actually looks freaky." (Kennedy, Rule 1). "Giving your box shadows a slight, vertical offset helps to make them look more natural." (Schoger, 20 Jun 2017). CSS Day: "Shadows have two parts — ambient light … direct light … tighter and darker, lower blur radius … larger, softer, with a more vertical offset"; example `box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`. Book chapters: "Emulate a light source", "Shadows can have two parts".
- **Source:** Kennedy, https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html ; tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; CSS Day tip #8, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers `box-shadow` with `offset-y > 0`, `offset-x ≈ 0`; inset elements (inputs, pressed buttons, tracks) darker at top; raised elements lighter at top. Forbids negative y-offsets (lit from below), heavy x-offsets, and one huge unblurred shadow.
- **Measurable?** yes. Parse every computed `box-shadow`; fail on any non-inset shadow with `offset-y < 0` or `|offset-x| > offset-y`. Must-fail: `box-shadow: 0 -4px 8px rgba(0,0,0,.2)`. Must-pass twin: `box-shadow: 0 4px 8px rgba(0,0,0,.2)`. Deterministic.
- **Exceptions:** Kennedy's "flat design" era: no shadows at all is allowed ("flatty"); a top bar's shadow *below* it is still y-positive; sticky footers casting upward are a known trade-off the source does not bless but real products use.

### shadows-convey-elevation-ladder
- **Claim:** "use multiple shadows, larger shadow, closer it feels to the user. Far left, small shadow, closer to background of the page (button, inputs). Second, further (dropdown menus, small panels). Third (large panels). Fourth and Fifth for modals" (Schoger, CSS Day). Book chapter: "Use shadows to convey elevation".
- **Source:** CSS Day tip #8, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers a fixed ladder of ~5 shadow tokens mapped to element kinds (button < dropdown < panel < modal). Forbids a modal with a smaller shadow than a card, and ad-hoc shadows per component.
- **Measurable?** yes. Collect distinct `box-shadow` strings; expect ≤ 5–6 distinct non-inset values; rank by blur+offset; assert `[role=dialog]`/modal shadow ranks above card/button shadows. Must-fail: 14 distinct shadows; modal `0 1px 2px`, card `0 20px 40px`. Must-pass twin: 4 tokens, modal on the top rung.
- **Exceptions:** Flat systems with no shadows; elevation carried by colour instead (CSS Day tip #9 "lighter objects feel closer").

### black-and-white-first-limit-hues
- **Claim:** "Design black and white first … Add color last, and even then, only with purpose. … Having too many colors in too many places is a really easy way to screw up clean/simple." (Kennedy, Rule 2). "Using multiple colors from one or two base hues is the most reliable way to accentuate and neutralize elements without making the design messy."
- **Source:** Kennedy, https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html ; Laracon "limit your choices", https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md ; Kennedy #44 "How to create an entire UI using just one color", https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **Prefers / forbids:** Prefers greyscale + one accent hue (or two), variations by saturation/brightness in HSB/HSL; forbids colour-theory "complementary" palettes as UI palettes; forbids a distinct hue per section.
- **Measurable?** partly. Cluster all computed colours with saturation > 25% by hue (±15°); count hue clusters, excluding semantic states (error/success/warning) if the project declares them. Must-fail: 7 hue clusters on a settings screen (blue nav, green cards, purple buttons, orange tags…). Must-pass twin: 1 brand hue + neutrals + declared red for errors. Purpose of a colour is not machine-decidable.
- **Exceptions:** Kennedy names "sporty, flashy, cartoony" brands as needing a colour-fluent designer; data visualisation palettes (Kennedy's own dataviz post) are exempt.

### align-with-readability-in-mind
- **Claim:** "Aligning text is an easy way to clean up your design and make your content much more scannable." (Schoger, 15 Jun 2017). CSS Day: "Dollar values and dates right-aligned, then decimal places are in columns; `font-feature-settings: "tnum"`". Kennedy #23: right-align "numbers that are comparable digit-for-digit (e.g. prices or counts – not ID numbers, ZIP codes)". Kennedy tip 1: "Left-aligned text only aligns weakly on its right side".
- **Source:** tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; CSS Day tip #10, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; Kennedy, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html and https://www.learnui.design/blog/3-pro-tips-on-alignment.html
- **Prefers / forbids:** Prefers few, strong left edges; numeric table columns right-aligned with tabular figures; hanging punctuation/bullets/icons so text edges line up. Forbids a right-aligned image "aligned" to ragged left-aligned text; forbids centred columns of numbers.
- **Measurable?** yes. (a) Number of distinct left-edge x-positions of text blocks within a container, tolerance 1px — fewer is better; (b) for `<td>` cells whose content matches a currency/number pattern: `text-align` must be `right` (or `end`) and `font-variant-numeric`/`font-feature-settings` must include tabular figures. Must-fail: price column `text-align:left`, no tnum; card whose title, body and button sit at x = 24, 27 and 31. Must-pass twin: price column right + tnum; all three at x = 24.
- **Exceptions:** IDs, ZIP codes, phone numbers stay left; centred layouts for < 3 lines (next entry).

### center-text-only-under-three-lines
- **Claim:** "When to center text — Only when there are fewer than 3 lines of it. And, even then, rarely." (Kennedy). Book chapter: "Align with readability in mind".
- **Source:** Kennedy #22, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers left-aligned body text; centring for short headings/empty-state lines only. Forbids centred paragraphs.
- **Measurable?** yes. For every block with `text-align:center`, count rendered line boxes (Range client rects); fail if ≥ 3. Must-fail: a 6-line centred paragraph. Must-pass twin: same text left-aligned, or a 2-line centred subtitle.
- **Exceptions:** Poetry/quotes/hero copy the project explicitly commits to.

### button-hierarchy-one-primary
- **Claim:** "Use button colors to create hierarchy. Use a strong / bold / brand color for the primary action, an outline for secondary actions, and text links for tertiary actions." (Schoger, Laracon). "You want your primary button to stand out much more than your secondary / danger actions." (2 Aug 2017). "A subtle link for negative secondary actions often works better than a big bold button. (Just make sure you have a confirmation step!)" (2 Aug 2017). Book: "Semantics are secondary"; "Not every link needs a color".
- **Source:** Laracon notes https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md ; tweets via https://gigazine.net/gsc_news/en/20170911-little-ui-details/ and https://digitalsynopsis.com/design/useful-ui-ux-design-tips/ ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers exactly one filled brand-colour button per view/dialog, secondaries outlined, tertiaries as text, destructive actions quiet unless they are the primary job. Forbids a "weird green button" competing with the primary; forbids a big red "Delete" beside a small "Save"; forbids every link in brand blue (Laracon: "Go easy on link styles. (dark, bold text is legible and looks clickable)").
- **Measurable?** yes. Classify buttons by computed style: filled (background saturation > 25% and contrast to page > 3:1), outlined (transparent bg + border), text. Fail if a view/dialog contains > 1 filled button of distinct hues, or if the destructive-labelled button (text matches delete/remove/cancel account) is filled while the confirming action is not. Must-fail: dialog with filled blue "Save" and filled red "Delete". Must-pass twin: filled "Save", text-link "Delete".
- **Exceptions:** Segmented/toggle groups; toolbars of equal-weight actions; a page whose only job is the destructive action (then red *is* primary).

### labels-are-a-last-resort
- **Claim:** "Most of the time you don't need a label at all!" (Schoger, CSS Day, on cards showing price/website). Laracon: "Labels are important, but shouldn't compete with values." Book chapter: "Labels are a last resort".
- **Source:** CSS Day tip #12, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; Laracon notes https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers values that carry their own format ("$29", "hello@x.com", "Toronto, ON") with no "Price:" prefix; when a label is needed, small, softer, and subordinate; prefers "think outside the database — your UI doesn't need to map one-to-one with your data's fields and values" (Schoger, 17 May 2018). Forbids "Field: value" dumps where the label outweighs the value.
- **Measurable?** partly. Detect `<dt>/<dd>` pairs and "Word:" prefixes; when present, the label's visual weight (size × weight × contrast) must be ≤ the value's. Must-fail: `<dt>` 16px/700/#000, `<dd>` 14px/400/#666. Must-pass twin: `<dt>` 12px/600/#888 uppercase, `<dd>` 16px/500/#111. Whether the label could be *removed* is judgement.
- **Exceptions:** Forms (inputs need labels — accessibility), and data that is ambiguous without a name (two dates, two counts).

### text-on-images-needs-consistent-contrast
- **Claim:** "There are only a few ways of reliably and beautifully overlaying text on images" — overlay the whole image, text-in-a-box, blur, floor fade, scrim; and "Test it at every screen/window size to make sure it's legible" (Kennedy, Rule 4). Schoger CSS Day tip #1: "Give text consistent contrast — Image hero's need contrast"; tweet: "Desaturated photo + bold color + blend-mode: multiply. Great for hero banners and creating high contrast for text." Book chapter: "Text needs consistent contrast".
- **Source:** Kennedy, https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html ; CSS Day, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; tweet via https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **Prefers / forbids:** Prefers an overlay/gradient/scrim between photo and text; forbids raw text on an un-darkened photo ("The text has to be white … I dare you to find a counter-example") and forbids relying on a photo's out-of-focus area that may move when the image changes.
- **Measurable?** yes (pixels). For text whose stacking context includes an `<img>`/`background-image`, sample the painted pixels behind each glyph box (screenshot), compute min and mean contrast against the text colour; fail if min < 3:1 or if the range across the text box exceeds a spread threshold (inconsistent). Must-fail: white 18px text over a bright sky/sea photo, no overlay. Must-pass twin: same, with `linear-gradient(rgba(0,0,0,.45),…)` overlay. Repeatable per viewport.
- **Exceptions:** Decorative text that is not read (watermarks); Kennedy's "Method 0" when the image is fixed, dark and low-contrast.

### wcag-contrast-and-dont-rely-on-colour-alone
- **Claim:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"; "for headline text — 3:1" (Kennedy). Book chapters: "Accessible doesn't have to mean ugly", "Don't rely on color alone". CSS Day: "White text on red is hard to get high contrast ratio. Make background lighter and use a darker text color"; "Great way to make text more accessible while keeping it colorful" (hue rotation).
- **Source:** Kennedy #48–49, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html ; TOC https://www.refactoringui.com/ ; CSS Day tips #3 and #12, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b
- **Prefers / forbids:** Prefers colored badges as "soft background color with dark text" instead of white-on-saturated; prefers an icon/label alongside a colour state. Forbids white text on yellow/green/red fills that fail 4.5:1; forbids status conveyed by colour only.
- **Measurable?** yes. Standard contrast computation on computed colours (text vs effective background), thresholds 4.5:1 / 3:1 by size; status elements (badges, error text) must carry a non-colour signal (text or icon). Must-fail: `background:#22c55e;color:#fff` 12px badge (≈2.2:1). Must-pass twin: `background:#dcfce7;color:#166534`. Deterministic.
- **Exceptions:** Disabled controls, logos, incidental text — per WCAG itself, which the source defers to.

### supercharge-the-defaults
- **Claim:** "Don't use default radio buttons and checkboxes. Create your own! Add color and make it feel more designed. Dropdown arrow for select can be modified too." (Schoger, CSS Day). Book chapter: "Supercharge the defaults". Laracon: "Use a consistent corner radius (border-radius: 4px)"; "Use a consistent icon set".
- **Source:** CSS Day tip #6, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b ; Laracon notes https://github.com/m1guelpf/laracon-2018/blob/master/laracon-online/steve-schoger.md ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers styled form controls, one corner radius, inputs "40 or 48px" tall (CSS Day tip #4), an off-white input background when the page is white. Forbids browser-default checkbox/radio/select rendering and a mix of radii (2, 4, 8, 999) on the same screen.
- **Measurable?** yes. (a) `appearance` on checkbox/radio/select is `auto` and no `accent-color` set → default rendering; (b) count distinct `border-radius` values on controls/cards (excluding 50%/9999px pills); (c) input `offsetHeight` < 40 at desktop. Must-fail: native checkboxes, radii {2,3,6,10}, inputs 28px tall. Must-pass twin: `accent-color` or custom control, radius {4}, inputs 40px.
- **Exceptions:** Content-heavy sites where native controls are a deliberate accessibility choice; the source is about product UI.

### law-of-locality
- **Claim:** "Put interface elements where they effect change. … when a user wants to make a change to the system, they will unwittingly glance at where that change will happen." (Kennedy). "The temptation is to just put it where we have space for it."
- **Source:** Kennedy, "4 Rules for Intuitive UX", rule 1, https://www.learnui.design/blog/4-rules-intuitive-ux.html ; Kennedy #67, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **Prefers / forbids:** Prefers "Add" at the end (or top) of the list it adds to, anchored if the list can grow off-screen. Forbids stuffing actions into a menu or a floating button "in a place users will never look for it"; forbids copying a FAB because "A Respected Tech Company" did.
- **Measurable?** partly. If the journey declares (control → target region), measure the pixel distance between the control's box and the region's box and whether both are in the viewport at once; fail beyond a signed threshold (e.g. > 400px or off-screen). Must-fail: "New playlist" in a top-right kebab menu, list at the bottom-left. Must-pass twin: the button as the last row of the list. Without the declared pairing the probe cannot know what a control changes.
- **Exceptions:** Kennedy: when the end of the list is unreliable, "the nearest logical place" (top) is fine; global actions belong in global chrome.

### anything-but-dropdowns
- **Claim:** "Any time you feel tempted to use a dropdown, ask yourself if one of these 12 controls is better instead. … dropdowns are pretty much the worst control." (Kennedy). "Picking a date from dropdowns is the worst."
- **Source:** Kennedy, "4 Rules for Intuitive UX", rule 2, https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **Prefers / forbids:** 2 options → segmented button / checkbox / switch; 2–5 → segmented, radios, cards; many → typeahead; near-future dates → calendar; wide-range dates → text input; counts → stepper. Forbids `<select>` for ≤ 5 options, three selects for a date, a 195-country select without search on mobile.
- **Measurable?** yes. For each `<select>`: fail if `options.length ≤ 5` (unless the project commits "rarely changed default"); fail if 2–3 adjacent selects have day/month/year-like options; flag `options.length > 30` on a 375px viewport with no typeahead. Must-fail: `<select>` with Yes/No; DOB as three selects. Must-pass twin: a switch; `input[type=date]` or a masked text field.
- **Exceptions:** Kennedy: dropdowns are OK when "Users rarely need to change the default value", "There are very few options", or "The user is not on mobile"; Google Flights' custom dropdown with steppers inside is praised.

### tap-targets-and-control-height
- **Claim:** "The minimum tap target size on both iOS and Android — On iOS: 44x44pt. On Android: 48x48pt." (Kennedy). Schoger: "Increasing height on inputs. Give them a total height of 40 or 48px"; "Increase height of button so it's consistent with the inputs".
- **Source:** Kennedy #26, https://www.learnui.design/blog/100-things-ux-ui-designer-know.html ; CSS Day tips #4 and #6, https://gist.github.com/ynotdraw/9351627d7509cc35813eeac4245cab3b
- **Prefers / forbids:** Prefers ≥ 44×44 hit areas on touch viewports, inputs and adjacent buttons of equal height. Forbids 26px-wide grid cells as targets (Kennedy's grid critique) and buttons shorter than the inputs they sit beside.
- **Measurable?** yes. At 375px viewport, `getBoundingClientRect()` of every `a, button, input, [role=button]`: fail if width or height < 44 (or < 24 for inline text links, WCAG's floor); in a form row, |button height − input height| ≤ 2px. Must-fail: 32px icon buttons, 36px input beside 44px button. Must-pass twin: 44px all round.
- **Exceptions:** Inline text links in running prose; dense desktop-only tools if the project commits "no touch".

### dont-overlook-empty-states-teach-by-example
- **Claim:** "Use the 'first load' experience to provide sample data, showing by example what the properly-working app will look like" (Kennedy, Rule 4 "Teach by example", citing Basecamp's pre-fabricated example projects). Book chapter: "Don't overlook empty states".
- **Source:** Kennedy, https://www.learnui.design/blog/4-rules-intuitive-ux.html ; TOC https://www.refactoringui.com/
- **Prefers / forbids:** Prefers a designed empty state (message + example + call to action) or sample data; prefers examples over descriptions ("The description … only resonates once I see a few examples"). Forbids "a totally blank page" on first load and an empty table header with no rows and no message.
- **Measurable?** partly. In a journey's declared empty state: find list/table containers with 0 data children; require a visible text node inside or adjacent (≥ 1 sentence) and ≥ 1 actionable element. Must-fail: `<table>` with `<thead>` only. Must-pass twin: same plus an empty-state block with copy and a "Create the first…" button. Whether the copy *teaches* is judgement.
- **Exceptions:** Search results with zero hits still need a message but no sample data; transient loading states.

### four-layers-before-pixels-dribbblisation
- **Claim:** "Too many designers are designing to impress their peers rather than address real business problems. … Things that look great but don't work well." "The grid, font, colour, and aesthetic style are irrelevant if the other three layers haven't been resolved first. … that's art not design." "Blur your eyes and try and tell the difference." (Paul Adams)
- **Source:** Paul Adams, "The dribbblisation of design", Intercom, 2013, https://www.intercom.com/blog/the-dribbblisation-of-design/
- **Prefers / forbids:** Prefers working top-down through four layers (outcome → system/product architecture → interactions → visual design), framing every problem as a Job ("When ___, I want to ___, so I can ___"), prototypes with real data. Forbids "flat PNGs", "perfect pixel executions of flat design" that don't solve a stated problem, redesigning others' products without their constraints, and interchangeable styling ("Whether it's social software, accounting software … the same styles are applied").
- **Measurable?** no — it is a critique of *process* and *intent*, not of the artifact. The closest proxy uxcli already has is procedural: the journey/understanding files must exist and name the actor's job before a screen is measured. A machine can check that a job statement exists; it cannot check that the visual layer serves it. Stays taste/process.
- **Exceptions:** Adams: "Executing beautiful looking things, certainly an important skill" — the visual layer is not worthless, only last.

### growth-design-psychology-principles
- **Claim:** "Every time users interact with your product, they: filter the information, seek the meaning of it, act within a given time, store bits of the interaction in their memories." Principles are catalogued in four groups — Information (Hick's Law, Cognitive Load, Visual Hierarchy, Von Restorff Effect, Law of Proximity, Signifiers, Contrast, Aesthetic-Usability Effect, Progressive Disclosure, Fitts's Law…), Meaning (Social Proof, Mental Model, Familiarity Bias, Law of Similarity, Law of Prägnanz, Miller's Law…), Time (Default Bias, Loss Aversion, Decision Fatigue, Labor Illusion…), Memory (Peak-End Rule, Recognition Over Recall, Chunking, Zeigarnik Effect…).
- **Source:** Growth.Design, https://growth.design/psychology ; case-study index https://growth.design/case-studies (categories: Onboarding, Retention, Revenue, Ethics, Referral; recurring "How to ethically…" framing).
- **Prefers / forbids:** Prefers fewer choices per step (Hick), chunked forms (Miller/Chunking), recognition over recall, one salient element (Von Restorff), proximity for grouping, a clear default. Forbids dark-pattern uses of the same levers — the site's own case-study titles repeatedly qualify persuasion with "ethically".
- **Measurable?** partly, for a subset: Hick's Law → count of interactive choices visible in one step (fixture: 24 equal buttons vs 5 + "more"); Law of Proximity → the ambiguous-spacing check above; Von Restorff → exactly one element with the accent hue in a group (fixture: all 6 plan cards highlighted vs one); Fitts's → target size/distance (tap-target entry); Recognition over recall → a selection shows its options (dropdown entry). Social proof, peak-end, loss aversion are not readable from a DOM.
- **Exceptions:** The catalogue is descriptive, not a rulebook; each principle carries an ethics caveat rather than a hard prohibition.

## What this school is against

- **Borders as the default grouping device** and "box inside a box" — Wathan & Schoger, https://www.refactoringui.com/ ; Schoger tweet 16 Aug 2017.
- **Grey (0-saturation) text or reduced opacity on coloured backgrounds** — Schoger tweet 12 Jun 2017; CSS Day tip #2.
- **Pure black and pure grey neutrals** — Schoger tweet 19 Mar 2018; Kennedy #17.
- **Browser-default spacing; not enough whitespace** ("Largest mistake") — Kennedy Rule 3; CSS Day tip #4.
- **Too many font sizes** ("one of the top mistakes"), and *also* strict golden-ratio type scales on responsive pages — Kennedy font-size guide and "Designer Dogma".
- **Same line-height for every size** — Schoger tweet 27 Feb 2018.
- **All-caps without letter-spacing** — Schoger tweet 31 May 2017.
- **Shadows lit from below / heavy horizontal offsets** — Kennedy Rule 1; Schoger tweet 20 Jun 2017.
- **12-column grids on screens that change size; percentage-scaled components** — Kennedy, "Designer Dogma"; Refactoring UI chapters "Grids are overrated", "Relative sizing doesn't scale".
- **Colour-theory palettes (complementary/triadic) as UI palettes; many hues** — Kennedy Rule 2 and "Designer Dogma".
- **Every button filled; green/red buttons competing with the primary; big bold destructive buttons** — Schoger Laracon; tweets 2 Aug 2017.
- **Every link brand-blue** — Laracon "Go easy on link styles"; RUI chapter "Not every link needs a color".
- **"Field: value" data dumps; labels heavier than values** — CSS Day tip #12; RUI "Labels are a last resort", "Think outside the database".
- **Text straight on photos with no overlay** — Kennedy Rule 4; CSS Day tip #1.
- **Native checkboxes/radios/selects, inconsistent radii, mixed icon sets** — CSS Day tip #6; Laracon.
- **Dropdowns for ≤5 options, dates, counts, or long lists on mobile** — Kennedy "ABD".
- **Controls "where we have space for it" / FABs copied without reason** — Kennedy, Law of Locality.
- **Primary action grey and small while "Help" is big and blue** — Kennedy, Squint Test.
- **Blank first-load pages** — Kennedy "Teach by example"; RUI "Don't overlook empty states".
- **Centred paragraphs (≥3 lines); right-aligned images against ragged text** — Kennedy #22; "3 Pro Tips on Alignment".
- **Carousels** ("They reflect a lack of prioritization of content") — Kennedy #66.
- **Chart junk** — Kennedy #7.
- **Designing for peers/Dribbble; "flat PNGs"; pixel work before outcome, system and interaction are resolved; redesigning other people's products without their constraints** — Paul Adams.
- **Dark-pattern use of persuasion principles** — Growth.Design ("ethically" framing throughout).

## Notes on reliability

- **Stated by the author, verbatim, on a fetched page:** all Schoger tweets quoted above (two independent compilations agree word-for-word and link the original tweet IDs); all Erik Kennedy quotes; the refactoringui.com "Use fewer borders" passage and all chapter titles; Paul Adams' essay; Growth.Design's four-group framing and principle names.
- **Author's material via third-party notes (paraphrase, not verbatim):** everything cited to the CSS Day 2019 gist and the Laracon 2018 notes. The numbers there (input height 40/48px, `0 25px 50px -12px` shadow, type scale 12…48, five shadow rungs) are attendee transcriptions of slides; treat wording as approximate, substance as Schoger's. The talk video (YouTube 7Z9rrryIOC4) and slides (Speaker Deck) exist per the gist but were not watched.
- **Book content not read directly:** Refactoring UI is paid; only its TOC is public. Chapter titles are exact; the rules under each title are inferred from Schoger's talks, which he presented as the same material ("http://www.refactoringui.com" is the closing slide of the Laracon talk).
- **Unverified / not found:**
  - "7 Practical Tips for Cheating at Design" (Medium) — could not be fetched (403). Not quoted anywhere above.
  - The exact formulation "whitespace before lines before boxes" attributed to Erik Kennedy — appears in the owner's memory note (`feedback-fewer-borders.md`) and in this project's 2026-09-12 research, but was not found on any fetched learnui.design page or in a web search. The *ordering* is consistent with Refactoring UI's fewer-borders tactic and Kennedy's Rule 3; the *attribution* to Kennedy stays folklore until a page is found. Recorded here as "separation-order-space-then-lines-then-boxes" with the verified sources only.
  - "The 3-30-300 rule" — not found on learnui.design or in Kennedy's writing; the phrase belongs to workplace real-estate economics, not UI. Treated as not real for this school and omitted.
  - Steve Schoger's own site / the x.com moment (https://twitter.com/i/moments/880688233641848832) were not fetched; compilations were used instead.
- **Folklore vs. stated:** "16px body / 1.5 line-height" is stated by Schoger *with the hedge* "If in doubt … pretty good safe"; "50–75 characters per line" and "44/48pt tap targets" are Kennedy restating older typographic and platform guidance (he cites Apple/Material), not original claims. "Never use black" is Kennedy citing Ian Storm Taylor. Kennedy's WCAG numbers are WCAG's, not his.
- **Contradictions inside the school worth knowing:** Kennedy rejects modular type scales while Schoger prescribes one (12…48); both agree on the *outcome* (few, consistent, distinguishable sizes), which is what the measurable check targets. Kennedy is anti-grid; Schoger's Laracon talk never mentions grids. Hobday's "37 Ways" celebrates decorative borders/shadows the fewer-borders rule would count — it is explicitly a "spice" list for after the fundamentals hold, and says "Be careful not to use too many – or too heavy – of borders."
- **Growth.Design case studies:** the index page could not be parsed by the article reader; category names and sample titles come from a WebFetch summary of the same URL. Individual case studies were not read; principle definitions come from the /psychology page only.
