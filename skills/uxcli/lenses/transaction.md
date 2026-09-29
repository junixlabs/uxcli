# Transactions and forms — the `transaction` lens

Checkout, sign-up, booking, onboarding and multi-step forms: one task, completed once, correctly.

44 viewpoints from named designers. Answer every one for the screen you are looking at: `holds` with where, `breaks` with where and what, `n/a` with why. The sequence, the review file and `uxcli review check` are in `../references/lenses.md`. The rules are the designers', not uxcli's and not yours.

## 1. `usability.fitts-target-size-and-distance`

Make targets big, space them apart, and put them where the pointer already is; touch targets at least 1 cm square.

- **Source:** Aurora Harley, NN/g, *Touch Targets on Touchscreens (2019)* — https://www.nngroup.com/articles/touch-target-size/ (study)
- **In their words:** "at least 1cm × 1cm (0.4in x 0.4in)"
- **Do:** Make targets big; Give icons labels so the label extends the target; Keep ample spacing between targets; Put the call to action near the final form fields
- **Don't:** Pack icon-only 24 px controls edge to edge on touch layouts; Crowd targets
- **Look at:** Bounding box of each interactive element at the mobile viewport (1 cm ≈ 38 CSS px; 24/44 px are the usual proxies); centre-to-centre spacing; distance from last input to submit; label inside the clickable box.
- **Unless:** Infinite targets along screen edges for mouse — size matters less at an edge; Primary CTAs, moving users, children and the elderly need larger than the minimum
- **Also stated as:** usability.hicks-fewer-choices-when-time-matters (Jon Yablonski (Laws of UX)); usability.peak-end-finish-well (Jon Yablonski (Laws of UX)); usability.von-restorff-one-emphasis (GOV.UK Design System); craft.growth-design-psychology-principles (Growth.Design (Dan Benoni, Louis-Xavier Lavallée)); modern.no-deceptive-patterns (Harry Brignull).

## 2. `usability.no-false-affordances`

Nothing that is not interactive may look interactive: no underlined or blue static text, no button-shaped badges, no pointer cursor on inert elements.

- **Source:** Hoa Loranger, NN/g, *Beyond Blue Links: Making Clickable Elements Recognizable (2015)* — https://www.nngroup.com/articles/clickable-elements/
- **In their words:** "Avoid making non-clickable items (like headings) resemble buttons."
- **Do:** Reserve link colour and underline for links; Reserve button shape and fill for buttons
- **Don't:** Give static items hyperlink colours; Underline non-interactive text; Make headings or badges resemble buttons
- **Look at:** Elements with no href, handler, role or tabindex that have cursor: pointer, underline plus link colour, or a button-like box (border-radius, filled background, short centred text).
- **Also stated as:** canon.rams-honest (Dieter Rams).

## 3. `usability.inline-validation-after-leaving-field`

Validate a hard field after the user leaves it, never on focus or while typing, and clear the error live once it is fixed.

