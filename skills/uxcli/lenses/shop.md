# Shop and catalogue — the `shop` lens

Catalogues, search results and product pages: browse, compare, choose.

43 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** modern.signifiers-survive-flatness (Kate Moran (NN/G)); canon.gestalt-similarity (Aurora Harley, NN/g); modern.no-dead-zones-and-honest-clickability (Rauno Freiberg).

## 2. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** craft.tap-targets-and-control-height (Erik D. Kennedy); craft.growth-design-psychology-principles (Growth.Design (Dan Benoni, Louis-Xavier Lavallée)); modern.hit-targets-meet-platform-minimums (Apple).

## 3. `usability.von-restorff-one-emphasis`

One visually distinct primary action per view, left-aligned with the form, and distinguished by more than colour.

- **Source:** GOV.UK Design System, *Button component* — https://design-system.service.gov.uk/components/button/
- **In their words:** "Avoid using multiple default buttons on a single page. Having more than one main call to action reduces their impact, and makes it harder for users to know what to do next."
- **Do:** Make key actions visually distinctive; Use restraint so emphases do not compete; Align the primary button to the left edge of the form; Highlight the default, except for dangerous actions
- **Don't:** Put two or more filled primary buttons in one view; Signal emphasis by colour alone
- **Look at:** Cluster interactive elements by computed background, border and weight; the most emphatic cluster per view must have one member; primary's left edge aligns with the inputs; emphasis differs in weight, fill or border, not colour only.
- **Unless:** Do not pre-highlight a dangerous action as the default (Nielsen)
- **Also stated as:** craft.button-hierarchy-one-primary (Steve Schoger); canon.vignelli-weight-for-function-not-volume (Massimo Vignelli).

## 4. `usability.feedback-within-a-second`

Paint something within 0.1 s; keep the user's flow with a response under 1 s; show a progress indicator for anything longer.

- **Source:** Jakob Nielsen, *Response Times: The 3 Important Limits (1993)* — https://www.nngroup.com/articles/response-times-3-important-limits/ (study)
- **In their words:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **Do:** Use a progress indicator for any action over about 1 s; Use a looped indicator for 2–9 s waits; Use a percent-done indicator for 10 s or more
- **Don't:** Leave dead time with no indicator; Show a percent-done bar that lies badly
- **Look at:** Time from input event to first paint of any change; presence of a progress element, aria-busy, <progress> or role=status update when the wait exceeds 1 s.
- **Unless:** Laws of UX claims a purposeful delay can raise perceived value — an opinion with no study cited
- **Also stated as:** modern.interactions-feel-immediate-under-200ms (Rauno Freiberg); modern.density-is-value-per-time-and-space (Matthew Ström-Awn).

## 5. `usability.visibility-of-system-status`

Every action with consequences shows the user something changed, as quickly as possible, so they always know what the system is doing.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #1* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time."
- **Do:** Show a visible trace of every state change; Give feedback immediately, or as quickly as possible; Disable and label a control while its action runs
- **Don't:** Submit silently; Change state with no visible trace; Show an action's result only somewhere else
- **Look at:** Drive an action, then diff DOM or pixels over the next frames: did anything visibly change within 1 s; is there a live region, status text, spinner or busy state?
- **Unless:** Below 0.1 s no special feedback is needed beyond showing the result
- **Also stated as:** modern.feedback-is-local-and-optimistic (Rauno Freiberg).

## 6. `usability.follow-conventions`

Work the way the sites and platforms users already know; a convention beats a locally optimised novelty.

- **Source:** Jakob Nielsen, *OK-Cancel or Cancel-OK? (2008)* — https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/
- **In their words:** "Following platform conventions is more important than optimizing an individual dialog box."
- **Do:** Keep button order identical in every dialog; Highlight the most common button as default, except for dangerous actions; Prefer descriptive labels over 'OK'; Let users keep a familiar version for a while when changing
- **Don't:** Invent a new pattern for a solved problem; Vary the same control's placement between screens
- **Look at:** Logo in header links home; a search input has type=search or a search label; primary/secondary button order is the same in every dialog; cart and account icons stay where they were on other screens.
- **Unless:** Desktop apps follow their own OS: Windows OK-first, Apple OK-last
- **Also stated as:** craft.anything-but-dropdowns (Erik D. Kennedy); modern.boring-and-familiar-beats-novel (Scott Berkun).

## 7. `usability.visual-hierarchy-for-scanning`

Design for scanning, not reading: headings that out-rank body text, bold key phrases, lists, and no walls of unformatted text.

- **Source:** Kara Pernice, NN/g, *F-Shaped Pattern of Reading on the Web (2017, rev. 2026)* — https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ (study)
- **In their words:** "The F-shaped scanning pattern is bad for users and businesses."
- **Do:** Use prominent headings with information-rich opening words; Bold key phrases; employ lists and bullets; Remove unnecessary content
- **Don't:** Leave walls of unstructured text; Let headings fail to out-rank body text visually; Let visual weight contradict importance
- **Look at:** Heading font-size and weight monotonic with level (h1 ≥ h2 ≥ h3 ≥ body); longest paragraph in words; ratio of headings and list items to total text blocks.
- **Unless:** The pattern needs moderate, not high, interest — highly motivated readers read
- **Also stated as:** craft.hierarchy-is-everything-squint-test (Erik D. Kennedy).

## 8. `usability.hicks-fewer-choices-when-time-matters`

Fewer equal-weight choices at a decision point, with one recommended; but never use seven as a cap on menu length.

- **Source:** Jon Yablonski (Laws of UX), *Hick's Law — Laws of UX* — https://lawsofux.com/hicks-law/ (study)
- **In their words:** "The time it takes to make a decision increases with the number and complexity of choices."
- **Do:** Minimise choices when response time is critical; Highlight a recommended option; Keep longer menus if the alternative is abstract labels
- **Don't:** Offer many equal-weight primary actions at one decision point; Use the 'magical number seven' to justify design limits; Simplify to the point of abstraction
- **Look at:** Count same-weight primary actions in a view; count options in a select or radio group with no recommended default. A menu's item count alone is not a failure.
- **Unless:** Recognition, not recall, governs menus — length is a scan cost, not a memory cost (Nielsen)

## 9. `usability.banner-blindness-dont-style-content-like-ads`

Keep essential content and the primary action in the main column, styled like content, never in a right rail, top strip or animated coloured box.

- **Source:** Kara Pernice, NN/g, *Banner Blindness Revisited (2018)* — https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ (study)
- **In their words:** "Users have learned to ignore content that resembles ads, is close to ads, or appears in locations traditionally dedicated to ads."
- **Do:** Put essential content in the main column; Style key notices like content
- **Don't:** Put the primary CTA in the right rail or a top banner strip; Give a key notice animation, coloured background or fancy formatting; Place essential content next to real ads
- **Look at:** Is the journey's primary action or a required notice positioned in the right rail (x > 70% of desktop viewport) or in a full-width top strip with background fill and animation?
- **Unless:** On mobile, large inline ads do get fixated — the effect is weaker for inline placement

## 10. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se

## 11. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).

## 12. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 13. `usability.clearly-marked-emergency-exit`

Every interaction has a visible, labelled way out — Cancel, Back, Escape, Undo — so a mistaken action does not trap the user.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #3* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Do:** Support Undo and Redo; Show a clear Cancel or close control; Label the exit clearly and make it discoverable
- **Don't:** Open a modal with no close; Build a wizard step with no back; Ship a destructive action with no undo
- **Look at:** For each role=dialog or modal: a focusable control whose text or aria-label matches close/cancel/back, and Escape dismisses it; for each step past the first in a flow: a back control exists.
- **Unless:** Legally required interstitials — the exit must still be visible, not necessarily free of consequence

## 14. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length

## 15. `usability.mindless-clicks-not-fewer-clicks`

Do not count clicks; make each one an unambiguous choice with clear link text that says where it goes.

- **Source:** Steve Krug, *Don't Make Me Think, Revisited — chapter 4 (Krug's Second Law of Usability)* — https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf
- **In their words:** "It doesn't matter how many times I have to click, as long as each click is a mindless, unambiguous choice."
- **Do:** Write link text that identifies its target; Use breadcrumbs and hub pages for scent; Keep clear labelling with strong information scent
- **Don't:** Count clicks as the metric; Use generic links like 'Click here' or 'Learn more'
- **Look at:** Count links and buttons whose text is generic ('Click here', 'Learn more', 'Read more', bare 'Next') or duplicates another link's text with a different target; do not measure path length.
- **Unless:** Fewer clicks matter more when the same path is drilled repeatedly or pages take long to load (Krug)

