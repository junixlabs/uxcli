# Lens research — modern product craft and community

Researched 2026-09-29 for the uxcli "lenses" idea: packaged, sourced viewpoints an agent can hold a freshly built screen against. This file covers the **modern product / interaction craft** school (Rauno, Emil, Linear, Vercel, Comeau, Apple HIG, Material, Polaris, Atlassian) and the **community critiques** that school ships alongside (AI-look, dark patterns, flat 2.0, sameness, cards, junk drawers, "boring is good"). Every URL below was fetched during this session unless marked otherwise.

## Sources fetched

| source | author | URL (actually fetched) | what it is |
|---|---|---|---|
| Invisible Details of Interaction Design | Rauno Freiberg | https://rauno.me/craft/interaction-design | Essay: metaphors, gesture thresholds, frequency & novelty, Fitts's law |
| Web Interface Guidelines | Rauno Freiberg | https://interfaces.rauno.me/ | Living checklist of concrete web-UI details (fetched raw HTML via curl) |
| Web Interface Guidelines (README + AGENTS.md) | Vercel Labs (maintainers incl. Rauno's lineage; John Phamous, Emil linked) | https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/README.md and …/AGENTS.md | MUST/SHOULD/NEVER rules for agents building UI |
| Geist introduction | Vercel | https://vercel.com/geist/introduction | Design-system landing; only a one-line description, no principles text |
| Great Animations | Emil Kowalski | https://emilkowal.ski/ui/great-animations | Principles: natural, fast (<300ms, ease-out), purposeful, performant, interruptible, accessible |
| Good vs Great Animations | Emil Kowalski | https://emilkowal.ski/ui/good-vs-great-animations | transform-origin, easing choice, custom curves, springs, clip-path tabs |
| The Magic of Clip Path | Emil Kowalski | https://emilkowal.ski/ui/the-magic-of-clip-path | Technique post (supporting) |
| Linear Method — Principles & Practices | Linear | https://linear.app/method/introduction | Product principles (clarity, purpose-built, simple first) |
| Why is quality so rare? | Karri Saarinen | https://linear.app/now/why-is-quality-so-rare | Config 2025 keynote on craft, quality as strategy, "does this feel right?" |
| Karri Saarinen's 10 rules for crafting products | Karri Saarinen (Figma blog) | https://www.figma.com/blog/karri-saarinens-10-rules-for-crafting-products-that-stand-out/ | Spec is baseline, reduce scope, data as crutch |
| Designing Beautiful Shadows in CSS | Josh W. Comeau | https://www.joshwcomeau.com/css/designing-shadows/ | One light source, same offset ratio, layering, hue-matched shadows |
| An Interactive Guide to CSS Transitions | Josh W. Comeau | https://www.joshwcomeau.com/animation/css-transitions/ | ease-out enter / ease-in exit, transition-delay on hover, reduced motion |
| HIG — Layout / Typography / Accessibility / Color / Buttons | Apple | https://developer.apple.com/tutorials/data/design/human-interface-guidelines/{layout,typography,accessibility,color,buttons}.json (the site is JS-rendered; its data endpoint was fetched) | Current HIG foundations; 44×44 pt targets, 17/11 pt sizes, 4.5:1 |
| Touch target size (Material Design guidance) | Google Android Accessibility Help | https://support.google.com/accessibility/android/answer/7101858 | 48×48 dp, 8 dp apart, ~9 mm; m3.material.io itself is JS-only and would not render |
| Polaris principles (2017 archive) | Shopify | https://web.archive.org/web/20170715130844/https://polaris.shopify.com/principles/principles | Four principles incl. "polished but not ornamental"; live polaris.shopify.com/design now 301s to shopify.dev |
| Atlassian design principles | Atlassian (via principles.design mirror) | https://principles.design/examples/atlassian-design-principles | Five principles; atlassian.design itself returned an 82-byte block page |
| UI Density | Matthew Ström-Awn | https://matthewstrom.com/writing/ui-density/ | Visual / information / design / temporal / value density |
| Types of deceptive pattern | Harry Brignull (deceptive.design) | https://www.deceptive.design/types | 18 named deceptive-pattern types with definitions |
| Top 10 Application-Design Mistakes | Jakob Nielsen (NN/G) | https://www.nngroup.com/articles/top-10-application-design-mistakes/ | Unlabeled icons, tiny targets, modals, junk-drawer menus, destructive proximity |
| Flat Design: origins, problems, Flat 2.0 | Kate Moran (NN/G) | https://www.nngroup.com/articles/flat-design/ | Signifiers; "flat 2.0" compromise |
| Flat UI elements attract less attention | NN/G | https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ | Eyetracking: weak signifiers cost 22% more time |
| Glassmorphism: definition and best practices | Megan Brown (NN/G) | https://www.nngroup.com/articles/glassmorphism/ | Opacity/blur; contrast failures; "use sparingly" |
| End of Monoculture UI | Jakob Nielsen | https://jakobnielsenphd.substack.com/p/end-of-monoculture-ui | Sameness is good daily (Jakob's Law) but limiting |
| The future of UI will be boring | Scott Berkun | https://scottberkun.com/2010/the-future-of-ui-will-be-boring/ | "Confusing cool with useful"; dominant design |
| The dribbblisation of design | Paul Adams (Intercom) | https://www.intercom.com/blog/the-dribbblisation-of-design/ | Designing for peers vs problems; four layers |
| The Default Is Not a Design Decision | hipuku (pseudonymous) | https://www.hipuku.dev/writing/the-default-is-not-a-design-decision | SaaS sameness; inherited defaults; AI default house style |
| The Purple Gradient Problem | James Anderson (dev.to) | https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65 | Catalogue of "AI slop" tells (secondary, cites Gancarz, Wathan) |
| AI Design Slop | SmoothUI (Edu Calvo) | https://smoothui.dev/blog/ai-design-slop | Vendor post; anti-slop tells + build→critique→fix loop |
| UI Card Design | Stan Kirilov (StanVision) | https://www.stan.vision/journal/ui-card-design-examples-best-practices-and-common-patterns | Agency essay: "stop defaulting to cards"; 14px/100-char rules |
| Family Values | Benji Taylor | https://benji.org/family-values | Simplicity, fluidity, delight; delight-impact curve |
| Ryo Lu on soulful design (podcast notes) | Jackson Dahl / Ryo Lu | https://newsletter.dialectic.fm/p/cursors-ryo-lu-on-soulful-design | 14 takeaways; "AI is raw material, not finished goods" |
| Refactoring UI (site) | Adam Wathan & Steve Schoger | https://www.refactoringui.com/ | Chapter/tip headings only; the Medium "7 practical tips" post is behind Cloudflare (403), not fetched |
| Interface Design Checklist | Matt D. Smith (Shift Nudge) | https://shiftnudge.com/checklist | Email-gated; only section counts visible (Typography 13, Layout 14, Color 15, …) |

Not fetched / failed: `m3.material.io` pages (JS-only, reader and WebFetch both returned no body); `atlassian.design/resources/atlassian-design-principles` (blocked); Medium posts by Refactoring UI and Jason Fried (403); Rauno's "The Craft of UI" (no such page located on rauno.me — the phrase appears to belong to other authors' courses).

## Viewpoints

### interactions-feel-immediate-under-200ms
- **Claim:** "Animation duration should not be more than 200ms for interactions to feel immediate" (Rauno); "Your animations should also usually be shorter than 300ms" and "The best type of easing for this purpose is `ease-out`" (Emil).
- **Source:** Rauno Freiberg, Web Interface Guidelines, https://interfaces.rauno.me/ ; Emil Kowalski, Great Animations, https://emilkowal.ski/ui/great-animations
- **Prefers / forbids:** Prefers ≤200–300ms, ease-out for entering, custom cubic-bezier over built-ins ("The built-in easing curves in CSS are usually not strong enough"). Forbids slow interaction transitions; bounce/elastic on everyday controls (community tell, see anti-patterns).
- **Measurable?** Yes. Read computed `transition-duration` / `animation-duration` on elements that change on `:hover`, `:focus`, `[aria-expanded]`, `[data-state]`; flag any >300ms (warn >200ms). Must-fail: a button with `transition: background 600ms ease-in-out`. Must-pass twin: same button with `transition: background 150ms ease-out`. Easing is checkable too: `ease-in` on an entering element is a fail; `ease-out` passes.
- **Exceptions:** Emil: Sonner's toasts are "a bit slower than usual and uses `ease`" on purpose for tone; large page/scene transitions and decorative loops are outside the interaction budget. Comeau: exit animations "can be a bit more relaxed."

### frequent-actions-do-not-animate
- **Claim:** "Actions that are frequent and low in novelty should avoid extraneous animations: opening a right click menu, deleting or adding items from a list, hovering trivial buttons" (Rauno); "never animate keyboard initiated actions" (Emil).
- **Source:** Rauno, https://interfaces.rauno.me/ and https://rauno.me/craft/interaction-design ("Frequency & Novelty"); Emil, https://emilkowal.ski/ui/great-animations ("Raycast has no animations and it feels right").
- **Prefers / forbids:** Prefers instant appearance for context menus, command palettes, list add/remove, keyboard-driven navigation. Forbids opacity+scale fades on things used hundreds of times a day.
- **Measurable?** Partly. A browser can detect enter animations on `[role=menu]`, `[cmdk-root]`, list-item insertion (`animation-name` ≠ none on a newly inserted `li`) and keyboard-triggered state changes (dispatch a key, diff computed animation state within 16ms). Must-fail: a context menu with `animation: fadeIn 200ms`. Must-pass: `animation: none` on open; fade only on close. Which actions count as "frequent" is a judgement a journey file must supply.
- **Exceptions:** Rauno notes macOS context menus fade *out* and blink the chosen item; Benji Taylor's "delight-impact curve" says rare features may be theatrical. Emil: "consider how often the user will see it."

### motion-values-proportional-to-trigger
- **Claim:** "Animation values should be proportional to the trigger size: Don't animate dialog scale in from 0 → 1, fade opacity and scale from ~0.8. Don't scale buttons on press from 1 → 0.8, but ~0.96, ~0.9, or so."
- **Source:** Rauno Freiberg, https://interfaces.rauno.me/
- **Prefers / forbids:** Prefers scale from 0.8–0.97 with opacity; forbids scale-from-zero pops and heavy press squashes.
- **Measurable?** Yes. Parse `@keyframes` / WAAPI keyframes on dialogs, popovers, buttons; extract the start `scale()`. Must-fail: `@keyframes pop { from { transform: scale(0) } }` on a dialog. Must-pass twin: `from { transform: scale(0.95); opacity: 0 }`. Press: `:active { transform: scale(0.8) }` fails; `scale(0.97)` passes.
- **Exceptions:** Elements that genuinely originate from a point (a FAB expanding into a sheet) can grow from small; Emil's origin-aware rule then applies.

### animate-only-transform-and-opacity
- **Claim:** "you should try to animate with `transform` and `opacity` as they only trigger the third rendering step (composite)" (Emil); "NEVER: `transition: all`—list properties explicitly"; "NEVER: Animate layout props (`top`, `left`, `width`, `height`)" (Vercel).
- **Source:** Emil, https://emilkowal.ski/ui/great-animations ; Vercel AGENTS.md, https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/AGENTS.md
- **Prefers / forbids:** Prefers CSS > WAAPI > JS; `clip-path` for reveals (Emil). Forbids `transition: all`, animating `width/height/top/left/margin/padding`, large `blur()` filters in motion (Rauno: "Large `blur()` values for `filter` and `backdrop-filter` may be slow").
- **Measurable?** Yes. Scan stylesheets and computed `transition-property` for `all` and for layout properties; scan `@keyframes` for width/height/top/left. Must-fail: `.card { transition: all 200ms }` or `@keyframes grow { to { height: 300px } }`. Must-pass twin: `transition: transform 200ms, opacity 200ms` / `to { transform: scaleY(1) }`.
- **Exceptions:** Height animation of accordions when `grid-template-rows` or `interpolate-size` is used is layout by nature; Emil accepts the trade when it is the only honest way, but prefers `clip-path`.

### motion-has-an-origin
- **Claim:** "When we click on a button that opens a dropdown, we expect the dropdown to animate from where the button is… we want to change it to `bottom-center`" (Emil); "MUST: Correct `transform-origin` (motion starts where it 'physically' should)" (Vercel).
- **Source:** Emil, https://emilkowal.ski/ui/good-vs-great-animations ; Vercel AGENTS.md (URL above). Rauno's essay "Spatial Consistency" makes the same point about apps launching from their icon.
- **Prefers / forbids:** Prefers `transform-origin` set toward the trigger (Radix `--radix-popover-content-transform-origin`). Forbids popovers scaling from their own centre when anchored to a button.
- **Measurable?** Yes. For each open popover/menu whose trigger is known (`aria-controls` / `aria-haspopup`), compare the computed `transform-origin` with the side facing the trigger. Must-fail: menu below a button with `transform-origin: 50% 50%`. Must-pass twin: `transform-origin: top center` (or the Radix variable).
- **Exceptions:** Centred modals have no anchor; a centred origin is right there.

### honour-prefers-reduced-motion
- **Claim:** "our animations need to account for people who don't want animations" (Emil, with the `@media (prefers-reduced-motion: reduce)` snippet); "MUST: Honor `prefers-reduced-motion`" (Vercel); Comeau: "we have a certain responsibility to ensure that our products aren't causing harm."
- **Source:** https://emilkowal.ski/ui/great-animations ; Vercel AGENTS.md ; https://www.joshwcomeau.com/animation/css-transitions/
- **Prefers / forbids:** Prefers a reduced variant (fade instead of slide) rather than nothing; forbids large translate/scale motion that ignores the media query.
- **Measurable?** Yes. Emulate `prefers-reduced-motion: reduce`, then list elements whose computed `animation-name`/`transition-property` still include transform translations >~20px or durations >0. Must-fail: a hero that keeps `translateY(40px)` fly-in under the emulated query. Must-pass twin: same page with a `@media (prefers-reduced-motion: reduce)` block reducing it to opacity.
- **Exceptions:** Motion that is the content (a video, a chart drawing) is out of scope; Vercel adds that autoplaying motion over 5 s needs pause/stop/hide controls.

### animations-are-interruptible
- **Claim:** "Truly fluid gestures are immediately responsive… if you happen to mistap, then swiping back immediately does not interrupt the animation — you have to wait for it to end" (Rauno, as a defect); "Great animations are interruptible" (Emil); "MUST: Animations interruptible and input-driven" (Vercel).
- **Source:** https://rauno.me/craft/interaction-design ; https://emilkowal.ski/ui/great-animations ; Vercel AGENTS.md
- **Prefers / forbids:** Prefers CSS transitions (which can reverse mid-flight) or spring libraries; forbids `pointer-events: none` locks while an animation plays, and `@keyframes`-driven open/close that must finish before the next input.
- **Measurable?** Partly. Open a panel, immediately send the close input, sample the element's bounding box ~50 ms later: if it is still growing, the animation was not interruptible. Must-fail: a drawer using `animation: slideIn 400ms` with `animation-fill-mode: forwards` and a JS `isAnimating` guard. Must-pass twin: `transition: transform 250ms` toggled by class. The fixture is scriptable but the assertion depends on timing tolerance.
- **Exceptions:** Destructive commits (Rauno's App Switcher dismiss) intentionally fire only on gesture end; that is about triggering, not about interruptibility.

### hit-targets-meet-platform-minimums
- **Claim:** "a button needs a hit region of at least 44x44 pt" (Apple); "Consider making touch targets at least 48x48dp, separated by 8dp of space or more" (Material); "MUST: Hit target ≥24px (mobile ≥44px); if visual <24px, expand hit area" (Vercel). Rauno: "Fitts's Law states that the time to click on something depends on distance and size."
- **Source:** Apple HIG Buttons & Accessibility (JSON endpoints above; accessibility table: iOS default 44×44 pt, minimum 28×28 pt; macOS 28/20); Google, https://support.google.com/accessibility/android/answer/7101858 ; Vercel AGENTS.md ; https://rauno.me/craft/interaction-design
- **Prefers / forbids:** Prefers padding-expanded hit areas (the icon can stay 24px); forbids interactive elements whose clickable box is under 24×24 CSS px on desktop or 44×44 on touch, and adjacent targets with <8px gap.
- **Measurable?** Yes. For every focusable/`role=button|link|checkbox` element, take `getBoundingClientRect()` (plus pseudo-element extension) at the mobile viewport; fail if width or height <44, and on desktop <24. Must-fail: a 16×16 icon button with no padding. Must-pass twin: same icon with `padding: 14px`. Gap check: two 44px buttons 4px apart fail; 8px apart pass.
- **Exceptions:** Inline text links inside paragraphs (WCAG and Vercel both exempt); dense data grids where the row is the target.

### no-dead-zones-and-honest-clickability
- **Claim:** "Interactive elements in a vertical or horizontal list should have no dead areas between each element, instead, increase their `padding`" (Rauno); "MUST: If it looks clickable, it must be clickable" and "label+control share one hit target" (Vercel); NN/G: weak signifiers cost "22% more time."
- **Source:** https://interfaces.rauno.me/ ; Vercel AGENTS.md ; https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/
- **Prefers / forbids:** Prefers list items whose padding fills the row; `<label for>` wrapping inputs; buttons with "a discernible background shape and fill" (Apple, Buttons). Forbids gaps between menu items, decorative gradients that intercept pointer events (Rauno: "Decorative elements (glows, gradients) should disable `pointer-events`"), `<div onClick>` for navigation.
- **Measurable?** Yes for the mechanics: adjacent `[role=menuitem]`/`li>a` rects with vertical gaps >0 fail; inputs with no associated label fail; absolutely-positioned decorative layers with `pointer-events: auto` over interactive content fail; `div`/`span` with click handlers and no role fail. Must-fail: a nav list with `margin-bottom: 6px` between anchors. Must-pass twin: `margin: 0; padding: 8px 12px`. "Looks clickable" itself stays a judgement.
- **Exceptions:** Intentional separators between groups.

### readable-type-sizes-and-weights
- **Claim:** Apple's table: "iOS, iPadOS 17 pt [default] 11 pt [minimum]… macOS 13 pt 10 pt"; "avoid Ultralight, Thin, and Light font weights"; Rauno: "Font weights below 400 should not be used"; "Medium sized headings generally look best with a font weight between 500-600"; "Font weight should not change on hover or selected state to prevent layout shift".
- **Source:** Apple HIG Typography & Accessibility (JSON); https://interfaces.rauno.me/
- **Prefers / forbids:** Prefers ≥17px body on touch, 13px minimum on desktop UI, weights 400–700; forbids body text <11pt, `font-weight: 300` or lower, weight swaps on hover; Apple: "Minimize the number of typefaces you use."
- **Measurable?** Yes. Computed `font-size` and `font-weight` of every text node; count distinct `font-family` stacks. Must-fail: `p { font-size: 11px; font-weight: 300 }` at a phone viewport; `a:hover { font-weight: 600 }`. Must-pass twin: `16px/400`, hover changes colour only. Distinct families >2 → warn.
- **Exceptions:** Captions and legal text may sit at the platform minimum; display headings may use light weights at large sizes (Apple: "aim for larger than the recommended sizes" if thin).

### mobile-inputs-do-not-zoom-or-trap
- **Claim:** "Font size for inputs should not be smaller than 16px to prevent iOS zooming on focus"; "Inputs should not auto focus on touch devices" (Rauno); "NEVER: Disable browser zoom (`user-scalable=no`, `maximum-scale=1`)"; "NEVER: Block paste" (Vercel).
- **Source:** https://interfaces.rauno.me/ ; Vercel AGENTS.md
- **Prefers / forbids:** Prefers `type`, `inputmode`, `autocomplete` set; `touch-action: manipulation` on controls; forbids `<meta viewport … user-scalable=no>`, `onpaste="return false"`, `autofocus` at phone widths. (Rauno and Vercel disagree on `maximum-scale=1`: Rauno's older note allows it as an iOS zoom workaround, Vercel's AGENTS.md forbids it.)
- **Measurable?** Yes. Computed `font-size` of `input, select, textarea` at 390px viewport <16px fails; viewport meta containing `user-scalable=no` fails; paste handlers that `preventDefault` fail; `[autofocus]` present at phone width fails. Must-fail / must-pass twins are the same input at 14px vs 16px.
- **Exceptions:** Desktop-only admin tools; Vercel allows autofocus "on desktop with single primary input."

### contrast-and-not-colour-alone
- **Claim:** Apple: "Up to 17 pts All 4.5:1; 18 pts All 3:1; All Bold 3:1"; "Convey information with more than color alone"; Vercel: "MUST: Meet contrast—prefer APCA over WCAG 2" and "MUST: Increase contrast on `:hover`/`:active`/`:focus`"; NN/G on glass: "text and graphical elements meet contrast requirements."
- **Source:** Apple HIG Accessibility & Color (JSON); Vercel AGENTS.md; https://www.nngroup.com/articles/glassmorphism/
- **Prefers / forbids:** Prefers semantic colour ("Avoid using the same color to mean different things" — Apple), status text + icon alongside colour, light and dark variants for every custom colour. Forbids grey-on-colour text (Refactoring UI heading "Don't use grey text on colored backgrounds"), colour-only status dots, hover states that *lower* contrast.
- **Measurable?** Yes. Sample foreground/background of each text node (composite translucent layers), compute WCAG ratio (and APCA Lc); fail <4.5:1 (<3:1 for ≥18pt/bold). Status: elements with `color` in a red/green/amber band and no text/icon sibling → warn. Hover: contrast after `:hover` lower than before → fail. Must-fail: `#999` on `#fff` body text (2.8:1). Must-pass twin: `#595959` (7:1).
- **Exceptions:** Disabled controls; decorative text; logos.

### focus-is-visible-and-unobscured
- **Claim:** "MUST: Visible, unobscured focus rings (`:focus-visible`…); sticky/fixed elements never cover focus"; "NEVER: `outline: none` without visible focus replacement" (Vercel); "Box shadow should be used for focus rings, not outline which won't respect radius" (Rauno).
- **Source:** Vercel AGENTS.md; https://interfaces.rauno.me/
- **Prefers / forbids:** Prefers `:focus-visible` styling with box-shadow or `outline` + `outline-offset` (Rauno's Safari note is dated; he flags 16.4 fixed radius); forbids `outline: none`/`0` with no replacement, focus rings hidden under sticky headers.
- **Measurable?** Yes. Tab through every focusable element; screenshot-diff focused vs unfocused rect (or read computed `outline`/`box-shadow` under `:focus-visible`); check the focused element's rect is not intersected by `position: fixed|sticky` elements with higher stacking. Must-fail: `button:focus { outline: none }`. Must-pass twin: `button:focus-visible { box-shadow: 0 0 0 2px var(--ring) }`.
- **Exceptions:** None stated; `:focus` (not `-visible`) rings on pointer click are allowed but discouraged.

### feedback-is-local-and-optimistic
- **Claim:** "Optimistically update data locally and roll back on server error with feedback"; "Display feedback relative to its trigger: Show a temporary inline checkmark on a successful copy, not a notification; Highlight the relevant input(s) on form error(s)" (Rauno); "Buttons should be disabled after submission to avoid duplicate network requests"; Vercel: "Loading buttons show spinner and keep original label", "Errors inline next to fields; on submit, focus first error", "Confirm destructive actions or provide Undo window".
- **Source:** https://interfaces.rauno.me/ ; Vercel AGENTS.md; NN/G "Poor Feedback" and "Proximity of Destructive and Confirmation Actions", https://www.nngroup.com/articles/top-10-application-design-mistakes/
- **Prefers / forbids:** Prefers inline ✓, `aria-invalid` on the failing field, `aria-live="polite"` for async results, Undo over confirm dialogs, spinners that keep the label. Forbids toast-for-everything, "Something went wrong" with no cause (NN/G), Save next to Discard at equal weight, buttons whose label vanishes into a spinner.
- **Measurable?** Partly. After submitting an invalid form: exists `[aria-invalid=true]` and `document.activeElement` is the first invalid field → pass; only a toast appeared → fail. After clicking submit: button `disabled` or `aria-busy` within one frame and `textContent` unchanged → pass. Copy action: a checkmark inside the trigger's subtree → pass; a toast → warn. Destructive/confirm proximity: two buttons with destructive and primary intent (by label lexicon) adjacent and same size → warn. The optimistic-vs-pessimistic choice itself is judgement.
- **Exceptions:** Actions whose success is not "likely" (payments) should wait for the server (Vercel: "when success is likely").

### every-state-is-designed
- **Claim:** "MUST: Design empty/sparse/dense/error states"; "Skeletons mirror final content to avoid layout shift"; "Resilient to user-generated content (short/avg/very long)"; "No dead ends; always offer next step/recovery" (Vercel); Rauno: "Empty states should prompt to create a new item, with optional templates."
- **Source:** Vercel AGENTS.md; https://interfaces.rauno.me/
- **Prefers / forbids:** Prefers an empty state with a primary action, skeletons sized like real rows, `min-w-0` + truncation on flex children. Forbids blank screens on empty arrays, spinners that reflow content, overflow from long strings.
- **Measurable?** Partly. Fixtures: render with `[]`, with 1 item, with 500 items, with a 300-character title; assert no horizontal overflow, no element overlap, an actionable control present in the empty state, and CLS between skeleton and loaded layout under a threshold. Must-fail: list component that renders nothing for `[]`. Must-pass twin: renders a heading + "Create…" button. Whether the empty copy is *good* stays taste.
- **Exceptions:** None stated; Vercel's skeleton timing rule (show-delay 150–300 ms, min visible 300–500 ms) is a refinement, not an exception.

### numbers-and-text-do-not-shift-layout
- **Claim:** "tabular figures should be applied with `font-variant-numeric: tabular-nums`, particularly in tables or when layout shifts are undesirable, like in timers"; "Font weight should not change on hover or selected state to prevent layout shift" (Rauno); Vercel: "MUST: `font-variant-numeric: tabular-nums` for number comparisons", "MUST: Prevent CLS (explicit image dimensions)".
- **Source:** https://interfaces.rauno.me/ ; Vercel AGENTS.md
- **Prefers / forbids:** Prefers tabular nums in tables, timers, prices; `width`/`height` on `<img>`; forbids proportional digits in columns, images without dimensions, hover weight changes.
- **Measurable?** Yes. Columns of numeric cells (`td` with numeric text) whose computed `font-variant-numeric` lacks `tabular-nums` → fail; `<img>` without width/height attributes or aspect-ratio → fail; run a counter fixture and measure sibling rect drift. Must-fail: `<td>1,234.56</td>` under default numerals. Must-pass twin: same with `tabular-nums`.
- **Exceptions:** Prose numbers.

### shadows-share-one-light-source
- **Claim:** "every shadow on the page should share the same ratio"; "As an element gets closer to the user, the offset should increase, the blur radius should increase, and the shadow's opacity should decrease"; use layering and "matching the hue and lowering the saturation/lightness" (Comeau). Vercel: "SHOULD: Layered shadows (ambient + direct)", "Hue consistency: tint borders/shadows/text toward bg hue". Refactoring UI headings: "Emulate a light source", "Shadows can have two parts".
- **Source:** https://www.joshwcomeau.com/css/designing-shadows/ ; Vercel AGENTS.md; https://www.refactoringui.com/
- **Prefers / forbids:** Prefers a tokenised elevation scale (Comeau's `ELEVATIONS.small/medium/large`), 2–5 layered shadows, hue-matched colour. Forbids "fuzzy grey boxes", shadows with inconsistent x:y ratios across the page, pure-black high-alpha shadows, "blurry borders" used as separators.
- **Measurable?** Yes. Collect every computed `box-shadow`; compute x/y offset direction per layer; fail if the page mixes signs (light from above-left on one card, below-right on another) or if distinct shadow strings exceed a small count (e.g. >6) — a tokenised scale keeps it low. Colour: shadow hue far from background hue and alpha >0.5 → warn. Must-fail: cards with `0 -4px 8px` and `4px 4px 8px` on the same page. Must-pass twin: all shadows `x:y = 1:2`.
- **Exceptions:** Inset shadows for sunken fields; glows meant as glows.

### fewer-borders-more-space
- **Claim:** Refactoring UI's tip heading "Use fewer borders"; Apple: "Group related items… use negative space, container shapes, or separator lines"; Ström: "some whitespace has meaning almost as salient as the darker pixels of graphic elements."
- **Source:** https://www.refactoringui.com/ (heading; the tip text on Medium was not reachable — see reliability); Apple HIG Layout (JSON); https://matthewstrom.com/writing/ui-density/
- **Prefers / forbids:** Prefers whitespace, background-shade contrast, or a single shadow to separate groups; forbids nested outlined boxes (community "nested cards inside cards" tell), borders on every side of every row.
- **Measurable?** Partly. Count nesting depth of elements with a visible `border` or `box-shadow` outline containing further bordered elements; depth ≥3 → warn (the owner's own "boxed nesting" count is this metric). Count bordered siblings that are also separated by `gap` ≥16px — redundant. Must-fail: `section > .card > .card > .card` all with `1px solid`. Must-pass twin: outer section border only, inner groups separated by 24px `gap`. Whether a given border is *needed* is taste.
- **Exceptions:** Data tables; form field outlines (those are signifiers, see flat-2.0).

### spacing-comes-from-a-scale
- **Claim:** Material: "touch targets at least 48x48dp, separated by 8dp of space or more"; StanVision: "Material Design specifies margins and gutters of 8, 16, 24, or 40dp on an 8dp grid… Pick your numbers, document them, and don't deviate. Inconsistent spacing is the fastest way to make a polished product feel amateur." Refactoring UI heading: "Establish a spacing and sizing system"; Vercel: "Deliberate alignment to grid/baseline/edges—no accidental placement."
- **Source:** https://support.google.com/accessibility/android/answer/7101858 ; https://www.stan.vision/journal/ui-card-design-examples-best-practices-and-common-patterns ; https://www.refactoringui.com/ ; Vercel AGENTS.md
- **Prefers / forbids:** Prefers a 4/8-based scale expressed as tokens; forbids ad-hoc values (13px, 22px, 37px) and edges that almost align.
- **Measurable?** Yes. Collect computed `margin`, `padding`, `gap` values; count distinct values and the share not on a 4px multiple; fail if off-scale share >10% or distinct values >12. Alignment: cluster left edges of siblings; edges within 1–3px of each other but not equal → warn ("almost aligned"). Must-fail: paddings of 13/17/22px. Must-pass twin: 12/16/24px.
- **Exceptions:** Vercel's "optical alignment: adjust ±1px when perception beats geometry" — a 1px deviation is allowed by intent, which is why the check warns rather than fails at ±1.

### radii-are-few-and-concentric
- **Claim:** Vercel: "SHOULD: Nested radii: child ≤ parent; concentric"; community tell: "The same corner radius on absolutely everything" (dev.to catalogue).
- **Source:** Vercel AGENTS.md; https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65
- **Prefers / forbids:** Prefers inner radius = outer radius − padding; a short radius scale (2–4 values). Forbids child radius larger than parent, one radius applied to pills, cards, modals and avatars alike.
- **Measurable?** Yes. Count distinct computed `border-radius` values (>6 → warn); for nested rounded boxes compare child radius with parent radius − parent padding (child larger → fail). Must-fail: `.card{border-radius:8px;padding:4px} .card img{border-radius:16px}`. Must-pass twin: img radius 4px.
- **Exceptions:** Fully round elements (`9999px`, avatars) are exempt from the concentric arithmetic.

### density-is-value-per-time-and-space
- **Claim:** "UI density is the value a user gets from the interface divided by the time and space the interface occupies." Timing: "Actions less than 100 milliseconds apart will feel simultaneous… For the smallest temporal spaces, animations and transitions can make the app feel slower"; 100 ms–1 s: bridge with motion; 1–10 s: indeterminate indicator; 10 s–1 min: determinate progress; >1 min: let them leave and notify.
- **Source:** Matthew Ström-Awn, https://matthewstrom.com/writing/ui-density/ ; NN/G gives 2–10 s spinner / >10 s progress bar in https://www.nngroup.com/articles/top-10-application-design-mistakes/
- **Prefers / forbids:** Prefers Gestalt grouping over more separators, fast loads over more pixels, chunked forms when they raise completion. Forbids equating whitespace with quality ("Interfaces are becoming less dense") and equating clutter with density.
- **Measurable?** Partly. Temporal part is measurable: time from click to first visible change (>100 ms with no feedback → fail; >1 s with no indicator → fail; >10 s with only a spinner → warn). Spatial part: ratio of text/actionable pixels to viewport at a given breakpoint can be computed but the *value* numerator cannot. Must-fail: a fetch of 3 s with no indicator. Must-pass twin: `aria-busy` skeleton at 150 ms.
- **Exceptions:** Ström: audience sets the ceiling ("A bond trader… will have a pretty high threshold; a 2nd grader… a low one").

### signifiers-survive-flatness
- **Claim:** NN/G: "Flat interfaces often use weak signifiers… participants spent 22% more time… looking at the pages with weak signifiers"; Moran: "Flat 2.0 provides an opportunity for compromise — visual simplicity without sacrificing signifiers"; Apple: "Prefer buttons that have a discernible background shape and fill."
- **Source:** https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/ ; https://www.nngroup.com/articles/flat-design/ ; Apple HIG Buttons (JSON)
- **Prefers / forbids:** Prefers buttons with fill or border, links underlined or distinctly coloured, inputs with visible boundary. Forbids text-only "buttons" indistinguishable from labels, links styled as body text, "long shadows" and other purely aesthetic depth.
- **Measurable?** Partly. For each `button`/`[role=button]`: computed background differs from parent OR border width >0 OR text colour is the accent → pass, else fail. For `a` inside text: `text-decoration` none AND colour Δ from surrounding text below a threshold → fail. Must-fail: `<button style="background:none;border:0;color:inherit">Save</button>`. Must-pass twin: filled button. Whether an unusual signifier still reads is taste.
- **Exceptions:** Toolbar icon buttons with tooltips and hover fills; navigation bars recognised by position (Moran's Apple 2015 example).

### cards-are-a-choice-not-a-default
- **Claim:** "cards are overused. They've become the default layout choice for everything… not because they're the best solution, but because they're the safest… Cards for browsing. Lists for searching. Tables for comparing." Also "if you need to shrink text below 14px to fit content, your card has too much information", "Under 100 characters for the summary text", "One primary action per card".
- **Source:** Stan Kirilov, https://www.stan.vision/journal/ui-card-design-examples-best-practices-and-common-patterns (agency essay citing NN/G and Material); NN/G "Overuse of Modals"/"Hard-to-Acquire Targets" in the Top 10 article for the adjacent points.
- **Prefers / forbids:** Prefers lists for ranked/homogeneous data, tables for comparison, consistent card heights, the title as the link with a pseudo-element extending the hit area. Forbids card grids for search results and settings, whole-card `<a>` wrappers ("announce all card content as one continuous, unstructured string"), jagged heights, >3 clickable elements per card, nested cards.
- **Measurable?** Partly. Detect card grids (≥3 siblings with equal border/shadow/radius); fail if text inside is <14px, if >3 interactive descendants per card, if row heights differ >20% (non-masonry), if an `<a>` wraps >1 heading+paragraph. "Would a list be better" is judgement. Must-fail: six identical 280px cards with 12px body text and a wrapping anchor. Must-pass twin: same data as a `<table>` or a card with 14px text and a title link.
- **Exceptions:** Masonry where variable height "is the design choice, not an accident"; media browsing (Netflix, Pinterest).

### no-junk-drawer-menus-or-unlabeled-icons
- **Claim:** NN/G: an overflow menu labelled "More… or Tools, or worst of all …" has "low information scent and [is] nothing more than a junk drawer"; "It's really rare for icons to stand on their own… most icons, unless they have a text label next to them, will be difficult or impossible for users to understand"; Vercel: "Icons have labels", "Icon-only buttons have descriptive `aria-label`"; Rauno: "Disabled buttons should not have tooltips, they are not accessible".
- **Source:** https://www.nngroup.com/articles/top-10-application-design-mistakes/ ; Vercel AGENTS.md; https://interfaces.rauno.me/
- **Prefers / forbids:** Prefers labelled icons, menus named for their contents, inline help before tooltips ("tooltips as a last resort" — Vercel). Forbids `…`/"More"/"Tools" catch-alls holding primary features, icon-only toolbars without labels, tooltips on disabled buttons.
- **Measurable?** Partly. Icon-only buttons (`svg` only, no text, no `aria-label`) → fail. Menus whose trigger text is "More", "…", "Tools", "Options" and which contain >5 items or any item matching a primary-action lexicon → warn. `button[disabled][title]` or `[aria-describedby]` on disabled → fail. Must-fail: `<button><svg/></button>`. Must-pass twin: `<button aria-label="Delete"><svg/></button>` (better: visible text).
- **Exceptions:** Universally recognised icons in tight toolbars (NN/G still warns even the hamburger is weaker than designers think).

### glass-and-blur-earn-their-place
- **Claim:** NN/G: "glassmorphism is best when utilized sparingly to create an illusion of depth"; "More background blur is better, especially with intricate backgrounds"; "give users the option to control contrast or transparency settings"; Rauno: "Large `blur()` values for `filter` and `backdrop-filter` may be slow". Apple's current HIG uses translucent Liquid Glass for *controls* over content, and says custom colours must still work "in light, dark, and increased contrast contexts".
- **Source:** https://www.nngroup.com/articles/glassmorphism/ ; https://interfaces.rauno.me/ ; Apple HIG Layout & Color (JSON)
- **Prefers / forbids:** Prefers translucency for chrome (toolbars, menus) over busy backgrounds with heavy blur and a contrast fallback; forbids glass cards for body content, low blur over photos, text whose contrast depends on what scrolls beneath it, and glass as decoration ("Glassmorphism with a neon glow" is a listed AI tell).
- **Measurable?** Yes. Count elements with `backdrop-filter`; for each, sample contrast of contained text against the composited background at three scroll positions — any sample <4.5:1 → fail; blur radius <12px over an image → warn; `backdrop-filter` on elements that contain body text (>2 lines) → warn. Must-fail: a `.card { backdrop-filter: blur(4px); background: rgba(255,255,255,.2) }` over a photo hero. Must-pass twin: `blur(24px)` + `rgba(255,255,255,.75)` on a toolbar, or a solid fallback under `prefers-contrast: more`.
- **Exceptions:** OS-level materials that honour the user's Reduce Transparency setting (NN/G cites Apple's).

### no-deceptive-patterns
- **Claim:** Brignull's types, e.g. **Preselection**: "The user is presented with a default option that has already been selected for them, in order to influence their decision-making"; **Confirmshaming**: "emotionally manipulated into doing something that they would not otherwise have done"; **Fake urgency**, **Hard to cancel**, **Visual interference**, **Trick wording**, **Nagging**, **Hidden costs**, **Sneaking** (18 types total on the page).
- **Source:** Harry Brignull, https://www.deceptive.design/types
- **Prefers / forbids:** Prefers opt-in unchecked by default, symmetric accept/decline buttons, cancel as easy as subscribe, countdowns that are real. Forbids pre-ticked marketing/upsell boxes, "No thanks, I don't want to save money" decline links, timers that reset, decline buttons styled to vanish.
- **Measurable?** Partly. `input[type=checkbox][checked]` whose label matches a marketing/upsell lexicon → fail. Two choice buttons in a dialog where the decline has contrast <3:1 or is <60% the size of accept → warn (visual interference). Countdown that restarts on reload → fail (fake urgency). Confirmshaming copy is lexical ("No thanks, I…") and only warnable. Must-fail: `<input type=checkbox checked> Send me offers`. Must-pass twin: unchecked.
- **Exceptions:** Defaults that serve the user (NN/G "No Default Values" is a *mistake*) — the test is who benefits, which needs a journey's actor to decide.

### quality-is-a-choice-spec-is-the-floor
- **Claim:** "We replaced purpose with metrics… Even we, as designers, stopped asking; 'Does this feel right?'"; "Technology makes it faster to build, but harder to care."; "For quality, you need a team that views the spec as the baseline, not the finish line."; "The simplest way to increase quality is to reduce scope."; "Zero bugs policy: Issues are fixed within 7 days."
- **Source:** Karri Saarinen, https://linear.app/now/why-is-quality-so-rare and https://www.figma.com/blog/karri-saarinens-10-rules-for-crafting-products-that-stand-out/ ; Linear Method, https://linear.app/method/introduction ("Aim for clarity… Projects should be called projects", "Simple first, then powerful").
- **Prefers / forbids:** Prefers small teams with taste, no handoff, MVPs internal-only, plain vocabulary. Forbids shipping to spec and calling it done, invented terms, A/B tests standing in for judgement ("Data can be a crutch").
- **Measurable?** No. This is the stance that makes the other entries matter: exit 0 is a floor. What a machine can hold is the vocabulary rule — flag UI strings that rename standard objects (a "Workstream" that is a project) against a glossary — but that is the journey's glossary, not the source's.
- **Exceptions:** Saarinen: "Quality is not perfection… It's fine to start with something rough and iterate" — behind a quality bar, with beta users.

### delight-scales-with-rarity
- **Claim:** "You could think of this as a 'Delight-Impact Curve', where the potential for delight increases as the frequency of feature usage decreases"; "Placing equal value on every part of the app is important… like going to a fancy restaurant but finding it has a dirty bathroom"; "If a component occupies a space and will persist in the next phase of the user's journey, it should remain consistent" (no redundant duplicate-during-animation).
- **Source:** Benji Taylor, https://benji.org/family-values (credits Rauno's frequency/novelty and Paco Coursey's quip)
- **Prefers / forbids:** Prefers directional tab motion ("We fly instead of teleport"), morphing labels (Continue → Confirm), one action per tray, trays of differing heights so change is visible. Forbids static jumps on core flows, theatrical motion on daily actions, an element visibly duplicating itself mid-transition.
- **Measurable?** Partly. Shared-element continuity: after a transition, count DOM nodes with the same key/text existing twice on screen at once → fail. Frequency-weighted motion needs the journey to say what is frequent. Must-fail: a list transition that clones the row for the animation and leaves both visible for a frame. Must-pass twin: the original node moves.
- **Exceptions:** Taylor: table-stakes "utility, performance, security" come first; delight is "selective emphasis".

### boring-and-familiar-beats-novel
- **Claim:** Berkun: "The rookie trap designers and technologists fall for is confusing cool with useful"; "Lack of upgrade is not a sign of failure." Nielsen: "users form their expectations from the majority of UI they encounter in other people's design, not from your design"; "on a daily basis, it's good that all UI is roughly the same." Rauno: "Great interaction design rewards learning by reusing metaphors."
- **Source:** https://scottberkun.com/2010/the-future-of-ui-will-be-boring/ ; https://jakobnielsenphd.substack.com/p/end-of-monoculture-ui ; https://rauno.me/craft/interaction-design
- **Prefers / forbids:** Prefers native semantics and known gestures (tap, swipe, pinch), `<a>` for links, standard menus. Forbids novel gestures without a tap/keyboard alternative (Vercel: "Gestures have alternatives"), custom scroll hijacking, reinvented selects.
- **Measurable?** Partly. Custom widgets without ARIA patterns (`div` acting as select/menu with no `role`/keyboard handling) → fail; `overscroll`/wheel hijack listeners with `preventDefault` on `document` → warn; drag-only affordances with no button alternative → fail. Must-fail: a `<div class="dropdown">` with click-only open. Must-pass twin: `<select>` or an APG-conformant listbox. Whether a novel pattern is *worth* it is judgement.
- **Exceptions:** Nielsen wants richer, larger-screen GUIs eventually; hipuku's essay praises Arc and Panic for deliberate departures "with a point of view that was in place before the first component went down."

### defaults-are-decisions-you-inherited
- **Claim:** "The default was always a design decision. Someone made it upstream, and everyone who builds on top inherits it without asking why." "AI doesn't produce bad UI. It produces the statistical average of every interface it was trained on." Ryo Lu: "AI is raw material, not finished goods. The purple gradient the AI tools give you is just the beginning." Polaris: "Every aesthetic design decision… should be purposeful."
- **Source:** https://www.hipuku.dev/writing/the-default-is-not-a-design-decision ; https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65 ; https://newsletter.dialectic.fm/p/cursors-ryo-lu-on-soulful-design ; Polaris archive URL above
- **Prefers / forbids:** Prefers a written token set (`DESIGN.md`), one committed aesthetic direction, semantic colour. Forbids untouched library defaults ("Default shadcn-gray and Tailwind-blue, untouched"), "clean and modern" as a brief, the tells listed under *What this school is against*.
- **Measurable?** Partly — the tells are countable even though "has a point of view" is not: gradients whose stops include a purple/indigo hue (H≈250–290) and a blue/cyan hue → warn; `font-family` resolving to Inter/Roboto with no other display face → note; ≥3 sibling cards with identical structure (icon + h3 + p) → note; `backdrop-filter` + glow shadows → note; gradient text (`background-clip: text`) on a numeral → warn; `cubic-bezier` with overshoot (y >1) on hover → warn. Score the constellation, not any single tell. Must-fail: hero with `linear-gradient(135deg,#7c3aed,#06b6d4)`, Inter, three glass cards, bounce hover. Must-pass twin: same layout with a single brand hue, no glass, ease-out hover.
- **Exceptions:** A purple brand is allowed to be purple; the tell is the *constellation* and the absence of a decision, not any one colour.

## What this school is against

- **The AI-UI constellation** — "The purple → blue (or purple → cyan) gradient… Inter or Roboto, every time… A centered hero with one CTA, floating in space… A row of three (or six) identical rounded cards… Glassmorphism with a neon glow… Gradient text slapped on a big number… A bounce or elastic easing on every hover… Nested cards inside cards… The same corner radius on absolutely everything… Default shadcn-gray and Tailwind-blue, untouched." (dev.to catalogue, https://dev.to/james_anderson_h/…; same list in SmoothUI, https://smoothui.dev/blog/ai-design-slop). Warm-cream ground + serif headline with one italic accent word + small monospace labels + numbered cards is the *other* AI house style hipuku traces (https://www.hipuku.dev/writing/the-default-is-not-a-design-decision).
- **"Clean and modern" as a brief** — "the slop default in a trench coat" (dev.to). Not a direction.
- **SaaS sameness** — "The card layout, the left sidebar, the empty-state illustration, the pricing toggle, the sans-serif at 16px on a 1.6 line-height in a grey that's almost but not quite black" (hipuku).
- **Dribbblisation** — "Things that look great but don't work well… many people calling themselves product/UX designers are actually practicing digital art" (Paul Adams, https://www.intercom.com/blog/the-dribbblisation-of-design/).
- **Fully flat, signifier-less UI** — weak signifiers cost 22% more time; "long shadows are one example of flat 2.0 gone wrong" (NN/G, both articles).
- **Glass over content** — low-blur translucency over photos that "reduces text contrast and makes this prototype's background overly distracting" (NN/G glassmorphism).
- **Cards by default** — "cards are overused… because they're the safest"; card grids for search results and settings (StanVision).
- **Junk-drawer menus, unlabeled icons, modal overuse, Save-next-to-Discard, "Something went wrong"** (NN/G Top 10).
- **Deceptive patterns** — the 18 Brignull types, especially preselection, confirmshaming, fake urgency/scarcity, hard-to-cancel, visual interference (deceptive.design).
- **Motion sins** — `transition: all`, animating layout properties, scale-from-zero, 500 ms enter on a command palette, bounce on hover, motion ignoring reduced-motion, non-interruptible open/close (Rauno, Emil, Vercel).
- **Touch sins** — hover states flashing on touch, inputs under 16px, autofocus on phones, disabled zoom, blocked paste (Rauno, Vercel).
- **Typography sins** — weights under 400, more than a couple of typefaces, weight changes on hover, proportional digits in tables (Rauno, Apple).
- **Ornament without purpose** — "polished but not ornamental" (Polaris); "Beauty in form and composition is not enough" (Rauno); "confusing cool with useful" (Berkun).
- **Metrics in place of judgement** — "Does it convert?" replacing "Does this feel right?"; A/B tests as a crutch (Saarinen).
- **Shipping to spec** — "It's easy to meet the spec. It's harder to do the craft." (Saarinen).

## Notes on reliability

- **Author's stated position, primary source fetched:** Rauno (both pages), Emil (three pages), Saarinen (Linear post + Figma interview in his words), Comeau (two pages), Ström, Brignull's type definitions, NN/G articles (Nielsen, Moran, Brown), Berkun, Paul Adams, Benji Taylor, hipuku, Apple HIG (via its JSON data endpoint — same text the rendered page shows), Google's Material touch-target guidance (support.google.com page, which cites material.io).
- **Vercel Web Interface Guidelines** is a Vercel Labs repo, not a signed essay; treat rules as the org's position. It overlaps heavily with Rauno's list and cites Emil/John Phamous tweets for tooltip timing, optical alignment and prediction cones — those tweets were not fetched.
- **Vercel Geist** has no published principles text on its introduction page; nothing here is attributed to Geist beyond "Vercel's design system for building consistent web experiences."
- **Material Design 3 numbers** (48 dp, 8 dp gap, ~9 mm) are quoted from Google's Android accessibility help page, which links to material.io; the m3.material.io pages themselves did not render through any fetcher used here. Treat "M3 says" as "Google's Material accessibility guidance says."
- **Polaris principles** are from a 2017 Wayback capture; the current Polaris site has been folded into shopify.dev and the principles page no longer exists at that path. The wording may have changed since.
- **Atlassian principles** came through principles.design's mirror because atlassian.design blocked the fetch; the five titles are likely accurate but the descriptions are the mirror's excerpts — mark as secondary.
- **Refactoring UI** — only the chapter/tip headings from refactoringui.com were fetched ("Use fewer borders", "Emulate a light source", etc.); the explanatory text in the Medium excerpt is behind a 403. Claims attributed to it here are headings, not sentences.
- **Shift Nudge checklist** — exists, is a real designer's (Matt D. Smith) published checklist, but is email-gated; only section names and item counts were visible. Not quoted.
- **"AI UI look" catalogue** — the dev.to and SmoothUI posts are community/vendor writing (SmoothUI sells the "UI Craft" skill). The tells are consistent across both and with hipuku's essay and Ryo Lu's "purple gradient" remark, so treat the *list* as well-attested folklore; the Adam Wathan `bg-indigo-500` apology is reported second-hand (his post was not fetched).
- **StanVision cards essay** is an agency post with its own conversion anecdotes; its concrete rules (14px floor, 100 chars, one action) are the agency's, and it attributes "single, contained unit" to Material and the whole-card-link failure to UC Berkeley's guide (neither fetched directly).
- **Ryo Lu** — the 14 points are the podcast host's summary of Ryo's positions, not Ryo's written words; quote them as "per Dialectic's notes."
- **Named-designer "before shipping" checklists** (Jordan Singer, Mariana Castilho, Paco Coursey): no published checklist was found in this session; Paco is cited only via Rauno's acknowledgments and Taylor's quip. Benji Taylor's three principles and Ryo Lu's list are the closest published equivalents.
- **Rauno's "The Craft of UI"** — no page by that name found on rauno.me; not cited.
- **Disagreements inside the school worth keeping:** Rauno's `maximum-scale=1` allowance vs Vercel's NEVER; Rauno's "box-shadow for focus rings" (Safari <16.4) vs Vercel's `:focus-visible` outline guidance; Emil's "shorter than 300ms" vs Rauno's "not more than 200ms"; Taylor's "we fly instead of teleport" vs Rauno/Emil's "don't animate frequent keyboard actions" — reconciled by frequency, which only a journey can state.
