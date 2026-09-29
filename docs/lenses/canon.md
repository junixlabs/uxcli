# Lens research — classic canon

Researched 2026-09-29 for the uxcli "lenses" idea: packaged viewpoints from real designers, each with a source, that an agent applies to a UI it just built. This file covers the classic graphic-design / typography / information-design canon. Every quote below was read on the URL cited; anything that could not be read is marked **unverified**.

## Sources fetched

| source | author | URL (actually fetched) | what it is |
|---|---|---|---|
| Ten principles for good design | Dieter Rams | https://www.vitsoe.com/us/about/good-design | Vitsoe's canonical page; each principle with Rams's one-sentence gloss |
| The Vignelli Canon (PDF, 2009) | Massimo Vignelli | https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf | RIT Vignelli Center copy of the free PDF; text extracted with pdftotext (vignelli.com/canon.pdf returned 404) |
| Grid Systems in Graphic Design (1981) — full text | Josef Müller-Brockmann | https://archive.org/stream/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann_djvu.txt | Internet Archive OCR text of the book (direct PDF download timed out) |
| Josef Müller-Brockmann: grid-based layout and web design | Ben Morris | https://www.ben-morris.com/josef-muller-brockmann-grid-based-layout-and-web-design/ | Secondary summary; quotes "compact planning, intelligibility and clarity" |
| Grid (graphic design) | Wikipedia | https://en.wikipedia.org/wiki/Grid_(graphic_design) | History/context only; no component definitions |
| Elements of Typographic Style Applied to the Web | Richard Rutter (quoting Bringhurst) | http://webtypography.net/toc/ , /2.1.2 , /2.2.1 , /2.1.6 , /3.1.1 | Reproduces Bringhurst's rules verbatim, section by section, with CSS advice |
| Review of Elements of Typographic Style | OptimWise | https://optimwise.com/review-the-elements-of-typographic-style-by-robert-bringhurst/ | Secondary summary of Bringhurst rules |
| Practical Typography — Summary of key rules | Matthew Butterick | https://practicaltypography.com/summary-of-key-rules.html | Butterick's own one-page summary |
| Chartjunk | Wikipedia | https://en.wikipedia.org/wiki/Chartjunk | Quotes Tufte's VDQI definition with citation |
| Tufte's Principles of Data-Ink | EDAV community notes | https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html | Secondary: the five data-ink principles and ratio definition |
| Tufte's data design principles | Guy Pursey | https://guypursey.com/blog/202001041530-tufte-principles-visual-display-quantitative-information | Secondary: quote list from VDQI |
| Three Lessons From Tufte | Dan Brown, Boxes and Arrows | https://boxesandarrows.com/three-lessons-from-tufte-special-deliverable-6/ | Secondary: quotes Visual Explanations p.73 and Envisioning Information p.53 with page numbers |
| Lessons from Edward Tufte | Antoine Buteau | https://www.antoinebuteau.com/lessons-from-edward-tufte/ | Secondary: quote list |
| Envisioning Information notes | blas.com | https://blas.com/envisioning-info/ | Secondary: quote list |
| tufte-claude-skill principles.md | aref-vc (GitHub) | https://github.com/aref-vc/tufte-claude-skill/blob/main/principles.md | Secondary; cites pages; used only for cross-checking |
| Edward Tufte notebook: Chartjunk | Edward Tufte | https://www.edwardtufte.com/notebook/chartjunk/ | Fetched, but the page is image scans + page citations (VDQI 106–121, EI 52–65, VE 88–89, 146–150, BE 158–159, 170–179); no extractable text |
| Edward Tufte books | Edward Tufte | http://www.edwardtufte.com/books/ | Fetched; bibliographic only |
| Proximity principle | Aurora Harley, NN/g, 2020-08-02 | https://www.nngroup.com/articles/gestalt-proximity/ | Definition + UI failures |
| Similarity principle | Aurora Harley, NN/g, 2020-09-06 | https://www.nngroup.com/articles/gestalt-similarity/ | Definition + UI failures |
| Common region principle | Aurora Harley, NN/g, 2020-07-12 | https://www.nngroup.com/articles/common-region/ | Definition + caution on over-boxing |
| Closure principle | Alita Kendrick, NN/g, 2021-07-18 | https://www.nngroup.com/articles/principle-closure/ | Definition + UI failures |
| Gestalt principles | Interaction Design Foundation | https://ixdf.org/literature/topics/gestalt-principles | Definitions of 11 principles |
| Thinking with Type (review) | Ricardo Cordoba, Typographica, 2004 | https://typographica.org/typography-books/thinking-with-type-by-ellen-lupton/ | Secondary; structure of the book only |

**Fetch failures (claims from these are marked unverified):** https://www.vignelli.com/canon.pdf (404; RIT copy used instead) · https://thinkingwithtype.com/text/ and /grid/ (timed out, three attempts, Wayback blocked) · https://eclass.uth.gr/…/Envisioning%20Information%201990.pdf (returned a login HTML page) · https://ia802309.us.archive.org/…/Grid%20systems…pdf (connection timeout; djvu text used instead) · https://medium.com/@pj_/the-smallest-effective-difference-90fc94d5ab0d (403) · https://www.aurysilva.co.uk/… and http://blah.ksteinfe.com/… (empty / ECONNRESET).

## Viewpoints