## 16. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 17. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); canon.rams-as-little-design-as-possible (Dieter Rams); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); canon.tufte-smallest-effective-difference (Edward Tufte); canon.tufte-one-plus-one-equals-three (Edward Tufte).

## 18. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 19. `craft.separation-order-space-then-lines-then-boxes`

Use the lightest separator that works: more space first, then a keyline or background band, and a box only for the object that is acted on.

- **Source:** Adam Wathan & Steve Schoger; Erik D. Kennedy, *Refactoring UI (fewer-borders tactic); 7 Rules for Creating Gorgeous UI, Part 1* — https://www.refactoringui.com/ (folklore: the wording is not verified)
- **Do:** Separate with whitespace by default; Add a keyline or background band only when space alone fails; Box only the object a person acts on
- **Don't:** Reach for a card or border first
- **Look at:** Between sibling groups, record which separator is used: gap at least 2x the inner gap (space), hr or border-bottom (line), bordered or shadowed wrapper (box); report the inner/outer gap ratio.
- **Unless:** Dense data such as tables where zebra stripes or keylines are used; Interactive cards that are the unit of action

## 20. `craft.de-emphasize-to-emphasize-up-pop-down-pop`

To emphasize, quiet the competitors as much as you loudify the hero; never stack every up-pop property on non-title elements.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 2* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html
- **In their words:** "If an element needs emphasis, apply BOTH up-pop and down-pop styles — but slightly MORE up-pop."
- **Do:** Set big numbers light and lower-contrast; Set small labels uppercase and bold; Make the competitor quieter rather than the hero louder
- **Don't:** Stack big, bold, bright and uppercase on any element that is not the page title
- **Look at:** Flag text at 2x body size or more that is also font-weight 700+, full contrast and uppercase, when it is not the page h1.
- **Unless:** The page title may be all-out up-pop

## 21. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple).

## 22. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 23. `craft.start-with-too-much-whitespace`

Start with far more breathing room than feels necessary and remove it until it works; browser-default spacing is the largest mistake.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 1* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html
- **In their words:** "To make UI that looks designed, add a lot of breathing room. … Sometimes a ridiculous amount."
- **Do:** Pad controls at least the text's own height; Space list and nav items twice the text height; Separate groups with much more space than sits within them
- **Don't:** Ship browser-default spacing with everything smashed toward the top
- **Look at:** Ratio of vertical padding to font-size on list items, nav items and buttons; ratio of gap between groups to gap within a group.
- **Unless:** Dense professional, interaction-heavy tools may compress, but spacing must stay consistent

## 24. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size

## 25. `craft.black-and-white-first-limit-hues`

Design in greyscale first, then add one accent hue with purpose; vary by saturation and brightness, not by more hues.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 1* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html
- **In their words:** "Design black and white first … Add color last, and even then, only with purpose."
- **Do:** Use greyscale plus one or two accent hues; Vary colour by saturation and brightness within a hue
- **Don't:** Use complementary or triadic colour-theory palettes as UI palettes; Give each section its own hue
- **Look at:** Cluster computed colours with saturation above 25% by hue within 15 degrees; count clusters, excluding declared semantic states such as error, success and warning.
- **Unless:** Sporty, flashy or cartoony brands that need a colour-fluent designer; Data-visualisation palettes

## 26. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face

## 27. `canon.vignelli-grid-module-fits-the-job`

Lay everything on one grid whose module is coarse enough to constrain and fine enough to serve the content.

- **Source:** Massimo Vignelli, *The Vignelli Canon, Grids, Margins, Columns and Modules (p.40)* — https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf
- **In their words:** "There are infinite kinds of grids, but just one - the most appropriate - for any problem"
- **Do:** Resolve block edges to a few column positions; Choose one column model per page
- **Don't:** Place blocks at arbitrary x positions; Use a grid so fine it constrains nothing
- **Look at:** Distinct left-edge x positions of top-level blocks and their fit to the best k-column model (residual within 2px).
- **Unless:** Outside margins may be made deliberately small to give tension between page edge and content

## 28. `canon.bringhurst-letterspace-caps-5-10`

Letterspace all-caps and small-caps runs by 5–10% of the type size; do not letterspace lowercase.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.1.6 / §2.1.7 (via webtypography.net)* — http://webtypography.net/2.1.6
- **In their words:** "The normal value for letterspacing these sequences of small or full caps is 5% to 10% of the type size."
- **Do:** Set letter-spacing 0.05–0.1em on caps labels, eyebrows and buttons
- **Don't:** All-caps at zero tracking; Tracked lowercase body text
- **Look at:** For text with text-transform uppercase or all-caps content of ≥3 letters: computed letter-spacing divided by font-size; same ratio on lowercase paragraphs.
- **Unless:** Display type at large sizes may be tracked tighter (not stated on the fetched page)

## 29. `modern.cards-are-a-choice-not-a-default`

Cards are for browsing; use lists for searching and tables for comparing, and keep each card readable with one primary action.

- **Source:** Stan Kirilov, *UI Card Design (StanVision journal)* — https://www.stan.vision/journal/ui-card-design-examples-best-practices-and-common-patterns (secondary)
- **In their words:** "Cards for browsing. Lists for searching. Tables for comparing."
- **Do:** Lists for ranked or homogeneous data, tables for comparison; Consistent card heights; The title as the link, with a pseudo-element extending the hit area
- **Don't:** Card grids for search results and settings; Whole-card anchor wrappers; More than 3 clickable elements per card; Nested cards
- **Look at:** Detect card grids (3+ siblings with equal border, shadow and radius); fail on text under 14px, over 3 interactive descendants per card, row heights differing over 20%, or an anchor wrapping more than heading plus paragraph.
- **Unless:** Masonry where variable height is the design choice; Media browsing such as Netflix or Pinterest

## 30. `modern.frequent-actions-do-not-animate`

Actions used many times a day, and anything keyboard-triggered, appear instantly without an enter animation.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Actions that are frequent and low in novelty should avoid extraneous animations: opening a right click menu, deleting or adding items from a list, hovering trivial buttons"
- **Do:** Show context menus, command palettes and list changes instantly; Leave keyboard-driven navigation unanimated
- **Don't:** Opacity and scale fades on controls used hundreds of times a day; Animating keyboard-initiated actions
- **Look at:** Enter animations on [role=menu], [cmdk-root] and newly inserted list items (animation-name not none), and animation state diffed within 16ms of a dispatched key; which actions count as frequent comes from the journey.
- **Unless:** macOS context menus fade out and blink the chosen item; Rare features may be theatrical (delight-impact curve)
- **Also stated as:** modern.delight-scales-with-rarity (Benji Taylor).

## 31. `modern.no-junk-drawer-menus-or-unlabeled-icons`

Icons carry labels, menus are named for what they hold, and no primary feature hides under More or an ellipsis.

- **Source:** Jakob Nielsen (NN/G), *Top 10 Application-Design Mistakes* — https://www.nngroup.com/articles/top-10-application-design-mistakes/
- **In their words:** "most icons, unless they have a text label next to them, will be difficult or impossible for users to understand"
- **Do:** Labelled icons; Menus named for their contents; Inline help before tooltips
- **Don't:** More, ellipsis or Tools catch-alls holding primary features; Icon-only toolbars without labels; Tooltips on disabled buttons
- **Look at:** Icon-only buttons with no text and no aria-label fail; menus triggered by More, …, Tools or Options holding over 5 items or a primary-action label warn; disabled buttons with title or aria-describedby fail.
- **Unless:** Universally recognised icons in tight toolbars, though even the hamburger is weaker than designers think
- **Also stated as:** usability.dont-make-me-think (Steve Krug).

## 32. `modern.motion-values-proportional-to-trigger`

Scale and fade motion starts near its resting size, in proportion to the trigger, never from zero or a heavy squash.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Don't animate dialog scale in from 0 → 1, fade opacity and scale from ~0.8. Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so."
- **Do:** Enter dialogs and popovers from scale 0.8–0.97 with opacity; Press buttons to about scale 0.96–0.97
- **Don't:** Scale-from-zero pops on dialogs; Press states that squash a button to 0.8 or below
- **Look at:** Parse @keyframes and WAAPI keyframes on dialogs, popovers and buttons and read the starting scale(); :active transforms below about 0.9 fail.
- **Unless:** Elements that genuinely originate from a point, such as a FAB expanding into a sheet, can grow from small

## 33. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 34. `modern.motion-has-an-origin`

A popover or menu animates from the side facing its trigger; set transform-origin where the motion physically starts.