- **Source:** Luke Wroblewski with Etre, *Inline Validation in Web Forms (A List Apart #291, 2009)* — https://alistapart.com/article/inline-validation-in-web-forms/ (study)
- **In their words:** "22% increase in success rates … 42% decrease in completion times … 47% decrease in eye fixations"
- **Do:** Validate on blur or when the input reaches its expected length; Re-check on each keystroke once an error shows and clear it when fixed; Keep success and error messages visible rather than fading; Reserve inline validation for hard fields like username and password
- **Don't:** Validate before and while typing; Show an error on focus of an empty field; Validate only on submit
- **Look at:** Drive a field: focus shows no error; typing an invalid value shows none (unless length threshold reached); blur shows an error adjacent via aria-describedby; typing a fix clears it without blur.
- **Unless:** Simple fields need none; premature validation was worse than none (Wroblewski)
- **Also stated as:** usability.visibility-of-system-status (Jakob Nielsen); modern.feedback-is-local-and-optimistic (Rauno Freiberg).

## 4. `usability.feedback-within-a-second`

Paint something within 0.1 s; keep the user's flow with a response under 1 s; show a progress indicator for anything longer.

- **Source:** Jakob Nielsen, *Response Times: The 3 Important Limits (1993)* — https://www.nngroup.com/articles/response-times-3-important-limits/ (study)
- **In their words:** "0.1 second is about the limit for having the user feel that the system is reacting instantaneously … 1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **Do:** Use a progress indicator for any action over about 1 s; Use a looped indicator for 2–9 s waits; Use a percent-done indicator for 10 s or more
- **Don't:** Leave dead time with no indicator; Show a percent-done bar that lies badly
- **Look at:** Time from input event to first paint of any change; presence of a progress element, aria-busy, <progress> or role=status update when the wait exceeds 1 s.
- **Unless:** Laws of UX claims a purposeful delay can raise perceived value — an opinion with no study cited
- **Also stated as:** modern.interactions-feel-immediate-under-200ms (Rauno Freiberg).

## 5. `usability.signifiers-make-clickable-look-clickable`

Links and buttons must look clickable — colour, underline, border or fill — because weak signifiers cost measured time and fixations.

- **Source:** Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty (2017)* — https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ (study)
- **In their words:** "22% more time"
- **Do:** Make links stand out from body text; Make buttons resemble physical buttons with rectangular shapes; Apply consistent treatment throughout the site; Provide signifiers rather than rely on affordances
- **Don't:** Style linked text as static text; Use ghost buttons as the default; Use disabled buttons if avoidable; Rely on a label to say that a control is a control
- **Look at:** For each a[href], button, [role=button]: computed colour, underline, border and background versus surrounding text; a link matching body colour with no underline and no other differentiator is weak; count disabled buttons.
- **Unless:** Link position in nav menus or peripheral lists may eliminate the need for underlining (Loranger); Flat works best with low information density, traditional layouts and high-contrast targets positioned standardly (Moran)
- **Also stated as:** modern.signifiers-survive-flatness (Kate Moran (NN/G)).

## 6. `usability.speak-the-users-language`

Write in the words the actor already uses; no internal jargon, error codes or unexplained abbreviations.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #2* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon."
- **Do:** Use words the user understands without looking them up; Spell acronyms out in full on each page; Write 'for example', not 'eg' or 'ie'
- **Don't:** Show bare error codes; Expose internal entity names; Use unexplained abbreviations
- **Look at:** Flag bare error codes (e.g. ERR-422, Error 0x…), all-caps acronyms not defined on the page, and Latin abbreviations; whether a term is jargon for this actor needs the journey's actor.
- **Unless:** Expert-only tools where the domain term is the users' language — match the user, do not simplify per se

## 7. `usability.minimalist-no-competing-information`

Everything on the screen competes with the primary goal; remove what does not serve it so the main action stays visible.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #8* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility."
- **Do:** Prioritise content and features that support the primary goal; Keep the primary action in the first viewport; Let the small screen force focus on what matters
- **Don't:** Let decorative elements distract; Let secondary content outweigh the primary action
- **Look at:** At 360 px: count distinct interactive elements above the fold; whether the journey's primary action is within the first viewport; count of elements sharing the accent colour.
- **Unless:** Dense expert dashboards where the irreducible information is large

## 8. `usability.postel-tolerant-input`

Accept every reasonable form of an input — spaces, dashes, case, whitespace — and normalise it, instead of rejecting it.

- **Source:** Jon Yablonski (Laws of UX), *Postel's Law — Laws of UX* — https://lawsofux.com/postels-law/
- **In their words:** "Be liberal in what you accept, and conservative in what you send."
- **Do:** Accept variable input and translate it to your format; Normalise on blur; Define boundaries and give clear feedback
- **Don't:** Reject spaces or dashes in card or phone numbers; Reject leading or trailing whitespace in email; Treat email as case-sensitive; Force a date format the field could parse
- **Look at:** Drive each formatted field with equivalent variants ('4111 1111 1111 1111' vs '4111111111111111', ' a@b.co ', '+44 20…' vs '02…') and compare validation outcomes.
- **Unless:** Inputs where ambiguity is dangerous, such as dates in medical or legal contexts

## 9. `usability.omit-needless-words`

Cut word count by half: no happy-talk intros, no instruction paragraphs before forms, no marketese, sentence case everywhere.

- **Source:** Jakob Nielsen, *How Users Read on the Web (1997)* — https://www.nngroup.com/articles/how-users-read-on-the-web/ (study)
- **In their words:** "People rarely read Web pages word by word; instead, they scan the page"
- **Do:** Reduce word count by half compared to traditional writing; Limit paragraphs to one idea each; Use sentence case everywhere except proper nouns
- **Don't:** Open with welcome or happy talk; Put instruction paragraphs before forms; Use promotional language ('marketese'); Set labels in ALL CAPS or Title Case
- **Look at:** Word count between a form's heading and its first input; word count of blocks starting 'Welcome' or 'Thank you for'; buttons and labels in all caps or Title Case; sentence count in instructions.
- **Unless:** Nielsen also asks for outbound links to build trust — brevity is not zero text

## 10. `usability.progress-indication-in-flows`

In flows of three or more steps give some sense of position; do not assume a step bar helps — GOV.UK removed one with no effect.

- **Source:** Jon Yablonski (Laws of UX), *Goal-Gradient Effect — Laws of UX* — https://lawsofux.com/goal-gradient-effect/ (study)
- **In their words:** "The tendency to approach a goal increases with proximity to the goal."
- **Do:** Show a step or position label in long flows; Update the position between steps
- **Don't:** Leave a long wizard with no step label anywhere; Cite the Zeigarnik effect as the reason for a progress bar; Fake progress to manipulate
- **Look at:** Presence of a step or position element in flows with 3 or more steps, and whether it updates between steps.
- **Unless:** Short flows — GOV.UK's own guidance omits indicators by default; Artificial 'endowed progress' edges toward manipulation — flag, do not recommend

## 11. `usability.single-column-forms`

Forms run in one vertical column; only coherent entities like city/state/ZIP or card/expiry/CVV share a row.

- **Source:** Baymard Institute, *Form Field Usability: Avoid Extensive Multicolumn Layouts (2023)* — https://baymard.com/blog/avoid-multi-column-forms (study)
- **In their words:** "Use a single-column layout to support users' visual understanding of forms"
- **Do:** Keep one vertical path through the form; Allow a shared row only for a single coherent entity
- **Don't:** Lay out two independent question columns
- **Look at:** Cluster inputs by left x-coordinate; more than one column of independent inputs, not in the same fieldset or an allowed coherent row, fails.
- **Unless:** Coherent-entity rows: city/state/ZIP and card number/expiry/security code

## 12. `usability.fewer-checkout-fields`

Count fields, not steps: a guest checkout needs about eight, with optional fields collapsed behind links and billing defaulted to shipping.

- **Source:** Baymard Institute, *Checkout Optimization: minimize form fields (2024)* — https://baymard.com/blog/checkout-flow-average-form-fields (study)
- **In their words:** "The number of form fields in a checkout impacts overall usability far more than the number of steps."
- **Do:** Consolidate to a single 'Full Name' field; Hide Address Line 2 and the coupon field behind links; Default billing to shipping; Offer account creation after purchase
- **Don't:** Count steps as the metric; Show every optional field by default
- **Look at:** Count visible input, select and textarea across the checkout (excluding hidden and collapsed); optional fields shown expanded; separate first/last name fields; an open coupon field.
- **Unless:** Regulatory or fraud fields that genuinely cannot be defaulted; The minimum of 8 assumes a standard guest checkout

## 13. `usability.aesthetic-usability-effect-bias`

Polish makes a screen look more usable than it is; discount your aesthetic impression and run the measurable checks first.

- **Source:** Kate Moran, NN/g, *The Aesthetic-Usability Effect (2024, rev. 2026)* — https://www.nngroup.com/articles/aesthetic-usability-effect/ (study)
- **In their words:** "Users' tendency to perceive attractive products as more usable. People tend to believe that things that look better will work better — even if they aren't actually more effective or efficient."
- **Do:** Rate your own screen after the measurable checks, not before; Treat polish as tolerance for minor problems only
- **Don't:** Read polish as usability; Let an attractive surface hide a usability problem
- **Look at:** Did the evaluator judge the screen usable because it looks good? Re-check the verdict against the count-kind entries before trusting it; 'attractive' is the variable and stays taste.
- **Unless:** With severe usability issues, or functionality sacrificed for aesthetics, users lose patience

## 14. `usability.clearly-marked-emergency-exit`

Every interaction has a visible, labelled way out — Cancel, Back, Escape, Undo — so a mistaken action does not trap the user.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #3* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- **Do:** Support Undo and Redo; Show a clear Cancel or close control; Label the exit clearly and make it discoverable
- **Don't:** Open a modal with no close; Build a wizard step with no back; Ship a destructive action with no undo
- **Look at:** For each role=dialog or modal: a focusable control whose text or aria-label matches close/cancel/back, and Escape dismisses it; for each step past the first in a flow: a back control exists.
- **Unless:** Legally required interstitials — the exit must still be visible, not necessarily free of consequence

## 15. `usability.help-in-context`

The best help is none; when a field needs explaining, put a short hint beside it at the moment it is needed, not on another page.

- **Source:** Jakob Nielsen, *10 Usability Heuristics for User Interface Design, heuristic #10* — https://www.nngroup.com/articles/ten-usability-heuristics/
- **In their words:** "Whenever possible, present the documentation in context right at the moment that the user requires it."
- **Do:** Use hint text for help relevant to most users; Keep hint text to one short sentence without full stops; Associate the hint with its input via aria-describedby
- **Don't:** Put help only on a separate page; Put links inside hint text; Write lengthy explanations
- **Look at:** For inputs with a format expectation (date, postcode, card): a hint associated via aria-describedby and rendered adjacent, same column, within one line-height; hint length in sentences.
- **Unless:** Nielsen's own first sentence: it is best if the system needs no additional explanation

## 16. `usability.natural-mapping-and-proximity`

Put a control next to the thing it changes and a label next to its field; gaps between groups must exceed gaps within them.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "items near each other appear related"
- **Do:** Place labels as close to their fields as possible; Group related fields together; Place related targets close to each other; Put the call to action near the final form fields
- **Don't:** Put a control far from the thing it changes; Separate groups by less space than their members
- **Look at:** Distance from each label to its own input versus the nearest other input; gap within a fieldset versus gap between fieldsets; distance from last input to the submit button.
- **Unless:** Left-aligned labels are acceptable if space is constrained and labels are of similar length

## 17. `usability.placeholders-are-not-labels`

Every input has a visible label outside the field; placeholder text is never the label, the hint or the only format example.

- **Source:** Katie Sherwin, NN/g, *Placeholders in Form Fields Are Harmful (2014)* — https://www.nngroup.com/articles/form-design-placeholders/
- **In their words:** "Disappearing placeholder text strains users' short-term memory."
- **Do:** Give every text input a visible label; Put hints outside empty form fields
- **Don't:** Use placeholder text in place of a label; Use placeholder text for hints or examples; Hide the label visually and rely on the placeholder
- **Look at:** Any input or textarea with a placeholder and no visible associated label, or with a visually hidden label; placeholder used as the only format example.
- **Unless:** A single-field search where the button label carries the meaning is the usual carve-out; the fetched page states none explicitly

## 18. `usability.labels-above-fields`

Stack the label above its field, left edges aligned, a few pixels apart, so label and field are read in one fixation.

- **Source:** Marieke McCloskey, NN/g, *Form Design Quick Fix: Group Form Elements Effectively Using White Space (2013)* — https://www.nngroup.com/articles/form-design-white-space/
- **In their words:** "users can see the text field in the same fixation as the label"
- **Do:** Top-align labels for familiar data like names, addresses and payment; Let users move in one direction: downward
- **Don't:** Put left labels far from their fields; Use right-justified labels with a ragged left edge; Put the label inside the field
- **Look at:** For each label/input pair: label box bottom ≤ input box top and label left edge ≈ input left edge within a few px; if side by side, the gap between label right edge and input left edge.
- **Unless:** Landscape phones: switch to left-aligned to keep the field visible above the keyboard (Baymard); Left-aligned is acceptable when labels are of similar length and as close to the fields as possible (NN/g)

## 19. `usability.field-width-matches-expected-input`

Size each input to the data it expects: short boxes for year, postcode and CVV; one consistent width for variable data like email.

- **Source:** Jamie Holst, Baymard Institute, *Form Field Usability: Matching User Expectations (2010)* — https://baymard.com/blog/form-field-usability-matching-user-expectations
- **In their words:** "Matching your customer's expectations – even when it comes to the subconscious expectations of how wide an input field should be – is crucial."
- **Do:** Fit fixed-length data with a width that matches it; Give variable common data one consistent width
- **Don't:** Make a CVV box as wide as an address line; Let a card-number field visibly truncate
- **Look at:** Rendered input width in ch of its font versus maxlength, inputmode, autocomplete token or pattern length: cc-csc wider than ~8 ch, postal-code at full width, or email narrower than ~20 ch.
- **Unless:** Full-width inputs on narrow phones are the norm — check at desktop widths or compare relative widths within the form

## 20. `usability.one-thing-per-page`

Split a public-facing form so each page asks one question, decision or piece of information, with eligibility questions first.

- **Source:** GOV.UK Service Manual, *Structuring forms (2018)* — https://www.gov.uk/service-manual/design/form-structure
- **In their words:** "Start by splitting the form across multiple pages with each page containing just one thing"
- **Do:** Ask one question per page; Start with questions that reveal ineligibility; Branch so people answer only relevant questions; Break complex tasks into smaller steps
- **Don't:** Put a long multi-section form in a public-facing transactional service
- **Look at:** Count distinct questions (label groups or fieldsets) per page in a flow; count required inputs per page.
- **Unless:** Be consistent, not uniform: internal expert tools and repeat users may prefer denser pages

## 21. `usability.dont-make-me-think`

A page's purpose and controls should be self-evident; nothing on it should raise a question the user must answer before acting.

- **Source:** Steve Krug, *Don't Make Me Think (2nd ed.), chapter 1 — Krug's First Law of Usability* — https://sensible.com/downloads/dmmt-toc.pdf
- **In their words:** "Don't make me think!"
- **Do:** Make the page's purpose obvious at a glance; Make every control self-evident
- **Don't:** Raise a question the user must answer before acting
- **Look at:** Look at the screen cold: is there anything you have to work out before you can act? The law is the sum of the other entries; a machine measures its symptoms, not the law.

## 22. `usability.start-with-user-needs-design-with-data`

Name the actor and their need before drawing a screen, then let measured behaviour, not hunches or looks, decide what changes.

- **Source:** GDS / GOV.UK, *Government Design Principles, principles 1, 3 and 4* — https://www.gov.uk/guidance/government-design-principles
- **In their words:** "Service design starts with identifying user needs. If you don't know what the user needs are, you won't build the right thing."
- **Do:** State the actor and need before the screen; Measure real behaviour; Start small and iterate
- **Don't:** Design to a hunch; Design to an aesthetic
- **Look at:** Does the journey name its actor and need (uxcli context show), and is the design decision traceable to observed behaviour rather than a hunch or a look?

## 23. `usability.constraints-shift-complexity-to-the-system`

Complexity that cannot be removed goes to the system, not the user: default what can be inferred, hide what is rarely needed.

- **Source:** Larry Tesler, via Jon Yablonski (Laws of UX), *Tesler's Law — Laws of UX* — https://lawsofux.com/teslers-law/ (secondary)
- **In their words:** "For any system there is a certain amount of complexity which cannot be reduced"
- **Do:** Set billing address equal to shipping by default; Hide Address Line 2 behind an expandable link; Collapse coupon code fields by default; Offer account creation after checkout completion
- **Don't:** Ask for what the system can infer or default; Show rarely used fields by default
- **Look at:** Count visible required inputs the page could default (no 'same as shipping' control, both address blocks open); presence of autocomplete tokens on address and payment inputs.
- **Unless:** Tognazzini's counter-view: users resist complexity reduction and attempt harder tasks when systems get simpler

## 24. `craft.fewer-borders`

Separate elements with space, a background shift, a shadow or striping before reaching for a border; too many borders make a design busy.

- **Source:** Adam Wathan & Steve Schoger, *Refactoring UI* — https://www.refactoringui.com/
- **In their words:** "Borders are a great way to distinguish two elements from one another, but using too many of them can make your design feel busy and cluttered."
- **Do:** Separate groups with space; Shift the background colour or add a shadow instead of a line; Zebra-stripe table rows instead of ruling them
- **Don't:** Use a 1px border as the default grouping device; Wrap a nav in a panel that only needs to recede; Rule every table row with a border when striping would do
- **Look at:** For every text node, count ancestors with a visible border, non-none box-shadow or outline; report max nesting depth and bordered boxes per viewport. Counted by `page.nesting`: `review check` refuses a `holds` it contradicts.
- **Unless:** Form inputs and the one object a person acts on keep their border; Keylines that make disconnected content feel connected; Decorative borders as style once the count is low
- **Also stated as:** canon.gestalt-common-region (Aurora Harley, NN/g); canon.rams-as-little-design-as-possible (Dieter Rams); modern.fewer-borders-more-space (Adam Wathan & Steve Schoger); canon.tufte-smallest-effective-difference (Edward Tufte); canon.tufte-one-plus-one-equals-three (Edward Tufte).

## 25. `craft.spacing-and-sizing-system`

Draw every margin, padding and gap from one scale, and make space between groups clearly larger than space within them.

- **Source:** Steve Schoger, *Little UI Details (tweet, 13 Jul 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "Using multiples to define your spacing is a great way to achieve vertical rhythm and provides a formula to justify your choices"
- **Do:** Take spacing from a ladder of multiples of 4; Make between-group gaps larger than within-group gaps
- **Don't:** Use one-off values such as 13px or 27px; Use equal gaps across a group boundary
- **Look at:** Collect all computed margin, padding and gap values above 0; report distinct values and how many are off a 4px grid; compare label-to-field gap with field-to-next-label gap.
- **Unless:** Optical adjustments on icons and hanging punctuation sit a pixel or two off-scale
- **Also stated as:** canon.rams-thorough-to-the-last-detail (Dieter Rams); modern.radii-are-few-and-concentric (Vercel Labs); modern.quality-is-a-choice-spec-is-the-floor (Karri Saarinen); modern.spacing-comes-from-a-scale (Stan Kirilov).

## 26. `craft.separation-order-space-then-lines-then-boxes`

Use the lightest separator that works: more space first, then a keyline or background band, and a box only for the object that is acted on.

- **Source:** Adam Wathan & Steve Schoger; Erik D. Kennedy, *Refactoring UI (fewer-borders tactic); 7 Rules for Creating Gorgeous UI, Part 1* — https://www.refactoringui.com/ (folklore: the wording is not verified)
- **Do:** Separate with whitespace by default; Add a keyline or background band only when space alone fails; Box only the object a person acts on
- **Don't:** Reach for a card or border first
- **Look at:** Between sibling groups, record which separator is used: gap at least 2x the inner gap (space), hr or border-bottom (line), bordered or shadowed wrapper (box); report the inner/outer gap ratio.
- **Unless:** Dense data such as tables where zebra stripes or keylines are used; Interactive cards that are the unit of action

## 27. `craft.body-16px-line-height-1-5`

Body copy at 16px or more with 1.5 line height; inputs at 16px or more on mobile.

- **Source:** Steve Schoger, *Little UI Details (tweet, 1 Jun 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "If in doubt, 16px font with 1.5 line height is pretty good safe for body copy."
- **Do:** Set body at 16px or more, secondary about 2px smaller; Set inputs at 16px or more on mobile; Set text-heavy desktop pages at 18–24px
- **Don't:** Set body text under 16px on phones; Set inputs under 16px on iOS
- **Look at:** At a 375px viewport, computed font-size of paragraph text and of input, textarea and select; line-height divided by font-size for paragraphs.
- **Unless:** Interaction-heavy desktop pages may go to 14px; Captions sit 2px under body by design
- **Also stated as:** modern.readable-type-sizes-and-weights (Rauno Freiberg); modern.mobile-inputs-do-not-zoom-or-trap (Rauno Freiberg).

## 28. `craft.tap-targets-and-control-height`

Touch targets are at least 44×44; inputs and the buttons beside them share one height of 40 or 48px.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The minimum tap target size on both iOS and Android — On iOS: 44x44pt. On Android: 48x48pt."
- **Do:** Give touch viewports hit areas of 44×44 or more; Match button height to the inputs beside it
- **Don't:** Use 26px-wide grid cells as targets; Make buttons shorter than the inputs they sit beside
- **Look at:** At 375px, getBoundingClientRect of every a, button, input and role=button: fail under 44 in width or height (under 24 for inline text links); in a form row, button and input heights within 2px.
- **Unless:** Inline text links in running prose; Dense desktop-only tools if the project commits to no touch
- **Also stated as:** modern.hit-targets-meet-platform-minimums (Apple).

## 29. `craft.type-scale-few-font-sizes`

Use about four font sizes from a fixed scale; reuse the default size for body, menus, lists and controls.

- **Source:** Erik D. Kennedy, *The Responsive Website Font Size Guidelines* — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
- **In their words:** "Even the most interaction-heavy pages can typically look just fine with about 4 font sizes total."
- **Do:** Use header, default, secondary (default minus 2px) and one wildcard size; Reuse the default size across body, menus, lists and controls
- **Don't:** Invent a new size per component; Apply a strict modular or golden-ratio scale to responsive pages
- **Look at:** Count distinct computed font-size values on visible text per viewport and how many fall outside the declared scale.
- **Unless:** Sizes must stay distinguishable, so large text may step many points apart; Marketing pages may add a display size
- **Also stated as:** canon.vignelli-two-type-sizes (Massimo Vignelli).

## 30. `craft.button-hierarchy-one-primary`

One filled brand-colour button per view; secondaries outlined, tertiaries as text, destructive actions quiet with a confirmation step.

- **Source:** Steve Schoger, *Little UI Details (tweet, 2 Aug 2017)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "You want your primary button to stand out much more than your secondary / danger actions."
- **Do:** Fill exactly one button per view or dialog in the brand colour; Outline secondary actions and set tertiary actions as text; Keep destructive actions quiet unless they are the primary job
- **Don't:** Let a green button compete with the primary; Put a big red Delete beside a small Save; Colour every link brand blue
- **Look at:** Classify buttons as filled, outlined or text from computed style; fail if a view or dialog has more than one filled button of distinct hues, or a delete-labelled button is filled while the confirming action is not.
- **Unless:** Segmented or toggle groups; Toolbars of equal-weight actions; A page whose only job is the destructive action, where red is primary

## 31. `craft.wcag-contrast-and-dont-rely-on-colour-alone`

Meet 4.5:1 for body text and 3:1 for headlines, prefer soft backgrounds with dark text, and never convey status by colour alone.

- **Source:** Erik D. Kennedy, *100 Things a UX/UI Designer Should Know* — https://www.learnui.design/blog/100-things-ux-ui-designer-know.html
- **In their words:** "The WCAG recommended contrast ratio for body text — 4.5:1 to meet AA standards"
- **Do:** Style coloured badges as a soft background with dark text; Pair every colour state with an icon or label
- **Don't:** Set white text on yellow, green or red fills that fail 4.5:1; Convey status by colour only
- **Look at:** Standard contrast ratio of computed text colour against effective background at 4.5:1 or 3:1 by size; status elements must carry a non-colour signal such as text or an icon.
- **Unless:** Disabled controls; Logos; Incidental text, per WCAG itself
- **Also stated as:** modern.contrast-and-not-colour-alone (Apple).

## 32. `craft.anything-but-dropdowns`

Before a dropdown, try a switch, segmented control, radios, cards, typeahead, calendar, text input or stepper.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "Any time you feel tempted to use a dropdown, ask yourself if one of these 12 controls is better instead. … dropdowns are pretty much the worst control."
- **Do:** Use a switch, checkbox or segmented button for two options; Use radios, segmented buttons or cards for two to five options; Use typeahead for long lists, a calendar or text input for dates, a stepper for counts
- **Don't:** Use a select for five or fewer options; Use three selects for a date; Ship a 195-country select without search on mobile
- **Look at:** For each select: fail at 5 or fewer options unless committed as a rarely changed default; fail 2–3 adjacent selects with day, month, year options; flag over 30 options at 375px with no typeahead.
- **Unless:** Users rarely need to change the default value; There are very few options; The user is not on mobile
- **Also stated as:** modern.boring-and-familiar-beats-novel (Scott Berkun).

## 33. `craft.hierarchy-is-everything-squint-test`

Squint: the most important thing must catch the eye first and the least important last; one element dominates each screen.

- **Source:** Erik D. Kennedy, *4 Rules for Intuitive UX* — https://www.learnui.design/blog/4-rules-intuitive-ux.html
- **In their words:** "If you squint your eyes, the Most Important Thing should catch your eye first – and the least important elements should catch your eye last."
- **Do:** Give each screen one dominant element; Emphasize the most-used functionality; De-emphasize, hide or remove the rarely used
- **Don't:** Make the primary action grey and unnoticeable beside a bigger, brighter Help; Render two identical grey buttons where one is the main action
- **Look at:** Given a declared primary action, score every interactive element as area x contrast x font-weight factor; the declared primary must rank first, and no set of buttons may sit within 10% of each other.
- **Unless:** Page titles are the only element styled all-out up-pop; A browsing page such as a gallery may have no single most important thing

## 34. `craft.greys-dont-have-to-be-grey-never-use-black`

Tint the neutral scale toward the brand hue and never use pure black for text.

- **Source:** Steve Schoger, *Little UI Details (tweet, 19 Mar 2018)* — https://digitalsynopsis.com/design/useful-ui-ux-design-tips/
- **In their words:** "'Grey' doesn't have to mean Grey™. Try saturating your greys with a bit of blue or brown for a cooler or warmer feel."
- **Do:** Tint the grey scale toward the brand hue; Raise saturation at the light and dark ends of the scale
- **Don't:** Use #000 for text; Use pure zero-saturation greys as the whole neutral palette
- **Look at:** Count text, border and background colours with saturation 0 and lightness under 15%, and the share of neutral swatches with saturation exactly 0.
- **Unless:** It does not always work; worth a trial; High-contrast or accessibility modes and print

## 35. `craft.grids-are-overrated-content-dictates-width`

Let content dictate its own width and the layout follow; do not stretch components because the screen grew.

- **Source:** Erik D. Kennedy, *Why Beginning Designers Don't Need Grids, Type Scales, or Color Theory* — https://www.learnui.design/blog/why-beginning-designers-dont-need-grids-type-scales-color-theory.html
- **In their words:** "The hassle with grids is that they force the content into a specific width. Content should always dictate it's own width … and the layout should follow suit."
- **Do:** On mobile align to three rulers: 16px left, centre, 16px right; Keep content at fixed sizes such as a 72px thumbnail
- **Don't:** Stretch every element wider because the phone got wider; Size components by percentage so they shrink below their content's need
- **Look at:** At 360–414px viewport, every content edge sits at 16px (or one consistent gutter) from the viewport edge and nothing overflows horizontally.
- **Unless:** Strict grids for posters and websites where the artistry of the composition matters more than the information

## 36. `canon.bringhurst-leading-is-a-rhythmic-unit`

The leading is the vertical unit; add and remove vertical space in multiples of it.

- **Source:** Robert Bringhurst, *The Elements of Typographic Style §2.2.1 / §2.2.2 (via webtypography.net)* — http://webtypography.net/2.2.1
- **In their words:** "You must choose not only the overall measure – the depth of the column or page – but also a basic rhythmical unit. This unit is the leading, which is the distance from one baseline to the next."
- **Do:** Use a unitless line-height such as 1.5; Make vertical margins multiples of the line-height
- **Don't:** Vertical spacing unrelated to the line unit; Line-height below 1 on running text
- **Look at:** Body line-height L; margins and paddings between text blocks as multiples of L (or L/2 if the lens allows).
- **Unless:** More leading for longer measures, darker faces, larger x-height and sans serifs: the ratio moves with the face

## 37. `canon.butterick-emphasis-sparingly`

One emphasis device at a time: bold or italic, never both; underline only links; caps only under one line and tracked.

- **Source:** Matthew Butterick, *Practical Typography, Summary of key rules* — https://practicaltypography.com/summary-of-key-rules.html
- **In their words:** "Use bold or italic as little as possible, and not together."
- **Do:** Bold-only headings; Caps only on one-line labels with 5–12% tracking; Underline only on links
- **Don't:** Bold italic; Underlined non-links; All-caps paragraphs; Centred body text
- **Look at:** Elements with font-weight ≥600 and italic; underline on non-anchors; uppercase on blocks rendering more than one line; centred multi-line paragraphs; uppercase runs with letter-spacing under 0.05em.
- **Unless:** Underline for web links; All caps under one line of text

## 38. `modern.defaults-are-decisions-you-inherited`

A library or AI default is someone else's decision; commit to one written aesthetic direction instead of inheriting it.

- **Source:** hipuku, *The Default Is Not a Design Decision* — https://www.hipuku.dev/writing/the-default-is-not-a-design-decision
- **In their words:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why."
- **Do:** A written token set such as DESIGN.md; One committed aesthetic direction; Semantic colour
- **Don't:** Untouched library defaults; Clean and modern as a brief; The AI-look constellation of purple gradient, Inter, identical cards, glass glow and bounce hover
- **Look at:** Score the constellation: purple-to-blue/cyan gradients warn, Inter or Roboto with no display face notes, 3+ identical icon+h3+p cards note, backdrop-filter plus glow notes, gradient text on numerals warns, overshoot cubic-bezier on hover warns.
- **Unless:** A purple brand is allowed to be purple; the tell is the constellation and the absence of a decision, not any one colour
- **Also stated as:** craft.supercharge-the-defaults (Steve Schoger (attendee notes by ynotdraw)).

## 39. `modern.delight-scales-with-rarity`

Spend delight on rare moments, keep daily actions plain, and never let an element visibly duplicate itself during a transition.

- **Source:** Benji Taylor, *Family Values* — https://benji.org/family-values
- **In their words:** "the potential for delight increases as the frequency of feature usage decreases"
- **Do:** Directional motion between tabs; Morphing labels such as Continue to Confirm; One action per tray
- **Don't:** Static jumps on core flows; Theatrical motion on daily actions; An element visibly duplicated mid-transition
- **Look at:** After a transition, count DOM nodes with the same key or text present twice on screen at once; frequency-weighted motion needs the journey to say what is frequent.
- **Unless:** Utility, performance and security come first; delight is selective emphasis

## 40. `modern.motion-values-proportional-to-trigger`

Scale and fade motion starts near its resting size, in proportion to the trigger, never from zero or a heavy squash.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "Don't animate dialog scale in from 0 → 1, fade opacity and scale from ~0.8. Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so."
- **Do:** Enter dialogs and popovers from scale 0.8–0.97 with opacity; Press buttons to about scale 0.96–0.97
- **Don't:** Scale-from-zero pops on dialogs; Press states that squash a button to 0.8 or below
- **Look at:** Parse @keyframes and WAAPI keyframes on dialogs, popovers and buttons and read the starting scale(); :active transforms below about 0.9 fail.
- **Unless:** Elements that genuinely originate from a point, such as a FAB expanding into a sheet, can grow from small

## 41. `modern.animate-only-transform-and-opacity`

Animate only transform and opacity, listing properties explicitly; never transition all or animate layout properties.

- **Source:** Emil Kowalski, *Great Animations* — https://emilkowal.ski/ui/great-animations
- **In their words:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)"
- **Do:** Prefer CSS, then WAAPI, then JS for motion; Use clip-path for reveals; List transitioned properties explicitly
- **Don't:** transition: all; Animating width, height, top, left, margin or padding; Large blur() values on filter or backdrop-filter in motion
- **Look at:** Scan stylesheets and computed transition-property for all and for layout properties; scan @keyframes for width, height, top and left.
- **Unless:** Accordion height animation via grid-template-rows or interpolate-size is layout by nature and accepted when it is the only honest way

## 42. `modern.focus-is-visible-and-unobscured`

Every focusable element shows a visible focus ring on :focus-visible, and no sticky or fixed element ever covers it.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "NEVER: `outline: none` without visible focus replacement"
- **Do:** Style :focus-visible with box-shadow or outline plus outline-offset
- **Don't:** outline: none or 0 with no replacement; Focus rings hidden under sticky headers
- **Look at:** Tab through every focusable element; diff the focused and unfocused rect or read computed outline and box-shadow under :focus-visible; check the focused rect is not intersected by position fixed or sticky elements above it.

## 43. `modern.every-state-is-designed`

Empty, sparse, dense, error and loading states are designed; skeletons match final layout and long content never overflows.

- **Source:** Vercel Labs, *Web Interface Guidelines — AGENTS.md* — https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **In their words:** "MUST: Design empty/sparse/dense/error states"
- **Do:** An empty state with a primary create action; Skeletons sized like real rows; min-w-0 and truncation on flex children
- **Don't:** Blank screens on empty arrays; Spinners that reflow content; Overflow from long strings
- **Look at:** Render with [], with 1 item, with 500 items and with a 300-character title; assert no horizontal overflow, no overlap, an actionable control in the empty state, and skeleton-to-loaded CLS under a threshold.

## 44. `modern.numbers-and-text-do-not-shift-layout`

Numbers in columns and timers use tabular figures, images carry dimensions, and nothing changes weight on hover.

- **Source:** Rauno Freiberg, *Web Interface Guidelines* — https://interfaces.rauno.me/
- **In their words:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"
- **Do:** tabular-nums in tables, timers and prices; width and height on every img
- **Don't:** Proportional digits in columns; Images without dimensions; Weight changes on hover
- **Look at:** Numeric td cells whose computed font-variant-numeric lacks tabular-nums; img without width/height or aspect-ratio; sibling rect drift while a counter fixture runs.
- **Unless:** Prose numbers