### rams-as-little-design-as-possible
- **Claim:** "Good design is as little design as possible. Less, but better – because it concentrates on the essential aspects, and the products are not burdened with non-essentials."
- **Source:** Dieter Rams, Ten principles for good design, https://www.vitsoe.com/us/about/good-design
- **Prefers / forbids:** Prefers removing anything that does not serve the purpose. Forbids ornament, decoration and features added for their own sake ("non-essentials").
- **Measurable?** partly. A browser can count decorative-only DOM: elements with no text, no image, no interactive role and only a border/shadow/background (dividers, wrappers, gradient bands), and the number of distinct box-shadow / border-radius / gradient declarations in computed styles. Must-fail fixture: a card list where each card has a nested wrapper with its own border, a shadow, a gradient header strip and a decorative icon that repeats the heading. Must-pass twin: same content, each card one element with one border, no gradient strip, no repeated icon. A machine agrees on the count; whether the remainder is "essential" stays judgement.
- **Exceptions:** Rams frames the rule with "back to purity, back to simplicity" — the aesthetic quality of the product is itself part of its usefulness (principle 3), so stripping to nothing is not the goal.

### rams-understandable
- **Claim:** "Good design makes a product understandable. It clarifies the product's structure. Better still, it can make the product talk. At best, it is self-explanatory."
- **Source:** Dieter Rams, Ten principles for good design, https://www.vitsoe.com/us/about/good-design
- **Prefers / forbids:** Prefers visible structure and controls whose function is legible without instruction. Forbids interfaces that need a manual, tooltips as the only explanation, unlabeled icons. Vignelli says the same from the other side: "Sometimes it may need some explanation but it is better when not necessary. Any artifact should stand by itself in all its clarity." (Canon, Pragmatics, p.14).
- **Measurable?** partly. Count interactive elements (button, a, [role=button], input) with no accessible name, and icon-only controls without a visible text label; count headings per landmark region (a region with no heading has no announced structure). Must-fail: a toolbar of six icon-only buttons with `aria-label` but no visible text and a page with zero `<h1>–<h3>`. Must-pass: same toolbar with visible labels (or a label on hover plus a text label on the primary action) and one heading per landmark. "Self-explanatory" as a whole stays taste.
- **Exceptions:** None stated on the page; Rams's own products (calculators, radios) rely on convention rather than labels everywhere, so the rule is about structure, not text density.

### rams-honest
- **Claim:** "Good design is honest. It does not make a product more innovative, powerful or valuable than it really is. It does not attempt to manipulate the consumer with promises that cannot be kept."
- **Source:** Dieter Rams, Ten principles for good design, https://www.vitsoe.com/us/about/good-design
- **Prefers / forbids:** Prefers controls that do what they look like they do. Forbids fake affordances (things that look clickable but aren't), fake progress, manufactured urgency, disabled-but-styled-enabled buttons.
- **Measurable?** partly. A browser can find elements styled like links/buttons (cursor:pointer, underline, button-like border) with no handler / no href / no role, and the inverse (interactive elements with cursor:default and no visual affordance). Must-fail: a `<div>` with pointer cursor and button styling and no click handler; a countdown timer that resets on reload. Must-pass: the same visuals only on real `<button>`/`<a href>`. Manipulation of "promises" stays taste.
- **Exceptions:** None stated.

### rams-thorough-to-the-last-detail
- **Claim:** "Good design is thorough down to the last detail. Nothing must be arbitrary or left to chance. Care and accuracy in the design process show respect towards the user."
- **Source:** Dieter Rams, Ten principles for good design, https://www.vitsoe.com/us/about/good-design
- **Prefers / forbids:** Prefers a consistent system: repeated spacings, one radius, aligned edges. Forbids one-off values, near-misses in alignment, mismatched states.
- **Measurable?** yes. Count distinct values of margin/padding/gap, border-radius, font-size, and colors in computed styles across the page; count elements whose left edge is within 1–3px of another sibling's edge but not equal (near-miss alignment). Must-fail: 14 distinct paddings, 5 radii, buttons in one row at x = 24, 25, 24, 27. Must-pass: paddings drawn from a 4-value scale, one radius, all left edges equal. The machine counts; whether a stray value is "arbitrary" is inferred from its being unique.
- **Exceptions:** None stated.

### vignelli-few-typefaces
- **Claim:** "In reality the number of good typefaces is rather limited … Personally, I can get along well with a half a dozen, to which I can add another half a dozen, but probably no more." His exhibition used "only four typefaces: Garamond, Bodoni, Century Expanded, and Helvetica."
- **Source:** Massimo Vignelli, The Vignelli Canon, "Typefaces, The Basic Ones" (p.54), https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf
- **Prefers / forbids:** Prefers one or two established families per work; "is not the type but what you do with it that counts. The accent was on structure rather than type." Forbids desktop-publishing sprawl ("a cultural pollution of incomparable dimension"), distortion of type, expressive type ("I don't believe that when you write dog the type should bark!").
- **Measurable?** yes. Count distinct rendered `font-family` first-choices across visible text nodes (ignore icon fonts and `<code>`). Must-fail: a page rendering 4 families (display serif for h1, a geometric sans for h2, system sans for body, a rounded sans for buttons). Must-pass: same page, 1 family plus optional monospace for code. Threshold is the lens's to set (Vignelli's own practice: 1–2 per piece); the count itself is unambiguous.
- **Exceptions:** "There are times when a specific type design may be appropriate, mostly for a logo or a short promotional text, particularly in very ephemeral or promotional contexts."

### vignelli-two-type-sizes
- **Claim:** "Basically we stick to no more then two type sizes on a printed page, but there are exceptions." And: "Our first rule is to stick to one or two type sizes at the most."
- **Source:** Massimo Vignelli, The Vignelli Canon, "Type Size Relationships" and "Contrasting Type Sizes" (p.72), same PDF URL as above
- **Prefers / forbids:** Prefers a small size with a large one "usually twice as big (for instance, 10 pt text and 20 pt headings)"; heads and subheads "the same size … just make them in bold, with a line space above and none below." Forbids a size for every level of hierarchy.
- **Measurable?** yes. Count distinct computed `font-size` values among visible text (excluding sub/sup, badges under 2 words if the lens allows). Must-fail: 9 distinct sizes (11, 12, 13, 14, 15, 16, 18, 24, 32). Must-pass: 2–3 sizes with the large one ≈2× the body. Vignelli's stated ratio (2×) and count (≤2, with exceptions) are both machine-checkable.
- **Exceptions:** "but there are exceptions"; "For display reasons we like to set the type much larger or increase the leading to achieve a particular effect."

### vignelli-weight-for-function-not-volume
- **Claim:** "Type weights can be used to great advantage when dedicated to a specific function, rather than be used for color purposes or even worse as a phonetic analogy. Some people who talk loud and tend to scream trying to persuade you, love to increase the size and weight of type to make the message louder. That is exactly what I consider intellectual vulgarity."
- **Source:** Massimo Vignelli, The Vignelli Canon, "Contrasting Type Sizes" (p.72), same PDF URL
- **Prefers / forbids:** Prefers bold/italic/light "dedicated to a specific function" and used "to the minimum". Forbids bold as decoration or as shouting; many weights.
- **Measurable?** partly. Count distinct `font-weight` values in visible text; count the share of body characters set at weight ≥600; count bold runs inside paragraphs. Must-fail: 5 weights in use and 40% of paragraph text bold. Must-pass: 2 weights (400 and one bold), bold only on headings/labels, <5% of paragraph text. Whether a given bold "serves a function" stays judgement.
- **Exceptions:** None stated beyond "stick to the minimum".

### vignelli-flush-left
- **Claim:** "Most of the time we use flush left … it is better for the eye to go to the next line than having to cope with hyphens all the time." "Justified is used more for text books, but it is not one of our favorites because it is fundamentally contrived."
- **Source:** Massimo Vignelli, The Vignelli Canon, "Flush Left, Centered, Justified", same PDF URL
- **Prefers / forbids:** Prefers `text-align: left` for running text, with a controlled rag. Centered only for "lapidary text, invitations, or any rhetorical composition … or for the address at the bottom of a letterhead, and for business cards." Forbids justified body text and centered paragraphs.
- **Measurable?** yes. For each block of text over N lines (say 3), read computed `text-align`. Must-fail: a three-paragraph description set `text-align: center` or `justify`. Must-pass: same set `left`, headings may be centered. Rag "shape" control stays taste.
- **Exceptions:** Centered for short rhetorical/lapidary text; justified is tolerated for text books.

### vignelli-white-space-is-the-silence
- **Claim:** "White space for me is a very important element in graphic composition. It is really the white that makes the black sing … In a world where everybody screams, silence is noticeable. White space provides the silence. That is the essence of our typography."
- **Source:** Massimo Vignelli, The Vignelli Canon, "Contrasting Type Sizes" (p.72), same PDF URL
- **Prefers / forbids:** Prefers large headline "versus a much smaller type size for the body text, with proper white space in between"; margins "small enough to provide a certain tension between the edges of the page and the content." Forbids filling every area.
- **Measurable?** partly. A browser can compute the share of the viewport (or of a section's bounding box) not covered by any text/image/bordered box, and the vertical gap between a heading and the block above it vs. below (Vignelli: "a line space above and none below" for subheads). Must-fail: heading with `margin: 4px 0` on both sides and section blocks touching. Must-pass: heading with ≥1 line-height above and ~0 below, sections separated by ≥2 line-heights. The ratio of empty area itself is a number; whether it "sings" is not.
- **Exceptions:** None stated.

### vignelli-grid-module-fits-the-job
- **Claim:** "There are infinite kinds of grids, but just one - the most appropriate - for any problem … the smaller the module of the grid the least helpful it could be. We could say that an empty page is a page with an infinitesimal small grid … Conversely a page with a coarse grid is a very restricting grid offering too few alternatives."
- **Source:** Massimo Vignelli, The Vignelli Canon, "Grids, Margins, Columns and Modules" (p.40), same PDF URL
- **Prefers / forbids:** Prefers a grid coarse enough to constrain: "The grid represents the basic structure of our graphic design, it helps to organize the content, it provides consistency, it gives an orderly look." Forbids an effectively grid-less page (everything at arbitrary x), and a grid so fine it constrains nothing.
- **Measurable?** partly. Collect left edges and widths of top-level blocks; count how many distinct x-positions they resolve to and whether they are multiples of a common column unit (fit to the best k-column model; report residual). Must-fail: 11 distinct left edges across 14 blocks, no common divisor within 2px. Must-pass: all edges on 2–3 x-positions from a 12-column model. "Appropriate" module size is judgement; alignment to *some* grid is not.
- **Exceptions:** "Sometimes, in designing a grid we want to have the outside margins small enough to provide a certain tension" — margins may deliberately break the module.

### vignelli-syntactic-consistency
- **Claim:** "The consistency of a design is provided by the appropriate relationship of the various syntactical elements of the project: how type relates to grids and images from page to page throughout the whole project. Or, how type sizes relate to each other."
- **Source:** Massimo Vignelli, The Vignelli Canon, "Syntactics" (p.12), same PDF URL
- **Prefers / forbids:** Prefers the same relationships repeated across screens ("continuity of intent throughout rather than fragmentation" — Discipline, p.16). Forbids each screen inventing its own type/grid relationship. "Design without discipline is anarchy."
- **Measurable?** yes, across a journey. Compare per-screen fingerprints: set of font-sizes, font-families, column edges, heading margins. Must-fail: screen A uses 16/24/32 with h2 margin-top 32; screen B uses 15/22/28 with h2 margin-top 20. Must-pass: identical sets on both. The diff is mechanical.
- **Exceptions:** None stated.

### mb-grid-fields-from-columns-and-lines
- **Claim:** "The grid divides a two-dimensional plane into smaller fields … The fields correspond in depth to a specific number of lines of text and the width of the fields is identical with the width of the columns."
- **Source:** Josef Müller-Brockmann, Grid Systems in Graphic Design (1981), https://archive.org/stream/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann_djvu.txt
- **Prefers / forbids:** Prefers a two-axis grid: column widths for x, a whole number of text lines (baseline grid) for y; images and blocks sized to whole fields. Forbids elements sized off the field, and vertical positions that are not multiples of the line unit.
- **Measurable?** yes. On a page with a body line-height L, check that block tops/heights and vertical gaps are integer multiples of L (tolerance 1px) and that block widths equal k columns + (k−1) gutters for the detected column model. Must-fail: line-height 24px, cards 137px tall, gaps of 19/23/30px. Must-pass: cards 144 or 168px, gaps 24 or 48px, widths on 3-of-12 columns. Strictly mechanical.
- **Exceptions:** In the same text: "A suitable grid in visual design makes it easier to construct the argument objectively" — "suitable" leaves choice of the module to the designer; the Ben Morris summary quotes the book's line that the grid "suggests orderliness of design", i.e. it is a means, not the goal. (The oft-quoted "The grid system is an aid, not a guarantee" was only seen in a search snippet — unverified.)

### mb-objective-intelligible
- **Claim:** "Information presented with clear and logically set out titles, subtitles, texts, illustrations and captions will not only be read more quickly and easily but the information will also be better understood." And: "The designer's work should have the clearly intelligible, objective, functional and aesthetic quality of mathematical thinking."
- **Source:** Josef Müller-Brockmann, Grid Systems in Graphic Design, same archive.org URL
- **Prefers / forbids:** Prefers systematic placement where every element has a reason; hierarchy carried by position and consistent type, not by decoration. Forbids subjective, ad-hoc placement ("Working with the grid system means submitting to laws of universal validity").
- **Measurable?** partly. Heading order (h1→h2→h3 without skips), one h1, captions attached to their figures (`<figcaption>` or adjacent), consistent title styling per level. Must-fail: h1 then h4, two h1s, captions as loose `<p>`. Must-pass: monotonic heading levels, figure/figcaption pairs. "Objective" as a whole is taste.
- **Exceptions:** None stated in the fetched passages.

### bringhurst-measure-45-75
- **Claim:** "Anything from 45 to 75 characters is widely regarded as a satisfactory length of line for a single-column page set in a serifed text face in a text size. The 66-character line (counting both letters and spaces) is widely regarded as ideal. For multiple column work, a better average is 40 to 50 characters."
- **Source:** Robert Bringhurst, The Elements of Typographic Style §2.1.2, as reproduced at http://webtypography.net/2.1.2
- **Prefers / forbids:** Prefers body-text measure 45–75 characters, 66 ideal; 40–50 in multi-column. Web advice on the same page: set the width in ems so the measure survives text resizing. Forbids full-width paragraphs on wide viewports and narrow columns under 40. Butterick's summary gives a wider band — "The average line length should be 45–90 characters (including spaces)" (https://practicaltypography.com/summary-of-key-rules.html) — a lens must say which it follows.
- **Measurable?** yes. For each paragraph block: count characters on a rendered line (Range.getClientRects per line, or width ÷ average glyph advance measured with a canvas). Must-fail: a `<p>` at 1440px viewport rendering 160 characters per line; a 3-column layout rendering 28 per line. Must-pass: the same text in a `max-width: 38em` container (≈66–72 chars). No judgement involved.
- **Exceptions:** Bringhurst's numbers are for continuous text in a serifed face; short UI strings, labels, table cells and headings are not "lines of text" in this sense and should be excluded from the count.

### bringhurst-leading-is-a-rhythmic-unit
- **Claim:** "Vertical space is metered in a different way. You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next." Section title: "Choose a basic leading that suits the typeface, text and measure"; companion rule §2.2.2: "Add and delete vertical space in measured intervals."
- **Source:** Robert Bringhurst §2.2.1 / §2.2.2, as reproduced at http://webtypography.net/2.2.1 and http://webtypography.net/toc/
- **Prefers / forbids:** Prefers a unitless line-height (page recommends e.g. `line-height: 1.5`, notes "figures upwards of 1.3 are common") and vertical margins that are multiples of it. Forbids vertical spacing values unrelated to the line unit; line-height below 1 for running text.
- **Measurable?** yes. Compute body line-height L; check that margins/paddings between text blocks are multiples of L (or of L/2 if the lens allows). Must-fail: L = 24px, paragraph margins 13px, heading margins 37px/9px. Must-pass: margins 24px, headings 48px above / 12px below. Mechanical.
- **Exceptions:** OptimWise summary of Bringhurst: more leading for longer measures, darker faces, larger x-height, sans serifs — the ratio moves with the face.

### bringhurst-compose-with-a-scale
- **Claim:** "Use the old familiar scale, or use new scales of your own devising, but limit yourself, at first, to a modest set of distinct and related intervals." (Section title: "Don't compose without a scale.")
- **Source:** Robert Bringhurst §3.1.1, as reproduced at http://webtypography.net/3.1.1
- **Prefers / forbids:** Prefers a small set of sizes with a stated relation (the page's web advice: em multipliers off a 100% base, e.g. h1 2.25em). Forbids sizes chosen one at a time to fit a slot.
- **Measurable?** yes. Count distinct font-sizes; test whether they fit a ratio (each size ≈ base × r^n for some r in a common set 1.125–1.618, within 1px). Must-fail: sizes 13, 14, 15, 17, 19, 22, 27 (no ratio fits, 7 steps). Must-pass: 16, 20, 25, 31 (r≈1.25, 4 steps). A machine can report both count and best-fit residual.
- **Exceptions:** "at first" — Bringhurst permits new scales once the designer has one; the rule is about having a scale, not which.

### bringhurst-letterspace-caps-5-10
- **Claim:** "The normal value for letterspacing these sequences of small or full caps is 5% to 10% of the type size." (Section: "Letterspace all strings of capitals and small caps, and all long strings of digits"; companion §2.1.7: "Don't letterspace the lower case without a reason.")
- **Source:** Robert Bringhurst §2.1.6 / §2.1.7, as reproduced at http://webtypography.net/2.1.6 and http://webtypography.net/toc/
- **Prefers / forbids:** Prefers `letter-spacing: 0.05–0.1em` on all-caps runs (labels, eyebrows, buttons in caps). Forbids all-caps at 0 tracking and tracked lowercase body text.
- **Measurable?** yes. For text nodes with `text-transform: uppercase` or all-caps content of ≥3 letters, read computed letter-spacing ÷ font-size. Must-fail: uppercase nav labels at letter-spacing 0; body paragraph at letter-spacing 0.08em. Must-pass: caps at 0.05–0.1em, body at normal. Butterick's 5–12% band overlaps; use 5–10% for Bringhurst.
- **Exceptions:** Display type at large sizes may be tracked tighter; not stated on the fetched page.

### butterick-body-size-15-25px
- **Claim:** "Point size should be 10–12 points in printed documents, 15–25 pixels on the web."
- **Source:** Matthew Butterick, Practical Typography, Summary of key rules, https://practicaltypography.com/summary-of-key-rules.html
- **Prefers / forbids:** Prefers body text between 15 and 25 CSS px. Forbids 12–14px body copy and, by the upper bound, oversized body text.
- **Measurable?** yes. Computed font-size of the dominant text blocks (by character count). Must-fail: `<p>` at 13px. Must-pass: `<p>` at 16–18px. Exact.
- **Exceptions:** The rule is for body text; captions, labels and UI chrome are not covered by the summary line.

### butterick-line-spacing-120-145
- **Claim:** "Line spacing should be 120–145% of the point size."
- **Source:** Matthew Butterick, Practical Typography, same URL
- **Prefers / forbids:** Prefers `line-height` 1.2–1.45 on body text. Forbids 1.0–1.15 (cramped) and >1.5 on running text (gappy).
- **Measurable?** yes. `line-height / font-size` per paragraph. Must-fail: 16px / 18px line-height (1.125); 16px / 32px (2.0). Must-pass: 16px / 22px (1.375). Exact. (Bringhurst's web page reads "figures upwards of 1.3 are common" and uses 1.5 itself; the two sources overlap at 1.3–1.45.)
- **Exceptions:** The summary states none; headlines and short lines are outside "line spacing" for body text. Vignelli's print ratios are tighter — "12 on 13, 14 on 16 for columns up to 140 mm. 16 on 18, 18 on 20, for larger columns" (Canon, Type Size Relationships) — i.e. 1.08–1.14; treat as print-only, and note his own qualifier "Naturally every situation may require a different ratio."

### butterick-emphasis-sparingly
- **Claim:** "Use bold or italic as little as possible, and not together." "Never underline, except perhaps for web links." "All caps are fine for less than one line of text." "Use centered text sparingly." "Use 5–12% extra letterspacing with all caps and small caps."
- **Source:** Matthew Butterick, Practical Typography, same URL
- **Prefers / forbids:** Prefers one emphasis device at a time; caps only for short strings with tracking; centered only occasionally. Forbids bold-italic, underlined non-links, all-caps paragraphs, centered body text, untracked caps.
- **Measurable?** yes. Count elements with `font-weight ≥ 600 && font-style: italic`; `text-decoration: underline` on non-`<a>`; `text-transform: uppercase` on blocks that render >1 line; `text-align: center` on multi-line paragraphs; uppercase runs with letter-spacing < 0.05em. Must-fail: a bold-italic underlined subheading, an all-caps two-line intro paragraph. Must-pass: bold-only headings, caps only on one-line labels at 0.06em, underline only on links.
- **Exceptions:** Underline for web links; all-caps under one line.

### tufte-data-ink-ratio
- **Claim:** Data-ink is "the non-erasable core of a graphic, the non-redundant ink arranged in response to variation in the numbers represented." The five principles: "Above all else show the data. Maximize the data-ink ratio. Erase non-data-ink. Erase redundant data-ink. Revise and edit."
- **Source:** Edward Tufte, The Visual Display of Quantitative Information (1983; 2nd ed. 2001), quoted at https://guypursey.com/blog/202001041530-tufte-principles-visual-display-quantitative-information and https://jtr13.github.io/cc19/tuftes-principles-of-data-ink.html (data-ink ratio = "the proportion of a graphic's ink devoted to the non-redundant display of data-information"). Tufte's own notebook cites VDQI pp.106–121 for this material (https://www.edwardtufte.com/notebook/chartjunk/).
- **Prefers / forbids:** Prefers marks that change when the data changes; everything else is a candidate for erasure. Forbids gridlines heavier than data, boxed plot areas, redundant axes, legends repeating labels, a value said four ways (bar + number + gridline + tick).
- **Measurable?** partly. In an SVG/canvas chart a browser can count non-data elements (gridlines, frame rects, tick marks, legend entries) against data elements (bars, points, path segments) and measure stroke weight of gridlines vs. data marks. Must-fail: a bar chart with 12 dark gridlines at 1px #333, a full frame, y-axis ticks and a value label on every bar. Must-pass: same bars with direct value labels and no gridlines, or 3 light gridlines at #eee and no frame. The ratio is countable; "redundant" needs the lens to define which pairs are duplicates.
- **Exceptions:** Tufte's own qualifier "Maximize the data-ink ratio, within reason" (VDQI p.96 per the tufte-claude-skill page), and his closing principle: "Principles should not be applied rigidly; better to violate any than place graceless marks" (guypursey.com).

### tufte-forgo-chartjunk
- **Claim:** "The interior decoration of graphics generates a lot of ink that does not tell the viewer anything new … it is all non-data-ink or redundant data-ink, and it is often chartjunk." And: "Forgo chartjunk, including moiré vibration, the grid, and the duck."
- **Source:** Edward Tufte, VDQI (1983), quoted at https://en.wikipedia.org/wiki/Chartjunk and https://guypursey.com/… ; examples listed on the Wikipedia page: heavy gridlines, ornate fonts, decorated axes, frames, pictures/backgrounds/icons in graphs, decorative shading, extra dimensions, 3-D effects.
- **Prefers / forbids:** Prefers plain marks on a quiet ground. Forbids 3-D bars, gradient fills, hatched patterns (moiré), background images behind data, pictorial charts ("ducks"), heavy grids.
- **Measurable?** yes for the listed items. Detect in chart DOM/CSS: gradient or pattern fills on data marks, `perspective`/3-D transforms, background-image on the plot area, gridline stroke darker than data stroke. Must-fail: bars with `fill: url(#stripes)` and a `transform: rotateX(20deg)` container. Must-pass: flat single-color bars. Mechanical for the named devices; "ornate" fonts is taste.
- **Exceptions:** Wikipedia notes an exception debate in later research; Tufte's own text (per the sources fetched) gives none.

### tufte-smallest-effective-difference
- **Claim:** "Make all visual distinctions as subtle as possible, but still clear and effective."
- **Source:** Edward Tufte, Visual Explanations (1997), p.73, quoted with page number at https://boxesandarrows.com/three-lessons-from-tufte-special-deliverable-6/ (also cited p.73 at https://github.com/aref-vc/tufte-claude-skill/blob/main/principles.md)
- **Prefers / forbids:** Prefers the lightest contrast that still separates: light grey vs. dark grey before red vs. blue; muted secondary elements; tapered lines instead of arrowheads (Brown's application). Forbids high-contrast scaffolding (black borders, saturated dividers, heavy rules) around content that is itself quiet.
- **Measurable?** partly. For non-data/non-text elements (borders, dividers, gridlines, rules) compute luminance contrast against their background; flag structural lines with contrast ratio above a threshold the lens sets (e.g. > 3:1 for a divider) and any secondary element whose contrast exceeds the primary content's. Must-fail: `hr { border: 1px solid #000 }` on white; card borders at #333. Must-pass: dividers at #e5e5e5 (≈1.2:1), borders lighter than body text. The threshold is a lens choice; the measurement is not.
- **Exceptions:** "still clear and effective" — the distinction must survive; accessibility contrast for text (WCAG) is a floor this rule must not undercut.

### tufte-one-plus-one-equals-three
- **Claim:** In the "Layering and Separation" chapter Tufte describes, citing Josef Albers, the "1 + 1 = 3 or more" effect: two adjacent marks produce a third, unintended visual object (the gap or vibration between them). Exact wording **unverified** — only secondary sources and search snippets were reachable; Tufte's notebook cites Envisioning Information pp.52–65 for this material.
- **Source:** Edward Tufte, Envisioning Information (1990), ch.3; attested at https://www.antoinebuteau.com/lessons-from-edward-tufte/ ("When two visual elements are placed close together, they create a third, often unintended visual effect") and https://github.com/aref-vc/tufte-claude-skill/blob/main/principles.md. Chapter opening line verified with page number: "Confusion and clutter are failures of design, not attributes of information." (EI p.53, via boxesandarrows.com; blas.com gives it as "To clarify, add detail. Clutter and confusion are failures of design, not attributes of information.")
- **Prefers / forbids:** Prefers separating layers by value (light/dark), not by lines; one kind of information per layer. Forbids boxes inside boxes, double rules, table cells with all four borders, adjacent bordered cards whose borders sum into a heavier line, striped backgrounds.
- **Measurable?** yes for the structural case. Count nesting depth of bordered/shadowed/background-filled boxes (a bordered element whose ancestor within N px is also bordered); count adjacent sibling borders that touch or sit within 2px (two 1px lines reading as one 2px+gap object); count table cells with `border` on all sides. Must-fail: card (border) › section (border) › table (all-cell borders) — depth 3, 40 touching borders. Must-pass: the same content with whitespace between cards, one horizontal rule per table row, depth ≤1. This is the "count boxed nesting" rule the owner already applies (see memory: fewer borders).
- **Exceptions:** None found in fetched sources.

### tufte-small-multiples
- **Claim:** "At the heart of quantitative reasoning is a single question: Compared to what?" Small multiples answer it: "Illustrations of postage-stamp size, indexed by category or a label, sequenced over time like the frames of a movie."
- **Source:** Edward Tufte, Envisioning Information (1990), p.67 per the web search snippet (Wikipedia "Small multiple"), quoted at https://www.antoinebuteau.com/lessons-from-edward-tufte/ and https://github.com/aref-vc/tufte-claude-skill/blob/main/principles.md (which attributes the "Compared to what?" line to VDQI p.67 — the two sources disagree on the book; page 67 is consistent). Guy Pursey's VDQI notes: well-designed multiples are "comparative, multivariate, high-density, efficient."
- **Prefers / forbids:** Prefers repeated same-scale panels for comparison across categories or time. Forbids one overloaded chart with many overlaid series; panels with differing axis scales that defeat comparison.
- **Measurable?** yes. For a set of sibling charts: same width/height, same axis domain (read tick labels or scale attributes), same mark encoding. For a single chart: count series overlaid (>5 lines → candidate). Must-fail: three "comparison" panels with y-axes 0–100, 0–40, 0–1000; one line chart with 9 series. Must-pass: three panels, identical size and domain. Mechanical.
- **Exceptions:** Not stated in fetched sources; different domains are legitimate when the comparison is of shape, not magnitude (this is inference, not Tufte's text).

### tufte-graphical-integrity
- **Claim:** "The representation of numbers, as physically measured on the surface of the graphic itself, should be directly proportional to the numerical quantities represented." "Show data variation, not design variation." "The number of information-carrying (variable) dimensions depicted should not exceed the number of dimensions in the data."
- **Source:** Edward Tufte, VDQI, graphical integrity principles as listed at https://guypursey.com/blog/202001041530-tufte-principles-visual-display-quantitative-information (paraphrased there; wording close to the book but treat as near-quote)
- **Prefers / forbids:** Prefers bars from a zero baseline, areas proportional to values, one visual dimension per data dimension. Forbids truncated bar axes, 3-D bars for 1-D data, icon-size scaling by both width and height, cherry-picked ranges.
- **Measurable?** yes. Bar chart: y-domain minimum ≠ 0 with bars → flag; bar pixel heights vs. labeled values → linear-fit residual (the "lie factor"); pictograms scaled in two dimensions. Must-fail: bars for 80/85/90 drawn from a 75 baseline (the 90 bar looks 3× the 80 bar). Must-pass: same values from 0. Exact.
- **Exceptions:** Line charts and dot plots may omit zero; Tufte's rule is about the *representation* being proportional.

### gestalt-proximity
- **Claim:** "Items close together are likely to be perceived as part of the same group — sharing similar functionality or traits." Proximity "can overpower competing visual cues such as similarity of color or shape."
- **Source:** Aurora Harley, NN/g, "The Principle of Proximity in Visual Design" (2020-08-02), https://www.nngroup.com/articles/gestalt-proximity/ ; IxDF: "We group closer-together elements, separating them from those farther apart." https://ixdf.org/literature/topics/gestalt-principles
- **Prefers / forbids:** Prefers related controls near each other and unrelated ones separated by whitespace; the gap within a group smaller than the gap between groups. Forbids equal spacing everywhere (no grouping), a label farther from its field than from the neighbouring field, and groupings that collapse at other breakpoints.
- **Measurable?** yes. For labelled fields: distance(label, its input) < distance(label, previous input). For a list of groups: max intra-group gap < min inter-group gap. Re-run at 3 viewports. Must-fail: form with `margin-bottom: 8px` on labels and `margin-bottom: 8px` on inputs — label equidistant from both fields. Must-pass: label 4px above its field, 24px below the previous. Mechanical.
- **Exceptions:** NN/g: the principle fails when responsive reflow breaks the groups, when items are placed far from where the user is looking, and when unrelated items are grouped so a function is "camouflaged" (e.g. an Add button inside navigation).

### gestalt-similarity
- **Claim:** "Items which share a visual characteristic are perceived as more related than items that are dissimilar." "The shared color allows clickable elements to stand out as a group"; that colour "should be reserved exclusively for interactive elements."
- **Source:** Aurora Harley, NN/g, "The Principle of Similarity" (2020-09-06), https://www.nngroup.com/articles/gestalt-similarity/ ; IxDF: "When items, objects or elements share superficial characteristics, we perceive them as grouped."
- **Prefers / forbids:** Prefers one link colour used only for links; same size = same importance; same shape = same kind. Forbids the link colour on non-interactive text, identical button styling for primary and secondary actions, promotional content styled like regular items (banner blindness).
- **Measurable?** yes. Collect the colour of `<a>`/buttons; count non-interactive text nodes with that colour. Compare computed style of the primary CTA vs. other buttons (identical → flag). Must-fail: headings in the link blue; "Delete" and "Save" both filled blue. Must-pass: link blue only on links; one filled button, others outlined. Mechanical.
- **Exceptions:** NN/g lists the failures above; no exception to the principle itself.

### gestalt-common-region
- **Claim:** "Items within a boundary are perceived as a group and assumed to share some common characteristic or functionality." Common region can override proximity. And the caution: excessive borders and coloured boxes "create visual clutter without benefit" — ask whether whitespace alone can communicate the grouping.
- **Source:** Aurora Harley, NN/g, "The Principle of Common Region" (2020-07-12), https://www.nngroup.com/articles/common-region/ ; IxDF: "We perceive elements that are in the same closed region as one group."
- **Prefers / forbids:** Prefers a border or background only where proximity cannot do the job (cards mixing image, title, meta). Forbids nested boxes, boxes around single items, full-width coloured blocks that read as the page's end ("false floors").
- **Measurable?** yes. Count bordered/filled containers holding exactly one child; nesting depth of containers; full-viewport-width blocks with a background change near the fold. Must-fail: every list item in its own card, inside a bordered section, inside a bordered page wrapper (depth 3). Must-pass: list items separated by space, one container at most. This is the same count as tufte-one-plus-one-equals-three from the perception side.
- **Exceptions:** Cards are endorsed when they unify heterogeneous content; boundaries are legitimate where proximity alone is ambiguous.

### gestalt-closure
- **Claim:** "People will fill in blanks to perceive a complete object whenever an external stimulus partially matches that object." In UI: partially visible carousel items and cut-off content signal that more exists.
- **Source:** Alita Kendrick, NN/g, "The Principle of Closure" (2021-07-18), https://www.nngroup.com/articles/principle-closure/ ; IxDF: "We prefer complete shapes, so we automatically fill the gaps between elements to perceive a complete image."
- **Prefers / forbids:** Prefers a scrollable/overflowing region to show a partial next item; icons simplified but labelled. Forbids layouts where the fold lands exactly on a section boundary (illusion of completeness) and cut-offs so small that nothing reads as continuing.
- **Measurable?** yes for the fold case. At each viewport: is there an element that crosses the viewport bottom edge (partially visible)? For horizontal scrollers: does the last visible item extend past the container edge by ≥ some px? Must-fail: at 1280×800 the hero ends at y=800 exactly and the next section starts below with a full-width colour change. Must-pass: the next section's heading is 40% visible at the fold. Mechanical per viewport; the lens must name the viewports.
- **Exceptions:** NN/g: works less well when viewport sizes are unpredictable; icons still need labels and testing.

## What this school is against

- **Ornament and non-essentials** — Rams: "products are not burdened with non-essentials" (vitsoe.com). Tufte: "interior decoration of graphics" = chartjunk (Wikipedia/VDQI).
- **Shouting through size and weight** — Vignelli: "increase the size and weight of type to make the message louder … intellectual vulgarity" (Canon p.72).
- **Typeface sprawl and type distortion** — Vignelli: desktop publishing "a cultural pollution of incomparable dimension"; "I don't believe that when you write dog the type should bark!" (Canon p.54). Butterick: "goofy fonts … system fonts", Times New Roman and Arial (practicaltypography.com).
- **Many type sizes** — Vignelli: "no more then two type sizes on a printed page" (Canon). Bringhurst: "Don't compose without a scale" (webtypography.net/3.1.1).
- **Justified and centered running text** — Vignelli: justified "fundamentally contrived"; centered only for lapidary text (Canon). Butterick: "Use centered text sparingly"; justified only with hyphenation.
- **Lines too long or too short** — Bringhurst 45–75 (66 ideal) (webtypography.net/2.1.2); Butterick 45–90 (practicaltypography.com).
- **Cramped or gappy leading** — Butterick 120–145%; Bringhurst: leading as the rhythmic unit, space added in measured intervals (webtypography.net/2.2.1, toc).
- **Untracked caps; tracked lowercase; underlines; bold+italic together; indent plus paragraph space; two spaces after a period** — Bringhurst §2.1.6/§2.1.7; Butterick summary ("Don't use both", "Put only one space between sentences").
- **Heavy gridlines, frames, 3-D, moiré, pictorial "ducks"** — Tufte, "Forgo chartjunk, including moiré vibration, the grid, and the duck" (guypursey.com); Wikipedia chartjunk list.
- **High-contrast scaffolding** — Tufte: smallest effective difference, VE p.73 (boxesandarrows.com).
- **Boxes in boxes, touching borders, clutter blamed on content** — Tufte: "Confusion and clutter are failures of design, not attributes of information" EI p.53 (boxesandarrows.com); NN/g common region: over-boxing "creates visual clutter without benefit".
- **Disproportionate representation of numbers** — Tufte graphical integrity, "Show data variation, not design variation" (guypursey.com).
- **Arbitrary placement off any grid** — Müller-Brockmann: grid gives "clearly intelligible, objective, functional" quality (archive.org text); Vignelli: "Design without discipline is anarchy" (Canon p.16).
- **Screens that need explaining** — Vignelli: "Any artifact should stand by itself in all its clarity" (Canon p.14); Rams: "At best, it is self-explanatory" (vitsoe.com).
- **Fake affordances and manufactured value** — Rams: "does not make a product more innovative, powerful or valuable than it really is" (vitsoe.com).
- **Equal spacing that hides grouping; link colour on non-links; identical styling for unequal actions** — NN/g proximity, similarity articles.

## Notes on reliability

**Verified against the author's own text (strongest):** all Rams quotes (Vitsoe is the canonical publisher of the ten principles); all Vignelli quotes (read from the RIT-hosted PDF of the Canon — page numbers are the PDF's printed page numbers); Müller-Brockmann quotes (read from the Internet Archive OCR of the 1981 Niggli edition — OCR, so minor wording drift is possible); Butterick's summary page (his own site); Bringhurst §2.1.2, §2.1.6, §2.2.1, §3.1.1 (webtypography.net reproduces the book's text verbatim by section; it is a secondary host, but the quotes are marked as Bringhurst's and match his numbering).

**Verified only through secondary quotation:** all Tufte quotes. Tufte's own site was reachable but the chartjunk notebook page is scans, not text, and the two PDF mirrors of Envisioning Information were behind a login or unreachable. Wording of the data-ink definition, the five data-ink principles, the graphical-integrity principles and "Forgo chartjunk, including moiré vibration, the grid, and the duck" agree across three independent secondary pages, so they are probably accurate; page numbers come from those pages. The "Compared to what?" line is attributed to Envisioning Information p.67 by one source and VDQI p.67 by another — the book is uncertain, the sentence is not.

**Unverified / folklore:**
- The exact wording of Tufte's "1 + 1 = 3" passage (Envisioning Information, Layering and Separation). The concept and Albers attribution are consistent across secondary sources; treat any quotation marks around it as paraphrase.
- Müller-Brockmann's "The grid system is an aid, not a guarantee" — seen only in a search snippet, not in the fetched OCR text (the OCR extract returned other sentences from the same foreword). Likely genuine; not confirmed here.
- Ellen Lupton, Thinking with Type: her site (thinkingwithtype.com) could not be read after three attempts and the Wayback Machine is blocked; only the book's letter/text/grid structure is confirmed (Typographica review). No Lupton viewpoint is listed for that reason; the "grid is a scaffold, not a cage" line seen in search snippets is unverified.
- "Bringhurst says leading should be 120%" — the number appears in search summaries (loremforge, uxuiprinciples) but not on the Bringhurst page read; webtypography.net's own text says "figures upwards of 1.3 are common". Attribute 120% to Butterick, not Bringhurst.
- Butterick's 15–25px is a web-only statement of his; it is not in the classic print canon and is disputed by many UI designers (14px systems). Keep it as Butterick's, not "typography's".

**Where the sources disagree (a lens has to pick):** line length 45–75 (Bringhurst) vs 45–90 (Butterick); caps tracking 5–10% (Bringhurst) vs 5–12% (Butterick); body leading ~1.08–1.14 in print (Vignelli's 12/13, 14/16) vs 1.2–1.45 on screen (Butterick) vs "upwards of 1.3" (webtypography.net). Nothing here contradicts on principle; the numbers are medium-dependent.

**Not measurable, deliberately:** Rams's "innovative", "aesthetic", "long-lasting", "environmentally-friendly"; Vignelli's semantics, ambiguity, intellectual elegance, timelessness; Müller-Brockmann's "aesthetic quality of mathematical thinking". They were left out of the viewpoint list rather than forced into a metric.