- **Source:** Emil Kowalski, *Good vs Great Animations* — https://emilkowal.ski/ui/good-vs-great-animations
- **In their words:** "When we click on a button that opens a dropdown, we expect the dropdown to animate from where the button is"
- **Do:** Set transform-origin toward the trigger; Use the anchoring library's origin variable when one exists
- **Don't:** Popovers scaling from their own centre when anchored to a button
- **Look at:** For each open popover or menu with a known trigger (aria-controls or aria-haspopup), compare the computed transform-origin with the side facing the trigger.
- **Unless:** Centred modals have no anchor; a centred origin is right there

## 35. `modern.honour-prefers-reduced-motion`

Every large motion has a reduced variant under prefers-reduced-motion; fade instead of slide rather than ignoring the setting.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "our animations need to account for people who don't want animations"
- **Do:** Provide a reduced variant such as a fade instead of a slide; Give autoplaying motion over five seconds pause, stop or hide controls
- **Don't:** Large translate or scale motion that ignores the media query
- **Look at:** Emulate prefers-reduced-motion: reduce and list elements whose computed animation-name or transition-property still includes translations over about 20px or durations above zero.
- **Unless:** Motion that is the content, such as a video or a chart drawing, is out of scope

## 36. `modern.animations-are-interruptible`

An open or close animation can be reversed mid-flight by the next input; nothing waits for a transition to finish.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "Great animations are interruptible"
- **Do:** Use CSS transitions that reverse mid-flight, or spring libraries
- **Don't:** pointer-events: none locks while an animation plays; Keyframe-driven open and close that must finish before the next input
- **Look at:** Open a panel, immediately send the close input, sample the element's bounding box about 50ms later; if it is still growing the animation was not interruptible. Depends on timing tolerance.
- **Unless:** Destructive commits that fire only on gesture end are about triggering, not interruptibility

## 37. `modern.readable-type-sizes-and-weights`

Body text sits at the platform default size, weights stay 400 or heavier, and weight never changes on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font weights below 400 should not be used"
- **Do:** 17px body on touch, 13px minimum on desktop UI; Weights between 400 and 700; Headings at weight 500–600; Minimise the number of typefaces
- **Don't:** Body text under 11pt; font-weight 300 or lower; Weight swaps on hover or selected state
- **Look at:** Computed font-size and font-weight of every text node at a phone viewport; count distinct font-family stacks and warn above 2.
- **Unless:** Captions and legal text may sit at the platform minimum; Display headings may use light weights at large sizes

## 38. `modern.mobile-inputs-do-not-zoom-or-trap`

Inputs are at least 16px on phones, never autofocus on touch, and the page never disables zoom or blocks paste.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus"
- **Do:** Set type, inputmode and autocomplete on every input; Use touch-action: manipulation on controls
- **Don't:** Viewport meta with user-scalable=no; Paste handlers that preventDefault; autofocus at phone widths
- **Look at:** Computed font-size of input, select and textarea at a 390px viewport under 16px; viewport meta containing user-scalable=no; paste handlers that preventDefault; [autofocus] present at phone width.
- **Unless:** Desktop-only admin tools; Autofocus on desktop with a single primary input

## 39. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 40. `modern.every-state-is-designed`

Empty, sparse, dense, error and loading states are designed; skeletons match final layout and long content never overflows.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "MUST: Design empty/sparse/dense/error states"
- **Do:** An empty state with a primary create action; Skeletons sized like real rows; min-w-0 and truncation on flex children
- **Don't:** Blank screens on empty arrays; Spinners that reflow content; Overflow from long strings
- **Look at:** Render with [], with 1 item, with 500 items and with a 300-character title; assert no horizontal overflow, no overlap, an actionable control in the empty state, and skeleton-to-loaded CLS under a threshold.

## 41. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers

## 42. `modern.shadows-share-one-light-source`

All shadows on a page share one light direction and offset ratio, layered and tinted toward the background hue.

- **Source:** Josh W. Comeau, *Designing Beautiful Shadows in CSS* — https://www.joshwcomeau.com/css/designing-shadows/
- **In their words:** "every shadow on the page should share the same ratio"
- **Do:** A tokenised elevation scale; Two to five layered shadows; Shadow colour matched to the background hue
- **Don't:** Fuzzy grey boxes; Shadows with inconsistent x:y ratios across the page; Pure-black high-alpha shadows; Blurry borders used as separators
- **Look at:** Collect every computed box-shadow; fail when offset signs mix across the page or distinct shadow strings exceed about 6; warn when shadow hue is far from the background hue with alpha above 0.5.
- **Unless:** Inset shadows for sunken fields; Glows meant as glows

## 43. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour
