# Lens research — usability and psychology

Researched 2026-09-29 for the uxcli "lenses" idea: packaged viewpoints from named UX researchers, each with a source, that an agent applies to a UI it just built. This cluster covers Nielsen, Norman, Krug, Laws of UX, NN/g field findings, Baymard, Wroblewski and GOV.UK.

Scope note: uxcli's four flow probes already map to Nielsen heuristics #4 (`consistent-navigation`), #5 (`error-prevention`), #6 (`redundant-entry`) and #9 (`error-identification`). Those four are referenced below only where another author adds something concrete; the entries focus on the other six heuristics and on the other schools.

Every URL in this file was fetched on 2026-09-29 unless marked **unverified**. Quotes are verbatim from the fetched page; paraphrase is unquoted.

## Sources fetched

| source | author | URL (fetched) | what it is |
|---|---|---|---|
| 10 Usability Heuristics for User Interface Design (1994, rev. 2024) | Jakob Nielsen | https://www.nngroup.com/articles/ten-usability-heuristics/ | The canonical list with per-heuristic tips |
| Response Times: The 3 Important Limits (1993) | Jakob Nielsen | https://www.nngroup.com/articles/response-times-3-important-limits/ | 0.1 s / 1 s / 10 s limits, from *Usability Engineering* ch. 5 |
| Progress Indicators Make a Slow System Less Insufferable (2014) | Katie Sherwin, NN/g | https://www.nngroup.com/articles/progress-indicators/ | When to show looped vs percent-done indicators |
| Short-Term Memory and Web Usability (2009) | Jakob Nielsen | https://www.nngroup.com/articles/short-term-memory-and-web-usability/ | Why 7±2 does not limit menu length |
| How Users Read on the Web (1997) | Jakob Nielsen | https://www.nngroup.com/articles/how-users-read-on-the-web/ | 79 % scan; concise + scannable + objective = 124 % better |
| F-Shaped Pattern of Reading on the Web (2017, rev. 2026) | Kara Pernice, NN/g | https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ | Eyetracking scan pattern and how to defeat it |
| Flat UI Elements Attract Less Attention and Cause Uncertainty (2017) | Kate Moran, NN/g | https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ | 71-participant eyetracking study, strong vs weak signifiers |
| Flat Design: Its Origins, Its Problems… (2015) | Kate Moran, NN/g | https://www.nngroup.com/articles/flat-design/ | Background essay; "Flat 2.0" |
| Beyond Blue Links: Making Clickable Elements Recognizable (2015) | Hoa Loranger, NN/g | https://www.nngroup.com/articles/clickable-elements/ | Guidelines for clickability signifiers |
| The 3-Click Rule for Navigation Is False (2019) | Page Laubheimer, NN/g | https://www.nngroup.com/articles/3-click-rule/ | Myth debunk, cites Porter |
| Testing the Three-Click Rule (2003) | Joshua Porter, UIE | https://articles.centercentre.com/three_click_rule/ | 44 users, 620 tasks, 8,000+ clicks |
| Banner Blindness Revisited (2018) | Kara Pernice, NN/g | https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ | Eyetracking, 26 participants |
| Placeholders in Form Fields Are Harmful (2014) | Katie Sherwin, NN/g | https://www.nngroup.com/articles/form-design-placeholders/ | Seven problems with placeholder-as-label |
| Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013) | Marieke McCloskey, NN/g | https://www.nngroup.com/articles/form-design-white-space/ | Label position, grouping, proximity |
| OK-Cancel or Cancel-OK? (2008) | Jakob Nielsen | https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/ | Button order, platform convention trumps |
| Fitts's Law and Its Applications in UX (2022) | Raluca Budiu, NN/g | https://www.nngroup.com/articles/fitts-law/ | Formula and UI implications |
| Touch Targets on Touchscreens (2019) | Aurora Harley, NN/g | https://www.nngroup.com/articles/touch-target-size/ | ≥ 1 cm × 1 cm, from Parhi/Karlson/Bederson 2006 |
| The Aesthetic-Usability Effect (2024, rev. 2026) | Kate Moran, NN/g | https://www.nngroup.com/articles/aesthetic-usability-effect/ | Kurosu & Kashimura 1995, limits of the effect |
| Signifiers, not affordances (2008, ACM *Interactions* 15/6) | Don Norman | https://jnd.org/signifiers-not-affordances/ | Norman's own definitions |
| The Design of Everyday Things, revised edition (book page) | Don Norman | https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/ | TOC: affordances, signifiers, mapping, feedback, conceptual model, "The Problem with Doors" |
| The Design of Everyday Things (encyclopedia summary) | Wikipedia | https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things | Principles, gulfs of execution/evaluation, Norman doors |
| Affordances (topic page) | IxDF | https://ixdf.org/literature/topics/affordances | Norman quote; false vs hidden affordances |
| Norman Doors: Don't Know Whether to Push or Pull? Blame Design (2016) | 99% Invisible | https://99percentinvisible.org/article/norman-doors-dont-know-whether-push-pull-blame-design/ | Definition of a Norman door |
| Don't Make Me Think, 2nd ed. — table of contents (PDF) | Steve Krug | https://sensible.com/downloads/dmmt-toc.pdf | Chapter titles and subtitles |
| Don't Make Me Think, Revisited — publisher sample pages (PDF) | Steve Krug, Pearson | https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf | TOC, preface, chapter 4 body text, index |
| Don't Make Me Think (book page) | Steve Krug | https://sensible.com/dont-make-me-think/ | Edition facts only; no principles on page |
| Laws of UX — index and 12 law pages | Jon Yablonski | https://lawsofux.com/ plus `/fittss-law/`, `/hicks-law/`, `/jakobs-law/`, `/millers-law/`, `/doherty-threshold/`, `/aesthetic-usability-effect/`, `/teslers-law/`, `/postels-law/`, `/zeigarnik-effect/`, `/von-restorff-effect/`, `/peak-end-rule/`, `/goal-gradient-effect/` | Definition, takeaways, origins, further reading per law |
| The Goal-Gradient Hypothesis Resurrected (JMR 2006) | Kivetz, Urminsky, Zheng | https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf | Café stamp-card field experiment (abstract read from PDF) |
| Interruption, recall and resumption: a meta-analysis of the Zeigarnik and Ovsiankina effects (2025) | Ghibellini & Meier, *Humanit Soc Sci Commun* | https://www.nature.com/articles/s41599-025-05000-w | 59 publications; Zeigarnik replicability "questionable" |
| Zeigarnik effect | Wikipedia | https://en.wikipedia.org/wiki/Zeigarnik_effect | Replication history (Van Bergen 1968) |
| HN thread on the Doherty threshold | commenter "wtracy" | https://news.ycombinator.com/item?id=24031938 | Critique of the 1982 evidence base (opinion) |
| Checkout Optimization: minimize form fields (2024) | Baymard Institute | https://baymard.com/blog/checkout-flow-average-form-fields | 11.3 avg fields vs 8 needed; 17 % abandon for complexity |
| Field Label UX: Place Labels Above the Field (2013) | Baymard Institute | https://baymard.com/blog/mobile-form-usability-label-position | 18 mobile sites, 1,000+ fields observed |
| Form Field Usability: Avoid Extensive Multicolumn Layouts (2023) | Baymard Institute | https://baymard.com/blog/avoid-multi-column-forms | 16 % of sites err; observed skip/omit errors |
| Form Field Usability: Matching User Expectations (2010) | Jamie Holst, Baymard | https://baymard.com/blog/form-field-usability-matching-user-expectations | Field width vs expected input |
| Usability Testing of Inline Form Validation (2024) | Baymard Institute | https://baymard.com/blog/inline-form-validation | 31 % lack it; validate on blur, never on first focus |
| Inline Validation in Web Forms (A List Apart #291, 2009) | Luke Wroblewski with Etre | https://alistapart.com/article/inline-validation-in-web-forms/ | 22 users, 6 variants; +22 % success, −42 % time |
| Top, Right or Left Aligned Form Labels (2005) | Luke Wroblewski | https://www.lukew.com/ff/entry.asp?1502 | Label alignment trade-offs |
| Mobile First (2009) | Luke Wroblewski | https://www.lukew.com/ff/entry.asp?933 | 320×480 forces focus |
| Government Design Principles (rev. 2025) | GDS / GOV.UK | https://www.gov.uk/guidance/government-design-principles | The 10 principles |
| Structuring forms (Service Manual, 2018) | GOV.UK | https://www.gov.uk/service-manual/design/form-structure | One thing per page |
| Writing for user interfaces (Service Manual, 2018) | GOV.UK | https://www.gov.uk/service-manual/design/writing-for-user-interfaces | Sentence case, plain English, link text |
| Button component | GOV.UK Design System | https://design-system.service.gov.uk/components/button/ | One primary, left-aligned, avoid disabled |
| Text input component | GOV.UK Design System | https://design-system.service.gov.uk/components/text-input/ | Visible labels, no placeholders, width |
| Question pages pattern | GOV.UK Design System | https://design-system.service.gov.uk/patterns/question-pages/ | One question per page; Carer's Allowance progress-bar removal |

**Fetch failures (claims that depend on them are marked unverified):** nngroup.com `/articles/affordances-signifiers-design/`, `/articles/magical-number-seven/`, `/videos/norman-doors/`, `/articles/how-to-use-the-zeigarnik-effect/`, `/articles/jakobs-law-internet-ux/` — all 404. jnd.org `signifiers_not_affordances` and `affordances_and_design` (underscore slugs) — 404; the hyphenated signifiers URL above worked. PubMed 20228330 (Cowan, "magical number four") — cookie wall, abstract not read. Krug chapters 1, 2, 3, 5 body text — not in the free samples; only chapter titles/subtitles and index entries were read, chapter 4 body text was.

## Viewpoints

### visibility-of-system-status
- **Claim:** "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time." Norman's version: the user "receives full and continuous feedback about the results of the actions."
- **Source:** Nielsen, heuristic #1, https://www.nngroup.com/articles/ten-usability-heuristics/ ; Norman, DOET as summarised at https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things
- **Prefers / forbids:** Prefers: "no action with consequences to users should be taken without informing them"; feedback "as quickly as possible (ideally, immediately)". Forbids: silent submits, state changes with no visible trace, actions whose result is only visible elsewhere.
- **Measurable?** Partly. A browser can drive an action (click submit, toggle, delete) and diff the DOM/pixels in the following frames: did *anything* visibly change within 1 s? Is there a live region / status text / spinner / disabled+busy state? Must-fail: a Save button that posts and re-renders identical pixels for 3 s, then updates. Must-pass twin: same button, disabled with "Saving…" text within 100 ms, then "Saved" in a status element. What stays taste: whether the feedback is *appropriate*.
- **Evidence strength:** Expert opinion (heuristic distilled from 249 problems in the 1994 factor analysis, per NN/g) with the timing side study-backed (see next entry).
- **Exceptions:** Nielsen: below 0.1 s "no special feedback" is needed beyond showing the result.

### feedback-within-a-second
- **Claim:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted … 10 seconds is about the limit for keeping the user's attention." Doherty threshold: "Productivity soars when a computer and its users interact at a pace (<400ms) that ensures that neither has to wait on the other."
- **Source:** Nielsen 1993, https://www.nngroup.com/articles/response-times-3-important-limits/ ; Sherwin 2014, https://www.nngroup.com/articles/progress-indicators/ ; Yablonski, https://lawsofux.com/doherty-threshold/ (Doherty & Thadani 1982, IBM Systems Journal)
- **Prefers / forbids:** "Use a progress indicator for any action that takes longer than about 1.0 second"; "a looped indicator for delays of 2–9 seconds and a percent-done indicator for delays of 10 seconds or more." Forbids: dead time with no indicator; percent-done bars that lie badly.
- **Measurable?** Yes. Time from input event to first paint of any change (performance timeline / frame diff). Presence of a progress element when the wait exceeds 1 s; presence of `aria-busy`, `<progress>`, or a role=status update. Must-fail: click triggers a 2.5 s fetch with no DOM change until the response. Must-pass twin: same fetch, spinner or skeleton painted < 400 ms after the click.
- **Evidence strength:** Study-backed for the limits (Miller 1968, Card et al. 1991, Myers 1985 cited by Nielsen). Doherty threshold: one 1982 IBM paper; a widely shared critique (https://news.ycombinator.com/item?id=24031938) argues the tasks of 1982 make the 400 ms number context-bound: "if you are making UX decisions based on 28 year old research, you are on shaky ground!"
- **Exceptions:** lawsofux notes "Purposefully adding a delay to a process can actually increase its perceived value" — an opinion, no study cited on the page.

### speak-the-users-language
- **Claim:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Source:** Nielsen, heuristic #2, https://www.nngroup.com/articles/ten-usability-heuristics/ ; GOV.UK, https://www.gov.uk/service-manual/design/writing-for-user-interfaces
- **Prefers / forbids:** "Ensure that users can understand meaning without having to go look up a word's definition." GOV.UK: "Do not use 'ie'. Use 'for example' instead of 'eg'", spell out acronyms "in full on each page". Forbids: error codes, internal entity names, abbreviations.
- **Measurable?** Partly. A machine can flag bare error codes (`/\b[A-Z]{2,}-?\d{3,}\b/`, "Error 0x…"), unexpanded all-caps acronyms not defined on the page, and Latin abbreviations. It cannot judge whether "Tenant" is jargon for *this* actor — that needs the journey's actor from `uxcli context show`. Must-fail: "ERR_VALIDATION_422: payload rejected". Must-pass twin: "Check the email address — it needs an @."
- **Evidence strength:** Expert opinion; GOV.UK cites NN/g scanning research and its own user research ("even busy people like health workers" prefer plain language).
- **Exceptions:** Expert-only tools where the domain term *is* the users' language; heuristic #2 says to match the user, not to simplify per se.

### clearly-marked-emergency-exit
- **Claim:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Source:** Nielsen, heuristic #3, https://www.nngroup.com/articles/ten-usability-heuristics/
- **Prefers / forbids:** "Support Undo and Redo"; "Show a clear way to exit the current interaction, like a Cancel button"; "Make sure the exit is clearly labeled and discoverable." Forbids: modals with no close, wizards with no back, destructive actions with no undo.
- **Measurable?** Partly. For every `role=dialog` / modal: is there a focusable control whose text or `aria-label` matches close/cancel/back, and does Escape dismiss it? For every step past the first in a multi-step flow: is a back control present? Must-fail: a dialog whose only button is "Continue" and which ignores Escape. Must-pass twin: same dialog with "Cancel" and Escape wired. Undo availability stays a judgement unless the action is driven and a visible "Undo" appears.
- **Evidence strength:** Expert opinion.
- **Exceptions:** Legally required interstitials; the heuristic still asks for the exit to be visible, not necessarily free of consequence.

### minimalist-no-competing-information
- **Claim:** "Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility." Wroblewski's mobile version: "There simply isn't room in a 320 by 480 pixel screen for extraneous, unnecessary elements."
- **Source:** Nielsen, heuristic #8, https://www.nngroup.com/articles/ten-usability-heuristics/ ; Wroblewski 2009, https://www.lukew.com/ff/entry.asp?933 ; Krug, ch. 3 index entry "visual noise" (TOC/index only, body unverified), https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf
- **Prefers / forbids:** "Prioritize the content and features to support primary goals"; "Don't let unnecessary elements distract users." Wroblewski: mobile "forces focus on only the most important data and actions". Forbids: decorative elements and secondary content that out-weigh the primary action.
- **Measurable?** Partly. Proxies a browser can count at 360 px: number of distinct interactive elements above the fold; whether the journey's primary action (from the journey file) is within the first viewport; count of elements sharing the accent colour (see `von-restorff-one-emphasis`). Must-fail: at 360 px the "Continue" button is below three promo cards and a newsletter box. Must-pass twin: same page, "Continue" in the first viewport. What is "irrelevant" is taste.
- **Evidence strength:** Expert opinion. Wroblewski's page presents an argument, not a study.
- **Exceptions:** Dense expert dashboards (see `teslers-law` note under `constraints-shift-complexity-to-the-system`) where the irreducible information is large.

### help-in-context
- **Claim:** "It's best if the system doesn't need any additional explanation. However, it may be necessary to provide documentation … Whenever possible, present the documentation in context right at the moment that the user requires it."
- **Source:** Nielsen, heuristic #10, https://www.nngroup.com/articles/ten-usability-heuristics/ ; GOV.UK text input hint text, https://design-system.service.gov.uk/components/text-input/
- **Prefers / forbids:** GOV.UK: "Use hint text for help that's relevant to the majority of users … Keep hint text to a single short sentence, without any full stops." Forbids: help that lives only on a separate page; hint text with links; lengthy explanations.
- **Measurable?** Partly. For inputs with a `pattern`/format expectation (date, postcode, card), is a hint element associated via `aria-describedby` and rendered adjacent (same column, within one line-height)? Hint length in sentences. Must-fail: date field with format rules only in a "Help" link in the footer. Must-pass twin: "For example, 27 3 2007" under the label. Whether the hint is needed at all is taste.
- **Evidence strength:** Expert opinion, GOV.UK pattern from service research (no numbers on the page).
- **Exceptions:** Nielsen's own first sentence: the best help is none.

### signifiers-make-clickable-look-clickable
- **Claim:** Norman: a signifier is "some sort of indicator, some signal in the physical or social world that can be interpreted meaningfully"; designers should "provide signifiers" rather than rely on affordances. NN/g measured it: pages with weak signifiers took "22% more time" and "25% more fixations".
- **Source:** Norman 2008, https://jnd.org/signifiers-not-affordances/ ; Moran 2017, https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ ; Loranger 2015, https://www.nngroup.com/articles/clickable-elements/ ; Norman doors, https://99percentinvisible.org/article/norman-doors-dont-know-whether-push-pull-blame-design/ ; GOV.UK button, https://design-system.service.gov.uk/components/button/
- **Prefers / forbids:** Strong signifiers: "underlined, blue text or a glossy 3D button". Weak: "linked text styled as static text or a ghost button". Loranger: links must stand out from body text; buttons "should resemble physical buttons with rectangular shapes"; "Apply consistent treatment throughout the site". GOV.UK: "Disabled buttons have poor contrast and can confuse some users, so avoid them if possible." A Norman door — a door that needs a "Push"/"Pull" sign — is the failure: if a control needs a label telling you it is a control, the signifier failed.
- **Measurable?** Yes. For each `a[href]`, `button`, `[role=button]`: computed colour/underline/border/background vs the surrounding text's computed style; a link whose colour equals body colour with `text-decoration: none` and no other differentiator is a weak signifier. Count of `disabled` buttons. Must-fail: `a { color: inherit; text-decoration: none }` inside a paragraph. Must-pass twin: same link with a distinct hue *or* underline. Ghost buttons (transparent bg, 1 px border) are flaggable; whether the design "needs" them is taste.
- **Evidence strength:** Study-backed: 71 participants, 9 site pairs, eyetracking (Moran 2017). Norman's definitions: expert theory.
- **Exceptions:** Loranger: link position (nav menus, peripheral lists) "may eliminate the need for underlining". Moran: flat works best with "low information density, traditional layouts, and high-contrast targets positioned standardly."

### no-false-affordances
- **Claim:** Norman (quoted by IxDF): "When affordances are taken advantage of, the user knows what to do just by looking: no picture, label, or instruction needed." A false affordance is a cue with no action behind it — "Underlined text that isn't a hyperlink; a button that appears pressable but doesn't function."
- **Source:** IxDF, https://ixdf.org/literature/topics/affordances (citing Norman, DOET 1988/2013); Loranger 2015, https://www.nngroup.com/articles/clickable-elements/
- **Prefers / forbids:** Loranger: "Static items should not share hyperlink colors"; "Avoid blue text or underlining for non-interactive items"; "Avoid making non-clickable items (like headings) resemble buttons."
- **Measurable?** Yes. Elements that are not interactive (no href/handler/role/tabindex) but have `cursor: pointer`, underline + link colour, or button-like box (border-radius + filled bg + short centred text). Must-fail: a `<span class="btn">Premium</span>` badge styled exactly like the real buttons. Must-pass twin: same badge with pill shape but no button colour, no pointer cursor.
- **Evidence strength:** Expert opinion, consistent with the Moran 2017 signifier study.
- **Exceptions:** None named; a hidden affordance (swipe, hover-reveal) is a separate problem the sources call out as discoverability, not a false one.

### natural-mapping-and-proximity
- **Claim:** Norman: users must "determine relationships between controls and their effects". NN/g on forms: "items near each other appear related" (Gestalt Law of Proximity).
- **Source:** Norman, DOET summary, https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things ; McCloskey 2013, https://www.nngroup.com/articles/form-design-white-space/ ; Budiu 2022, https://www.nngroup.com/articles/fitts-law/
- **Prefers / forbids:** McCloskey: labels "as close to the text fields as possible"; "Grouping related fields together helps users make sense of the information." Budiu: "Place related targets close to each other"; put call-to-action buttons "near final form fields, not at page top". Forbids: a control far from the thing it changes; groups separated by less space than their members.
- **Measurable?** Yes. Distance from each `label` to its `for` target vs distance to the nearest *other* input (label must be nearer its own field). Gap between fields within a fieldset vs gap between fieldsets (inter-group gap must exceed intra-group). Submit button distance from the last input. Must-fail: left labels 240 px from their inputs, uniform 16 px gaps everywhere. Must-pass twin: labels 4 px above inputs, 8 px within groups, 32 px between groups.
- **Evidence strength:** Expert opinion resting on Gestalt psychology; NN/g illustrates with a Walgreens case, no study numbers.
- **Exceptions:** Left-aligned labels acceptable "if space is constrained", with labels of similar length (McCloskey).

### constraints-shift-complexity-to-the-system
- **Claim:** Tesler: "For any system there is a certain amount of complexity which cannot be reduced" and designers should "Ensure as much as possible of the burden is lifted from users." Norman's constraints (physical, cultural, semantic, logical) "guide behavior".
- **Source:** Yablonski, https://lawsofux.com/teslers-law/ ; Norman, https://jnd.org/the-design-of-everyday-things-revised-and-expanded-edition/ ; Baymard 2024, https://baymard.com/blog/checkout-flow-average-form-fields
- **Prefers / forbids:** Baymard's concrete versions: "Set billing address equal to shipping by default"; "Hide 'Address Line 2' behind expandable link"; "Collapse coupon code fields by default"; "Offer account creation after checkout completion". Forbids: asking the user for what the system can infer or default; showing rarely used fields by default.
- **Measurable?** Partly. Count of visible required inputs whose value the page could default (billing = shipping checkbox absent; both address blocks open). Presence of `autocomplete` tokens on address/payment inputs. Must-fail: two full address forms shown, no "same as shipping" control. Must-pass twin: one address form + a checked "Billing address is the same" toggle. Overlaps with the existing `redundant-entry` probe (#6); this entry adds defaults and hidden optional fields.
- **Evidence strength:** Baymard: benchmark observation (89 % use split name fields, 75 % show Address Line 2, 24 % default to separate billing). Tesler: expert opinion.
- **Exceptions:** lawsofux quotes Tognazzini's counter-view that users "resist complexity reduction" and attempt harder tasks when systems get simpler.

### dont-make-me-think
- **Claim:** Krug's First Law of Usability is the book's title, "Don't make me think!" (chapter 1 subtitle: "Krug's First Law of Usability").
- **Source:** Krug, TOC of *Don't Make Me Think* (2nd ed.) https://sensible.com/downloads/dmmt-toc.pdf and *Revisited* sample https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf — chapter 1 body text unverified.
- **Prefers / forbids:** Prefers a page whose purpose and controls are self-evident. Forbids anything that raises a question the user has to answer before acting.
- **Measurable?** No. The law is the sum of the other entries; a machine measures its symptoms (weak signifiers, ambiguous link text, jargon, competing emphasis), not the law itself. Any "think-o-meter" would be a judgement.
- **Evidence strength:** Expert opinion (Krug's usability-test experience; no study numbers).
- **Exceptions:** Krug's own footnote: none for the law; exceptions exist for the click-count corollary below.

### mindless-clicks-not-fewer-clicks
- **Claim:** "It doesn't matter how many times I have to click, as long as each click is a mindless, unambiguous choice." — Krug's Second Law of Usability. Porter: "there wasn't any more likelihood of a user quitting after three clicks than after 12 clicks."
- **Source:** Krug, *Revisited* ch. 4 (body text read), https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf ; Porter 2003, https://articles.centercentre.com/three_click_rule/ ; Laubheimer 2019, https://www.nngroup.com/articles/3-click-rule/
- **Prefers / forbids:** Krug: "Links that clearly and unambiguously identify their target give off a strong scent … Ambiguous or poorly worded links do not." Rule of thumb: "three mindless, unambiguous clicks equal one click that requires thought." NN/g: "Clear labeling with strong information scent and meaningful link text", breadcrumbs, hub pages. Forbids: counting clicks as the metric; generic links.
- **Measurable?** Partly. Count links/buttons whose text is generic ("Click here", "Learn more", "Here", "Read more", "Next" with no object) or whose text duplicates another link's text with a different target. Do *not* measure path length. Must-fail: three cards each with a "Learn more" link to different pages. Must-pass twin: "See pricing", "Read the security policy", "Compare plans". Whether a *specific* label is unambiguous for the actor is taste.
- **Evidence strength:** Study-backed against the 3-click rule (Porter: 44 users, 620 tasks, 8,000+ clicks; users went "up to 25 pages"). Krug's rule of thumb: expert opinion.
- **Exceptions:** Krug's footnote: fewer clicks matter more "if I'm going to have to drill down through the same path in a site repeatedly, or if the pages are going to take a long time to load."

### visual-hierarchy-for-scanning
- **Claim:** Krug ch. 3: "Billboard Design 101 — Designing for scanning, not reading" (index: "visual hierarchy, 33–36"). NN/g: users follow an F-pattern — "a horizontal movement across the upper part", a shorter second one, then "a vertical movement" down the left — and "The F-shaped scanning pattern is bad for users and businesses."
- **Source:** Krug TOC/index (body unverified), https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf ; Pernice 2017, https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- **Prefers / forbids:** Pernice: "prominent headings with information-rich opening words", "Bold key phrases; employ lists and bullets", "Remove unnecessary content". The F-pattern appears with "unformatted text without bolding or subheadings" — so formatting is the cure. Forbids: walls of unstructured text; headings that do not out-rank body text visually; importance not matching visual weight.
- **Measurable?** Partly. Heading font-size/weight should be monotonic with level (h1 ≥ h2 ≥ h3 ≥ body); longest paragraph length in words; ratio of headings+list items to total text blocks; first-word informativeness is not measurable. Must-fail: h2 rendered at 14 px regular while body is 16 px; 400-word paragraphs, no lists. Must-pass twin: h2 at 24 px semibold, paragraphs ≤ 80 words, one list.
- **Evidence strength:** Study-backed for the scan pattern (NN/g eyetracking since 2006, confirmed on mobile and RTL). Krug's chapter: expert opinion.
- **Exceptions:** Pernice: the pattern needs "moderate (not high) interest"; highly motivated readers read.

### omit-needless-words
- **Claim:** Krug ch. 5 title: "Omit needless words — The art of not writing for the Web" (index: "happy talk, eliminating, 50"; "instructions, eliminating, 51–52"). Nielsen: "People rarely read Web pages word by word; instead, they scan the page" — 79 % scanned, 16 % read word-by-word; concise text was "58% better", combined concise+scannable+objective "124% better".
- **Source:** Krug TOC/index (body unverified), https://ptgmedia.pearsoncmg.com/images/9780321965516/samplepages/0321965515.pdf ; Nielsen 1997, https://www.nngroup.com/articles/how-users-read-on-the-web/ ; GOV.UK, https://www.gov.uk/service-manual/design/writing-for-user-interfaces
- **Prefers / forbids:** Nielsen: "Reduce word count by half compared to traditional writing", "Avoid promotional language ('marketese')", "Limit paragraphs to one idea each". GOV.UK: "Use sentence case everywhere, except for proper nouns." Forbids: welcome/happy-talk intros, instruction paragraphs before forms, ALL CAPS or Title Case labels.
- **Measurable?** Partly. Word count between a form's heading and its first input; word count of any block starting "Welcome" / "Thank you for"; buttons and labels in ALL CAPS (computed `text-transform` or source) or Title Case; sentence count in instructions. Must-fail: a 120-word paragraph explaining how to fill a 3-field form. Must-pass twin: heading + 3 labelled fields + one hint. "Needless" for a given word is taste.
- **Evidence strength:** Study-backed (Nielsen 1997 test with five rewrites of the same content; small sample by today's standards). Krug: expert opinion.
- **Exceptions:** Nielsen 1997 also asks for "outbound links to build trust" — brevity is not zero text.

### follow-conventions
- **Claim:** Jakob's law: "Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know." Nielsen on buttons: "Following platform conventions is more important than optimizing an individual dialog box."
- **Source:** Yablonski, https://lawsofux.com/jakobs-law/ ; Nielsen 2008, https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/ ; GOV.UK principle 9 "Be consistent, not uniform", https://www.gov.uk/guidance/government-design-principles ; Krug index "conventions, 29–33, 64" (body unverified)
- **Prefers / forbids:** Nielsen: "inconsistency costs more time than it saves"; make "the most commonly selected button the default and highlight it" except for dangerous actions; prefer descriptive labels over "OK". lawsofux: when changing, "empowering users to continue using a familiar version for a limited time." Forbids: inventing a new pattern for a solved problem.
- **Measurable?** Partly. Within one site: the existing `consistent-navigation` probe (#4). Against *web* convention, a handful of checks are objective: logo in header links to home; a search input has type=search or a search label; primary/secondary button order is the same in every dialog; the cart/account icons are where they were on other screens. Must-fail: two dialogs on one site with opposite Cancel/Confirm order. Must-pass twin: identical order everywhere. Whether a *novel* pattern is worth its cost is taste.
- **Evidence strength:** Expert opinion (Nielsen); lawsofux cites NN/g "Power Law of Learning" but no study on the page.
- **Exceptions:** Nielsen: desktop apps should follow their own OS (Windows OK-first, Apple OK-last) — convention beats a universal rule.

### fitts-target-size-and-distance
- **Claim:** "The time to acquire a target is a function of the distance to and size of the target." NN/g touch minimum: "at least 1cm × 1cm (0.4in x 0.4in)".
- **Source:** Yablonski, https://lawsofux.com/fittss-law/ (Fitts 1954); Budiu 2022, https://www.nngroup.com/articles/fitts-law/ ; Harley 2019, https://www.nngroup.com/articles/touch-target-size/ (Parhi, Karlson & Bederson 2006)
- **Prefers / forbids:** lawsofux: "Touch targets should be large enough … have ample spacing between them … be placed in areas of an interface that allow them to be easily acquired." Budiu: "Make targets big", "Icons need labels" (label extends the target), "Don't crowd targets", CTA "near final form fields, not at page top". Harley: "targets must first be big enough, and then also spaced well enough." Forbids: icon-only 24 px controls packed edge to edge on touch layouts.
- **Measurable?** Yes. Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px at 96 dpi; WCAG's 24/44 px are the usual proxies); centre-to-centre spacing between adjacent targets; distance from last input to submit; whether the label is inside the clickable box. Must-fail: 20×20 px icon buttons 4 px apart. Must-pass twin: 44×44 px hit areas, 8 px gap.
- **Evidence strength:** Study-backed (Fitts 1954; Parhi et al. 2006 for the 1 cm figure).
- **Exceptions:** Budiu: "Infinite targets along screen edges" for mouse — size matters less at an edge. Harley: primary CTAs, moving users, children, elderly need *larger* than the minimum.

### hicks-fewer-choices-when-time-matters
- **Claim:** "The time it takes to make a decision increases with the number and complexity of choices." Nielsen's guard: "It's fine to have longer menus (if needed), because users don't have to memorize the full list of menu items."
- **Source:** Yablonski, https://lawsofux.com/hicks-law/ (Hick 1952, Hyman 1953); Nielsen 2009, https://www.nngroup.com/articles/short-term-memory-and-web-usability/ ; Yablonski, https://lawsofux.com/millers-law/
- **Prefers / forbids:** lawsofux: "Minimize choices when response times are critical"; "Avoid overwhelming users by highlighting recommended options"; "Be careful not to simplify to the point of abstraction." Miller's law page: "Don't use the 'magical number seven' to justify unnecessary design limitations." Nielsen: "if you make a menu too short, the choices become overly abstract and obscure." Forbids: many equal-weight primary actions on one decision point; using 7 as a hard cap.
- **Measurable?** Partly. Count of same-weight primary actions in a view (see `von-restorff-one-emphasis`); count of options in a `select`/radio group with no recommended default. A menu's item count alone is *not* a failure. Must-fail: pricing page with 6 plans, none highlighted, 6 identical "Choose" buttons. Must-pass twin: same 6 plans, one marked "Recommended" with the only filled button.
- **Evidence strength:** Study-backed for reaction time (Hick–Hyman); the leap to UI choice architecture is expert opinion. Miller 7±2 misapplication is contested by Miller himself per NN/g and by Cowan's "magical number four" (cited on lawsofux; PubMed page not fetched — unverified).
- **Exceptions:** Nielsen: recognition, not recall, governs menus — length is a scan cost, not a memory cost.

### aesthetic-usability-effect-bias
- **Claim:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Source:** Moran 2024, https://www.nngroup.com/articles/aesthetic-usability-effect/ ; Yablonski, https://lawsofux.com/aesthetic-usability-effect/ (Kurosu & Kashimura 1995: 26 ATM layouts, 252 participants)
- **Prefers / forbids:** For the *evaluator*: do not read polish as usability. lawsofux: "Visually pleasing design can mask usability problems and prevent issues from being discovered during usability testing." For the *builder*: polish buys tolerance for minor problems, "not of large ones."
- **Measurable?** No. It is a bias about perception; the lens value is procedural — an agent (or a person) rating its own screen must discount its aesthetic impression and run the measurable entries first. It stays taste because "attractive" is the variable.
- **Evidence strength:** Study-backed (Kurosu & Kashimura 1995: aesthetics correlated more with *perceived* than *actual* ease of use). Tractinsky's replication is commonly cited but was not on the fetched pages — unverified.
- **Exceptions:** Moran: "When products suffer from severe usability issues, or when functionality is sacrificed for aesthetics, users tend to lose patience."

### postel-tolerant-input
- **Claim:** "Be liberal in what you accept, and conservative in what you send."
- **Source:** Yablonski, https://lawsofux.com/postels-law/ (Postel, TCP RFC robustness principle); Baymard field-width piece for the card/CVV example, https://baymard.com/blog/form-field-usability-matching-user-expectations
- **Prefers / forbids:** "Accept variable input from users, translating that input to meet your requirements, defining boundaries for input, and providing clear feedback." Forbids: rejecting spaces/dashes in card or phone numbers, rejecting leading/trailing whitespace in email, case-sensitive email, forcing a date format the field could parse.
- **Measurable?** Yes. Drive each formatted field with equivalent variants ("4111 1111 1111 1111" vs "4111111111111111", " a@b.co ", "+44 20…" vs "02…") and compare validation outcome. Must-fail: card field shows an error for spaces. Must-pass twin: same value accepted and normalised on blur.
- **Evidence strength:** Expert opinion (engineering principle ported to UX); no UX study on the page.
- **Exceptions:** Inputs where ambiguity is dangerous (dates in medical or legal contexts) — the page's own "defining boundaries" clause.

### von-restorff-one-emphasis
- **Claim:** "When multiple similar objects are present, the one that differs from the rest is most likely to be remembered." GOV.UK: "Avoid using multiple default buttons on a single page. Having more than one main call to action reduces their impact, and makes it harder for users to know what to do next."
- **Source:** Yablonski, https://lawsofux.com/von-restorff-effect/ (von Restorff 1933); GOV.UK button, https://design-system.service.gov.uk/components/button/ ; Nielsen 2008, https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/
- **Prefers / forbids:** lawsofux: "Make important information or key actions visually distinctive"; "Use restraint when placing emphasis … to avoid them competing with one another"; "Don't … rely exclusively on color". GOV.UK: "Align the primary action button to the left edge of your form." Nielsen: highlight the default, except for dangerous actions. Forbids: two or more filled/primary buttons in one view; emphasis by colour alone.
- **Measurable?** Yes. Cluster interactive elements by computed background/border/weight; count members of the most emphatic cluster per view (must be 1); check the primary's left edge aligns with the form's inputs; check emphasis is not colour-only (weight, fill or border also differ). Must-fail: "Save" and "Cancel" both solid brand-colour buttons. Must-pass twin: "Save" filled, "Cancel" as text link. GOV.UK also reports "using green as the colour of start buttons improved click-through rates" — measured on GOV.UK, not generalised.
- **Evidence strength:** Study-backed for memory isolation (von Restorff 1933); the one-primary rule is GOV.UK research practice + Nielsen opinion.
- **Exceptions:** Nielsen: do not pre-highlight a dangerous action as default.

### progress-indication-in-flows
- **Claim:** Goal-gradient: "The tendency to approach a goal increases with proximity to the goal." Kivetz et al.: café customers "purchase coffee more frequently the closer they are to earning a free coffee", and a 12-stamp card with 2 bonus stamps is completed faster than a 10-stamp card. Zeigarnik: "People remember uncompleted or interrupted tasks better than completed tasks."
- **Source:** Yablonski, https://lawsofux.com/goal-gradient-effect/ and https://lawsofux.com/zeigarnik-effect/ ; Kivetz, Urminsky & Zheng 2006 (JMR), https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf ; Ghibellini & Meier 2025, https://www.nature.com/articles/s41599-025-05000-w ; GOV.UK question pages, https://design-system.service.gov.uk/patterns/question-pages/
- **Prefers / forbids:** lawsofux: "Provide a clear indication of progress in order to motivate users to complete tasks." GOV.UK counter-evidence: the Carer's Allowance team removed a 12-step progress indicator "with no effect on completion rates or times". So: prefer *some* sense of position in long flows; do not assume a step bar helps.
- **Measurable?** Partly. Presence of a step/position element in flows with ≥ 3 steps, and whether it updates between steps. Must-fail: 6-step wizard with no step label anywhere. Must-pass twin: "Step 2 of 6" (or a heading that changes). Whether the bar improves completion is not measurable in one run.
- **Evidence strength:** Goal-gradient: study-backed in humans (Kivetz 2006 field experiments). Zeigarnik: contested — meta-analysis of 59 publications: "the replicability of the Zeigarnik effect remains questionable and the supposed memory advantage … is certainly not universal"; Van Bergen (1968) failed to replicate. Progress bars specifically: GOV.UK found no effect in one service.
- **Exceptions:** Short flows (GOV.UK's own guidance omits indicators by default); artificial progress (lawsofux "endowed progress") edges toward manipulation — flag, do not recommend.

### peak-end-finish-well
- **Claim:** "People judge an experience largely based on how they felt at its peak and at its end, rather than the total sum or average of every moment of the experience."
- **Source:** Yablonski, https://lawsofux.com/peak-end-rule/ (Kahneman, Fredrickson, Schreiber & Redelmeier 1993)
- **Prefers / forbids:** "Pay close attention to the most intense points and the final moments (the 'end') of the user journey"; "people recall negative experiences more vividly than positive ones." Forbids: a flow that ends on an error, a blank page, or a dead end with no next step.
- **Measurable?** Partly. The journey's terminal state must exist and be reachable: after the final action, is there a confirmation screen/status with at least one onward link, and no error state? Must-fail: form submit returns to the same page with fields cleared and no message. Must-pass twin: "Application sent — reference ABC123. What happens next…" with a link. How it *feels* is taste.
- **Evidence strength:** Study-backed in psychology (cold-water experiment 1993); application to UI is expert opinion.
- **Exceptions:** None stated.

### banner-blindness-dont-style-content-like-ads
- **Claim:** "Users have learned to ignore content that resembles ads, is close to ads, or appears in locations traditionally dedicated to ads."
- **Source:** Pernice 2018, https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ (eyetracking, 26 participants)
- **Prefers / forbids:** Users ignore three signals: "Ad-specific placement – top of page or right rail", "Ad-like visual treatment – animation, colored backgrounds, fancy formatting", "Proximity to actual ads". Prefers: essential content in the main column, styled like content. Forbids: putting the primary CTA or key notice in a coloured box in the right rail or a top banner strip.
- **Measurable?** Partly. Is the journey's primary action or a required notice positioned in the right rail (x > 70 % of viewport at desktop) or in a full-width top strip with a background fill and animation? Must-fail: "Complete your profile" only as an animated right-rail card. Must-pass twin: same prompt inline in the main column, plain background. Whether something "looks like an ad" beyond those signals is taste.
- **Evidence strength:** Study-backed (NN/g eyetracking, multiple studies since 2007).
- **Exceptions:** Pernice: on mobile, "large inline ads" *do* get fixated — the effect is weaker for inline placement.

### placeholders-are-not-labels
- **Claim:** "Disappearing placeholder text strains users' short-term memory." GOV.UK: "Do not use placeholder text in place of a label, or for hints or examples."
- **Source:** Sherwin 2014, https://www.nngroup.com/articles/form-design-placeholders/ ; GOV.UK text input, https://design-system.service.gov.uk/components/text-input/
- **Prefers / forbids:** Sherwin's seven problems include: users cannot verify answers, "Users' eyes are drawn to empty fields", users may "skip the field completely" assuming it is prefilled. GOV.UK: placeholder "vanishes when the user starts typing", "not all screen readers read it out", default styles "often do not meet WCAG 2.2 … 1.4.3 Contrast". Prefers: "All text inputs must have labels, and in most cases the label should be visible", hints "outside empty form fields".
- **Measurable?** Yes. Any `input`/`textarea` with a `placeholder` and no visible associated `<label>` (or with a label that is visually hidden). Also: placeholder used as the only format example. Must-fail: `<input placeholder="Email">` with no label. Must-pass twin: `<label for=e>Email</label><input id=e>`.
- **Evidence strength:** Expert opinion grounded in usability-test observation (NN/g) and accessibility standards (GOV.UK). No controlled study cited on either page.
- **Exceptions:** GOV.UK: a single-field search where the button label carries the meaning is the usual carve-out; the fetched page states none explicitly.

### labels-above-fields
- **Claim:** NN/g: place "field labels above the corresponding text fields" — it "makes the form easier to scan, because users can see the text field in the same fixation as the label". Baymard: on mobile, side labels leave "very little space left for the field itself", so users could not see their own input.
- **Source:** McCloskey 2013, https://www.nngroup.com/articles/form-design-white-space/ ; Baymard 2013, https://baymard.com/blog/mobile-form-usability-label-position (18 sites, 1,000+ fields); Wroblewski 2005, https://www.lukew.com/ff/entry.asp?1502
- **Prefers / forbids:** Wroblewski: top-aligned is "Best for familiar data (names, addresses, payment info)", users "move in one direction: downward"; left-justified labels force a "jump" between columns; right-justified labels have a "left rag" that hurts scanning. Forbids: left labels far from fields; labels inside the field (see previous entry).
- **Measurable?** Yes. For each label/input pair: label box bottom ≤ input box top, label left edge ≈ input left edge (within a few px); if side-by-side, gap between label right edge and input left edge. Must-fail: right-aligned labels in a 200 px column, inputs in a second column, 24 px gap. Must-pass twin: labels stacked above inputs, 4–8 px gap.
- **Evidence strength:** Wroblewski's 2005 post is design reasoning ("no eye tracking data"); Baymard is observational (mobile checkout tests); NN/g cites Gestalt proximity. Widely repeated; no fetched page has a controlled comparison with numbers.
- **Exceptions:** Baymard: landscape phones — switch to left-aligned to keep the field visible above the keyboard. NN/g: left-aligned acceptable when "labels are of similar length and are placed as close to the text fields as possible."

### single-column-forms
- **Claim:** "Use a single-column layout to support users' visual understanding of forms" — with multicolumn forms users "either complete unrelated or unnecessary fields" or "inadvertently skip or omit required fields".
- **Source:** Baymard 2023, https://baymard.com/blog/avoid-multi-column-forms ; Wroblewski 2005 ("users move in one direction: downward"), https://www.lukew.com/ff/entry.asp?1502
- **Prefers / forbids:** One vertical path. Allowed on one line: "city/state/ZIP or postal code" and "card number/expiration date/security code" — fields that form "a single coherent entity". Forbids: two independent question columns.
- **Measurable?** Yes. Cluster inputs by left x-coordinate; more than one column of *independent* inputs (not in the same fieldset/row group of the allowed kinds) fails. Must-fail: name/email in column 1, phone/company in column 2. Must-pass twin: all four stacked, with expiry/CVV side by side.
- **Evidence strength:** Observational (Baymard moderated checkout tests; 16 % of benchmark sites fail). No effect size published on the page.
- **Exceptions:** The coherent-entity rows above.

### field-width-matches-expected-input
- **Claim:** "Matching your customer's expectations – even when it comes to the subconscious expectations of how wide an input field should be – is crucial." GOV.UK: "making text inputs the right size for the content they're intended for."
- **Source:** Holst 2010, https://baymard.com/blog/form-field-usability-matching-user-expectations ; GOV.UK text input, https://design-system.service.gov.uk/components/text-input/ ; McCloskey 2013 (field length matching input), https://www.nngroup.com/articles/form-design-white-space/
- **Prefers / forbids:** Fixed-length data (year, postcode, CVV) gets a width that fits it; variable common data (email) gets one consistent width; forbids a CVV box as wide as an address line, or a card-number field that visibly truncates.
- **Measurable?** Yes. Compare rendered input width (in `ch` of its font) with `maxlength`, `inputmode`/`autocomplete` token, or pattern length: a `cc-csc` field wider than ~8 ch, a `postal-code` field at full width, or an `email` field narrower than ~20 ch. Must-fail: CVV input at 100 % width. Must-pass twin: CVV at 5 ch, card number at 22 ch.
- **Evidence strength:** Observational (Baymard checkout tests, 2010; examples of 14-digit card fields). Expert opinion beyond that.
- **Exceptions:** Responsive full-width inputs on narrow phones are the norm; the check belongs at desktop widths, or should compare relative widths within the form.

### inline-validation-after-leaving-field
- **Claim:** Wroblewski/Etre: the best inline-validation variant gave "22% increase in success rates … 42% decrease in completion times … 47% decrease in eye fixations" vs submit-only validation. Baymard: do not validate on first focus — "Why are you telling me my email address is wrong, I haven't had a chance to fill it all out yet!"
- **Source:** Wroblewski 2009, https://alistapart.com/article/inline-validation-in-web-forms/ (22 participants, 6 variants); Baymard 2024, https://baymard.com/blog/inline-form-validation (31 % of sites lack inline validation)
- **Prefers / forbids:** Validate "after" the user leaves a field (on blur) or when the input reaches the expected length; once an error shows, re-check live on each keystroke and clear it as soon as it is fixed; keep success/error messages visible rather than fading. Reserve inline validation for hard fields (username, password) — participants ignored it on names. Forbids: validating "before and while" typing; errors that appear on focus of an empty field; validation only on submit.
- **Measurable?** Yes. Drive a field: focus → no error may appear; type an invalid value → no error while typing (unless length threshold reached); blur → error appears adjacent (`aria-describedby`); type a fix → error clears without blur. Must-fail: error text renders the moment the field receives focus. Must-pass twin: error only after blur, cleared on the corrected keystroke. Overlaps the existing `error-identification` probe (#9); this adds *timing*.
- **Evidence strength:** Study-backed (Wroblewski 2009, small n, eye tracking); Baymard: benchmark + moderated tests.
- **Exceptions:** Wroblewski: simple fields need none; premature validation was worse than none.

### fewer-checkout-fields
- **Claim:** "The number of form fields in a checkout impacts overall usability far more than the number of steps." Average checkout has 11.3 form fields; 8 is the achievable minimum; 17 % of shoppers abandon because checkout was too long/complicated.
- **Source:** Baymard 2024, https://baymard.com/blog/checkout-flow-average-form-fields
- **Prefers / forbids:** "Consolidate to single 'Full Name' field"; hide Address Line 2; collapse coupon field; billing = shipping by default; account creation after purchase. Forbids: counting steps as the metric; showing every optional field by default.
- **Measurable?** Yes. Count visible `input`/`select`/`textarea` (excluding hidden and collapsed) across the checkout flow; count optional fields shown expanded; presence of separate first/last name fields; presence of an open coupon field. Must-fail: 14 visible fields including Address Line 2, Company, coupon, and two address blocks. Must-pass twin: 8 fields with "Add address line 2" and "Have a coupon?" as disclosure links.
- **Evidence strength:** Benchmark data (Baymard e-commerce benchmark) and moderated tests; the 17 % figure is Baymard's abandonment survey — self-reported reasons.
- **Exceptions:** Regulatory or fraud fields that genuinely cannot be defaulted; Baymard's minimum of 8 assumes a standard guest checkout.

### one-thing-per-page
- **Claim:** "Start by splitting the form across multiple pages with each page containing just one thing" — it helps users "understand what you're asking them to do", "focus on the specific question and its answer", "use the service on a mobile device", "recover easily from form errors".
- **Source:** GOV.UK Service Manual, https://www.gov.uk/service-manual/design/form-structure ; GOV.UK Design System question pages, https://design-system.service.gov.uk/patterns/question-pages/ ; lawsofux Hick's law takeaway "Break complex tasks into smaller steps", https://lawsofux.com/hicks-law/
- **Prefers / forbids:** One question (or one decision, or one piece of information) per page; "Start with questions that will let users know if they're not eligible"; "branching questions so people only have to answer questions that are relevant to them." Forbids: long multi-section forms in a public-facing transactional service.
- **Measurable?** Partly. Count distinct questions (label groups / fieldsets) per page in a flow; count required inputs per page. Must-fail: one page with 9 unrelated questions. Must-pass twin: 9 pages, one question each, with a check-answers page. Whether *this* service warrants it (vs an expert tool) is a judgement.
- **Evidence strength:** GOV.UK practice from service research; the fetched pages give a worked example (Register to vote) and the Carer's Allowance observation, no controlled numbers.
- **Exceptions:** GOV.UK principle 9 "Be consistent, not uniform" — internal expert tools and repeat users may prefer denser pages (see `constraints-shift-complexity-to-the-system`).

### start-with-user-needs-design-with-data
- **Claim:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing." "Let data drive decision-making, not hunches or guesswork." "Making something look simple is easy. Making something simple to use is much harder."
- **Source:** GOV.UK principles 1, 3, 4, https://www.gov.uk/guidance/government-design-principles
- **Prefers / forbids:** Prefers a stated actor and need before a screen; measuring real behaviour; iterating ("start small and iterate wildly"). Forbids: designing to a hunch or to an aesthetic.
- **Measurable?** No. These are process principles; in uxcli terms they are what `uxcli context show <journey>` and the signed commitments already enforce upstream of any probe. Included so the lens can say *why* the measurable entries are subordinate to the journey's actor.
- **Evidence strength:** Expert consensus from GDS practice; the page cites no study.
- **Exceptions:** None — GOV.UK presents them as unconditional.

## What this school is against

- **Weak or absent clickability signifiers** — flat links styled as text, ghost buttons (Moran 2017, https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ ; Loranger 2015).
- **False affordances** — underlined or blue non-links, button-shaped static badges (Loranger 2015; IxDF/Norman).
- **Norman doors** — controls that need a sign to say how they work (Norman via https://99percentinvisible.org/article/norman-doors-dont-know-whether-push-pull-blame-design/ and DOET "The Problem with Doors").
- **Placeholder-as-label** (Sherwin 2014; GOV.UK text input).
- **Disabled buttons** — "poor contrast and can confuse some users" (GOV.UK button).
- **Multiple primary buttons on one page** (GOV.UK button; Von Restorff takeaways on restraint).
- **Multicolumn forms** beyond coherent rows (Baymard 2023).
- **Field widths that contradict the expected input** (Baymard 2010).
- **Premature inline validation** — errors on focus or while typing (Wroblewski 2009; Baymard 2024); and **no inline validation at all** (Baymard: 31 %).
- **Rejecting equivalent input formats** (Postel's law via lawsofux).
- **Counting clicks** — the 3-click rule (Porter 2003; Laubheimer 2019; Krug's second law).
- **Using 7±2 as a menu cap** (Nielsen 2009; lawsofux Miller's law).
- **Generic link text** — "click here", "learn more" (Krug on scent; Pernice on descriptive links).
- **Marketese, happy talk, instructions** — promotional language "imposes cognitive burden" (Nielsen 1997); Krug ch. 5 index entries.
- **Unformatted text walls** that produce F-pattern skipping (Pernice 2017).
- **Content styled or placed like ads** — right rail, top strip, animated coloured boxes (Pernice 2018).
- **Silent waits** — anything over ~1 s with no indicator (Nielsen 1993; Sherwin 2014).
- **Trusting polish** — aesthetic-usability masks defects (Moran 2024).
- **Uniformity over consistency** and **novel patterns for solved problems** (GOV.UK principle 9; Jakob's law; Nielsen on OK/Cancel).

## Notes on reliability

**Replicated / well-supported.** Fitts's law (1954, one of the most replicated results in HCI; NN/g 1 cm figure from Parhi et al. 2006). Hick–Hyman reaction-time law (1952/53) — but its extension to menu design is opinion. Response-time limits (Miller 1968, Card 1991, Nielsen 1993) — robust as orders of magnitude. NN/g signifier study (Moran 2017, n = 71, eyetracking) — the single best piece of direct UI evidence in this cluster. F-pattern — reconfirmed on mobile and RTL by NN/g; observational, not a controlled comparison. Banner blindness — several NN/g eyetracking studies. Goal-gradient in humans — Kivetz et al. 2006 field experiments. Aesthetic-usability effect — Kurosu & Kashimura 1995, n = 252. Inline validation — Wroblewski/Etre 2009, n = 22 with eye tracking; small but consistent with Baymard's observations. 3-click rule falsified — Porter 2003, 44 users/620 tasks.

**Contested.** *Zeigarnik effect*: the 2025 meta-analysis (59 publications) says its "replicability … remains questionable" and the memory advantage "is certainly not universal"; Van Bergen (1968) failed to replicate. Lenses should not cite Zeigarnik as a reason for progress bars; the goal-gradient evidence is the sounder footing, and GOV.UK's Carer's Allowance case shows a progress bar can do nothing. *Doherty threshold*: one 1982 IBM paper; the 400 ms number is context-bound and often repeated without the paper being read — treat as a heuristic that happens to agree with Nielsen's 0.1–1 s band. *Miller's 7±2*: Miller's paper does not license UI limits; Cowan argues ~4 chunks (lawsofux cites it; PubMed abstract not fetched, so unverified here). *Aesthetic-usability*: Tractinsky's replication is widely cited but was not on any fetched page — unverified. *Peak-end*: robust in hedonic psychology, applied to UI by analogy only.

**Expert opinion, not studies.** Nielsen's ten heuristics (derived from factor analysis of problem reports, not experiments), Krug's laws, Norman's framework, Jakob's law, Tesler's and Postel's laws, GOV.UK principles, top-aligned labels (Wroblewski 2005 explicitly has "no eye tracking data"; Baymard's is moderated observation). Baymard's percentages are benchmark prevalence, not effect sizes — "16 % of sites do X" says nothing about how much X hurts.

**Could not verify.** Krug's chapters 1, 2, 3 and 5 body text (only TOC, subtitles and index entries were readable; chapter 4 with the Second Law was read in full). NN/g's affordance/signifier article, Norman-doors video, Zeigarnik article and Jakob's-law video (all 404). Norman's *Affordances and Design* essay (404). Any claim in this file attributed to those is flagged "unverified" at the entry.

**Implication for lenses.** Of the 31 viewpoints, 13 are "yes" measurable (`feedback-within-a-second`, `signifiers-make-clickable-look-clickable`, `no-false-affordances`, `natural-mapping-and-proximity`, `fitts-target-size-and-distance`, `postel-tolerant-input`, `von-restorff-one-emphasis`, `placeholders-are-not-labels`, `labels-above-fields`, `single-column-forms`, `field-width-matches-expected-input`, `inline-validation-after-leaving-field`, `fewer-checkout-fields`), 15 are "partly" (a machine can count a symptom, a person owns the verdict), and 3 stay taste (`dont-make-me-think`, `aesthetic-usability-effect-bias`, `start-with-user-needs-design-with-data`). A lens should carry all three kinds but mark them: a probe for the first kind, a counted hint for the second, and a question for the person for the third.
