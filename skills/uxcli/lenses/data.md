# Data and dashboards — the `data` lens

Dashboards, analytics, monitoring and reports: numbers and charts read again and again.

40 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.feedback-within-a-second`

Paint something within 0.1 s; keep the user's flow with a response under 1 s; show a progress indicator for anything longer.

- **Source:** Jakob Nielsen, *Response Times: The 3 Important Limits (1993)* — https://www.nngroup.com/articles/response-times-3-important-limits/ (study)
- **In their words:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **Do:** Use a progress indicator for any action over about 1 s; Use a looped indicator for 2–9 s waits; Use a percent-done indicator for 10 s or more
- **Don't:** Leave dead time with no indicator; Show a percent-done bar that lies badly
- **Look at:** Time from input event to first paint of any change; presence of a progress element, aria-busy, <progress> or role=status update when the wait exceeds 1 s.
- **Unless:** Laws of UX claims a purposeful delay can raise perceived value — an opinion with no study cited
- **Also stated as:** modern.interactions-feel-immediate-under-200ms (Rauno Freiberg); modern.density-is-value-per-time-and-space (Matthew Ström-Awn).

## 2. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** modern.signifiers-survive-flatness (Kate Moran (NN/G)); modern.no-dead-zones-and-honest-clickability (Rauno Freiberg).

## 3. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** craft.tap-targets-and-control-height (Erik D. Kennedy); modern.hit-targets-meet-platform-minimums (Apple).

## 4. `usability.visibility-of-system-status`

Every action with consequences shows the user something changed, as quickly as possible, so they always know what the system is doing.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #1* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time."
- **Do:** Show a visible trace of every state change; Give feedback immediately, or as quickly as possible; Disable and label a control while its action runs
- **Don't:** Submit silently; Change state with no visible trace; Show an action's result only somewhere else
- **Look at:** Drive an action, then diff DOM or pixels over the next frames: did anything visibly change within 1 s; is there a live region, status text, spinner or busy state?
- **Unless:** Below 0.1 s no special feedback is needed beyond showing the result
- **Also stated as:** modern.feedback-is-local-and-optimistic (Rauno Freiberg).

## 5. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se

## 6. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).

## 7. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length
- **Also stated as:** craft.law-of-locality (Erik D. Kennedy).

## 8. `usability.omit-needless-words`

Cut word count by half: no happy-talk intros, no instruction paragraphs before forms, no marketese, sentence case everywhere.

- **Source:** Jakob Nielsen, *How Users Read on the Web (1997)* — https://www.nngroup.com/articles/how-users-read-on-the-web/ (study)
- **In their words:** "People rarely read Web pages word by word; instead, they scan the page"
- **Do:** Reduce word count by half compared to traditional writing; Limit paragraphs to one idea each; Use sentence case everywhere except proper nouns
- **Don't:** Open with welcome or happy talk; Put instruction paragraphs before forms; Use promotional language ('marketese'); Set labels in ALL CAPS or Title Case
- **Look at:** Word count between a form's heading and its first input; word count of blocks starting 'Welcome' or 'Thank you for'; buttons and labels in all caps or Title Case; sentence count in instructions.
- **Unless:** Nielsen also asks for outbound links to build trust — brevity is not zero text

## 9. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 10. `usability.clearly-marked-emergency-exit`

Every interaction has a visible, labelled way out — Cancel, Back, Escape, Undo — so a mistaken action does not trap the user.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #3* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Do:** Support Undo and Redo; Show a clear Cancel or close control; Label the exit clearly and make it discoverable
- **Don't:** Open a modal with no close; Build a wizard step with no back; Ship a destructive action with no undo
- **Look at:** For each role=dialog or modal: a focusable control whose text or aria-label matches close/cancel/back, and Escape dismisses it; for each step past the first in a flow: a back control exists.
- **Unless:** Legally required interstitials — the exit must still be visible, not necessarily free of consequence

## 11. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 12. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); canon.rams-as-little-design-as-possible (Dieter Rams); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); canon.tufte-smallest-effective-difference (Edward Tufte); canon.tufte-one-plus-one-equals-three (Edward Tufte).

## 13. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 14. `craft.separation-order-space-then-lines-then-boxes`

Use the lightest separator that works: more space first, then a keyline or background band, and a box only for the object that is acted on.

- **Source:** Adam Wathan & Steve Schoger; Erik D. Kennedy, *Refactoring UI (fewer-borders tactic); 7 Rules for Creating Gorgeous UI, Part 1* — https://www.refactoringui.com/ (folklore: the wording is not verified)
- **Do:** Separate with whitespace by default; Add a keyline or background band only when space alone fails; Box only the object a person acts on
- **Don't:** Reach for a card or border first
- **Look at:** Between sibling groups, record which separator is used: gap at least 2x the inner gap (space), hr or border-bottom (line), bordered or shadowed wrapper (box); report the inner/outer gap ratio.
- **Unless:** Dense data such as tables where zebra stripes or keylines are used; Interactive cards that are the unit of action

## 15. `craft.de-emphasize-to-emphasize-up-pop-down-pop`

To emphasize, quiet the competitors as much as you loudify the hero; never stack every up-pop property on non-title elements.

- **Source:** Erik D. Kennedy, *7 Rules for Creating Gorgeous UI, Part 2* — https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html
- **In their words:** "If an element needs emphasis, apply BOTH up-pop and down-pop styles — but slightly MORE up-pop."
- **Do:** Set big numbers light and lower-contrast; Set small labels uppercase and bold; Make the competitor quieter rather than the hero louder
- **Don't:** Stack big, bold, bright and uppercase on any element that is not the page title
- **Look at:** Flag text at 2x body size or more that is also font-weight 700+, full contrast and uppercase, when it is not the page h1.
- **Unless:** The page title may be all-out up-pop

## 16. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple).

## 17. `craft.dont-overlook-empty-states-teach-by-example`

Design the first-load and empty states with sample data or an example, a message and a call to action; never a blank page.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "Use the 'first load' experience to provide sample data, showing by example what the properly-working app will look like"
- **Do:** Show a designed empty state with message, example and call to action; Seed sample data on first load; Show examples rather than descriptions
- **Don't:** Show a totally blank page on first load; Show a table header with no rows and no message
- **Look at:** In the journey's declared empty state, find list or table containers with 0 data children; require a visible sentence inside or adjacent and at least one actionable element.
- **Unless:** Zero-hit search results need a message but no sample data; Transient loading states
- **Also stated as:** modern.every-state-is-designed (Vercel Labs).

## 18. `craft.hierarchy-is-everything-squint-test`

Squint: the most important thing must catch the eye first and the least important last; one element dominates each screen.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "If you squint your eyes, the Most Important Thing should catch your eye first – and the least important elements should catch your eye last."
- **Do:** Give each screen one dominant element; Emphasize the most-used functionality; De-emphasize, hide or remove the rarely used
- **Don't:** Make the primary action grey and unnoticeable beside a bigger, brighter Help; Render two identical grey buttons where one is the main action
- **Look at:** Given a declared primary action, score every interactive element as area x contrast x font-weight factor; the declared primary must rank first, and no set of buttons may sit within 10% of each other.
- **Unless:** Page titles are the only element styled all-out up-pop; A browsing page such as a gallery may have no single most important thing

## 19. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 20. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size

## 21. `craft.align-with-readability-in-mind`

Keep few strong left edges, right-align comparable numbers with tabular figures, and hang punctuation so edges line up.

- **Source:** Steve Schoger, *Little UI Details (tweet, 15 Jun 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Aligning text is an easy way to clean up your design and make your content much more scannable."
- **Do:** Keep few, strong left edges; Right-align numeric columns with tabular figures; Hang bullets, icons and punctuation so text edges align
- **Don't:** Align a right-aligned image to ragged left-aligned text; Centre columns of numbers
- **Look at:** Count distinct left-edge x positions of text blocks in a container at 1px tolerance; for td cells matching a number or currency pattern, text-align must be right or end and tabular figures must be set.
- **Unless:** IDs, ZIP codes and phone numbers stay left-aligned; Centred layouts under 3 lines

## 22. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face
- **Also stated as:** canon.mb-grid-fields-from-columns-and-lines (Josef Müller-Brockmann).

## 23. `canon.tufte-data-ink-ratio`

Show the data; erase ink that does not change when the data changes, and ink that repeats it.

- **Source:** Edward Tufte, *The Visual Display of Quantitative Information (1983), pp.106–121* — https://guypursey.com/blog/202001041530-tufte-principles-visual-display-quantitative-information (secondary)
- **In their words:** "Above all else show the data. Maximize the data-ink ratio. Erase non-data-ink. Erase redundant data-ink. Revise and edit."
- **Do:** Label values directly on marks; Keep gridlines few and lighter than data
- **Don't:** Gridlines heavier than data; Boxed plot areas and redundant axes; Legends that repeat labels; One value said four ways
- **Look at:** In an SVG/canvas chart: non-data elements (gridlines, frames, ticks, legend entries) versus data elements (bars, points, path segments); stroke weight of gridlines versus data marks.
- **Unless:** Maximize the data-ink ratio, within reason; Principles should not be applied rigidly; better to violate any than place graceless marks
- **Also stated as:** canon.tufte-forgo-chartjunk (Edward Tufte).

## 24. `canon.tufte-small-multiples`

Compare with repeated same-scale panels, not one overloaded chart.

- **Source:** Edward Tufte, *Envisioning Information (1990), p.67* — https://www.antoinebuteau.com/lessons-from-edward-tufte/ (secondary)
- **In their words:** "At the heart of quantitative reasoning is a single question: Compared to what?"
- **Do:** Same width, height, axis domain and encoding across sibling panels; Index panels by category or time
- **Don't:** One chart with many overlaid series; Comparison panels with differing axis scales
- **Look at:** For sibling charts: equal size, equal axis domain (tick labels or scale attributes), same mark encoding. For one chart: number of overlaid series (more than 5 is a candidate).
- **Unless:** Different domains are legitimate when the comparison is of shape, not magnitude (inference, not Tufte's text)

## 25. `canon.tufte-graphical-integrity`

The size of a mark is directly proportional to the number it shows; bars start at zero; one visual dimension per data dimension.

- **Source:** Edward Tufte, *The Visual Display of Quantitative Information (1983), graphical integrity* — https://guypursey.com/blog/202001041530-tufte-principles-visual-display-quantitative-information (secondary)
- **In their words:** "Show data variation, not design variation."
- **Do:** Bars from a zero baseline; Areas proportional to values
- **Don't:** Truncated bar axes; 3-D bars for 1-D data; Pictograms scaled in both width and height; Cherry-picked ranges
- **Look at:** Bar charts whose y-domain minimum is not 0; linear-fit residual of bar pixel heights against labelled values (lie factor); pictograms scaled in two dimensions.
- **Unless:** Line charts and dot plots may omit zero; the rule is about the representation being proportional

## 26. `modern.no-junk-drawer-menus-or-unlabeled-icons`

Icons carry labels, menus are named for what they hold, and no primary feature hides under More or an ellipsis.

- **Source:** Jakob Nielsen (NN/G), *Top 10 Application-Design Mistakes* — https://www.nngroup.com/articles/top-10-application-design-mistakes/
- **In their words:** "most icons, unless they have a text label next to them, will be difficult or impossible for users to understand"
- **Do:** Labelled icons; Menus named for their contents; Inline help before tooltips
- **Don't:** More, ellipsis or Tools catch-alls holding primary features; Icon-only toolbars without labels; Tooltips on disabled buttons
- **Look at:** Icon-only buttons with no text and no aria-label fail; menus triggered by More, …, Tools or Options holding over 5 items or a primary-action label warn; disabled buttons with title or aria-describedby fail.
- **Unless:** Universally recognised icons in tight toolbars, though even the hamburger is weaker than designers think
- **Also stated as:** usability.dont-make-me-think (Steve Krug); craft.labels-are-a-last-resort (Steve Schoger (attendee notes by ynotdraw)).

## 27. `modern.cards-are-a-choice-not-a-default`

Cards are for browsing; use lists for searching and tables for comparing, and keep each card readable with one primary action.

- **Source:** Stan Kirilov, *UI Card Design (StanVision journal)* — https://www.stan.vision/journal/ui-card-design-examples-best-practices-and-common-patterns (secondary)
- **In their words:** "Cards for browsing. Lists for searching. Tables for comparing."
- **Do:** Lists for ranked or homogeneous data, tables for comparison; Consistent card heights; The title as the link, with a pseudo-element extending the hit area
- **Don't:** Card grids for search results and settings; Whole-card anchor wrappers; More than 3 clickable elements per card; Nested cards
- **Look at:** Detect card grids (3+ siblings with equal border, shadow and radius); fail on text under 14px, over 3 interactive descendants per card, row heights differing over 20%, or an anchor wrapping more than heading plus paragraph.
- **Unless:** Masonry where variable height is the design choice; Media browsing such as Netflix or Pinterest

## 28. `modern.frequent-actions-do-not-animate`

Actions used many times a day, and anything keyboard-triggered, appear instantly without an enter animation.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Actions that are frequent and low in novelty should avoid extraneous animations: opening a right click menu, deleting or adding items from a list, hovering trivial buttons"
- **Do:** Show context menus, command palettes and list changes instantly; Leave keyboard-driven navigation unanimated
- **Don't:** Opacity and scale fades on controls used hundreds of times a day; Animating keyboard-initiated actions
- **Look at:** Enter animations on [role=menu], [cmdk-root] and newly inserted list items (animation-name not none), and animation state diffed within 16ms of a dispatched key; which actions count as frequent comes from the journey.
- **Unless:** macOS context menus fade out and blink the chosen item; Rare features may be theatrical (delight-impact curve)
- **Also stated as:** modern.delight-scales-with-rarity (Benji Taylor).

## 29. `modern.motion-values-proportional-to-trigger`

Scale and fade motion starts near its resting size, in proportion to the trigger, never from zero or a heavy squash.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Don't animate dialog scale in from 0 → 1, fade opacity and scale from ~0.8. Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so."
- **Do:** Enter dialogs and popovers from scale 0.8–0.97 with opacity; Press buttons to about scale 0.96–0.97
- **Don't:** Scale-from-zero pops on dialogs; Press states that squash a button to 0.8 or below
- **Look at:** Parse @keyframes and WAAPI keyframes on dialogs, popovers and buttons and read the starting scale(); :active transforms below about 0.9 fail.
- **Unless:** Elements that genuinely originate from a point, such as a FAB expanding into a sheet, can grow from small

## 30. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 31. `modern.motion-has-an-origin`

A popover or menu animates from the side facing its trigger; set transform-origin where the motion physically starts.

- **Source:** Emil Kowalski, *Good vs Great Animations* — https://emilkowal.ski/ui/good-vs-great-animations
- **In their words:** "When we click on a button that opens a dropdown, we expect the dropdown to animate from where the button is"
- **Do:** Set transform-origin toward the trigger; Use the anchoring library's origin variable when one exists
- **Don't:** Popovers scaling from their own centre when anchored to a button
- **Look at:** For each open popover or menu with a known trigger (aria-controls or aria-haspopup), compare the computed transform-origin with the side facing the trigger.
- **Unless:** Centred modals have no anchor; a centred origin is right there

## 32. `modern.honour-prefers-reduced-motion`

Every large motion has a reduced variant under prefers-reduced-motion; fade instead of slide rather than ignoring the setting.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "our animations need to account for people who don't want animations"
- **Do:** Provide a reduced variant such as a fade instead of a slide; Give autoplaying motion over five seconds pause, stop or hide controls
- **Don't:** Large translate or scale motion that ignores the media query
- **Look at:** Emulate prefers-reduced-motion: reduce and list elements whose computed animation-name or transition-property still includes translations over about 20px or durations above zero.
- **Unless:** Motion that is the content, such as a video or a chart drawing, is out of scope

## 33. `modern.animations-are-interruptible`

An open or close animation can be reversed mid-flight by the next input; nothing waits for a transition to finish.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "Great animations are interruptible"
- **Do:** Use CSS transitions that reverse mid-flight, or spring libraries
- **Don't:** pointer-events: none locks while an animation plays; Keyframe-driven open and close that must finish before the next input
- **Look at:** Open a panel, immediately send the close input, sample the element's bounding box about 50ms later; if it is still growing the animation was not interruptible. Depends on timing tolerance.
- **Unless:** Destructive commits that fire only on gesture end are about triggering, not interruptibility

## 34. `modern.readable-type-sizes-and-weights`

Body text sits at the platform default size, weights stay 400 or heavier, and weight never changes on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Font weights below 400 should not be used"
- **Do:** 17px body on touch, 13px minimum on desktop UI; Weights between 400 and 700; Headings at weight 500–600; Minimise the number of typefaces
- **Don't:** Body text under 11pt; font-weight 300 or lower; Weight swaps on hover or selected state
- **Look at:** Computed font-size and font-weight of every text node at a phone viewport; count distinct font-family stacks and warn above 2.
- **Unless:** Captions and legal text may sit at the platform minimum; Display headings may use light weights at large sizes

## 35. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 36. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers

## 37. `modern.shadows-share-one-light-source`

All shadows on a page share one light direction and offset ratio, layered and tinted toward the background hue.

- **Source:** Josh W. Comeau, *Designing Beautiful Shadows in CSS* — https://www.joshwcomeau.com/css/designing-shadows/
- **In their words:** "every shadow on the page should share the same ratio"
- **Do:** A tokenised elevation scale; Two to five layered shadows; Shadow colour matched to the background hue
- **Don't:** Fuzzy grey boxes; Shadows with inconsistent x:y ratios across the page; Pure-black high-alpha shadows; Blurry borders used as separators
- **Look at:** Collect every computed box-shadow; fail when offset signs mix across the page or distinct shadow strings exceed about 6; warn when shadow hue is far from the background hue with alpha above 0.5.
- **Unless:** Inset shadows for sunken fields; Glows meant as glows

## 38. `modern.glass-and-blur-earn-their-place`

Translucency is for chrome over busy backgrounds with heavy blur and a contrast fallback, never for body content or decoration.

- **Source:** Megan Brown (NN/G), *Glassmorphism: Definition and Best Practices* — https://www.nngroup.com/articles/glassmorphism/
- **In their words:** "glassmorphism is best when utilized sparingly to create an illusion of depth"
- **Do:** Glass on toolbars and menus only; Heavy blur over intricate backgrounds; A solid fallback under increased contrast
- **Don't:** Glass cards for body content; Low blur over photos; Text whose contrast depends on what scrolls beneath it; Glass with a neon glow as decoration
- **Look at:** For each element with backdrop-filter, sample contained-text contrast against the composited background at three scroll positions; any under 4.5:1 fails; blur under 12px over an image warns; body text over 2 lines inside glass warns.
- **Unless:** OS-level materials that honour the user's Reduce Transparency setting

## 39. `modern.boring-and-familiar-beats-novel`

Reuse known controls, gestures and semantics; a novel interaction needs a standard alternative and a reason.

- **Source:** Scott Berkun, *The future of UI will be boring* — https://scottberkun.com/2010/the-future-of-ui-will-be-boring/
- **In their words:** "The rookie trap designers and technologists fall for is confusing cool with useful"
- **Do:** Native semantics and known gestures; An anchor for every link; Standard menus and selects
- **Don't:** Novel gestures without a tap or keyboard alternative; Custom scroll hijacking; Reinvented selects
- **Look at:** Custom widgets acting as select or menu with no role or keyboard handling fail; wheel or overscroll listeners calling preventDefault on document warn; drag-only affordances with no button alternative fail.
- **Unless:** Deliberate departures with a point of view in place before the first component went down

## 40. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour
