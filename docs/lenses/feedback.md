# Lens research — motion and feedback

Researched 2026-10-03 for the uxcli lenses: the `feedback` pool (`skills/uxcli/lenses/viewpoints/feedback.json`), viewpoints about loading, progress, confirmation, notifications and toasts, animation timing and moving content. Written by an agent (Claude) at the request of the person running the session.

## Method and verification

The public design-system sites (carbondesignsystem.com, primer.style, polaris.shopify.com, design-system.service.gov.uk, designsystem.digital.gov, w3.org) and the GitHub API were not reachable from the research session. Every quote was therefore taken from the **source files those pages are built from**. Repos were cloned with `git clone --depth 1 --filter=blob:none --no-checkout` and listed with `git ls-tree -r --name-only HEAD` to find the files; each file was then fetched from `raw.githubusercontent.com` with `curl` this session.

Each quote was checked by a script that strips HTML tags, `&nbsp;` entities and Markdown backticks and asterisks, collapses whitespace, and looks for the quote as a substring of the fetched text. All 10 quotes passed. No quote needed any normalisation beyond whitespace.

The `url` in each viewpoint is the public page built from that file, worked out from the repo's routing (Gatsby/Next page paths for Carbon, Primer and Polaris, the `permalink` front matter for USWDS, the folder name for GOV.UK, the file name for W3C Understanding docs). Nobody loaded it in a browser.

Two things about the sources that a reader should know:
- The W3C `understanding/21/status-messages.html` file on `main` carries the heading "Understanding SC 3.2.6" (the repo appears to be mid-renumbering). The published WCAG 2.2 numbers Status Messages 4.1.3, and the viewpoint cites it that way with the WCAG 2.2 URL.
- Polaris marks its Toast component **deprecated** in favour of the App Bridge Toast API. The guidance quoted is still on the component page; the viewpoints say so in `exceptions`.

Scope: these rules already exist in other pools and are not repeated here, only linked through `agrees`: feedback within a second (`usability.feedback-within-a-second`), visibility of system status (`usability.visibility-of-system-status`), the 200 ms interaction cap (`modern.interactions-feel-immediate-under-200ms`), animate only transform and opacity (`modern.animate-only-transform-and-opacity`), honouring prefers-reduced-motion (`modern.honour-prefers-reduced-motion`), skeletons that hold layout (`data-display.loading-skeleton-holds-the-layout`), ending on a confirmation (`usability.peak-end-finish-well`), wording of destructive confirmations (`writing.destructive-actions-name-the-consequence`), and colour as the only signal (`color.never-the-only-signal`).

## Sources fetched

| source | author | public URL | raw file fetched |
|---|---|---|---|
| Understanding SC 4.1.3 Status Messages | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/status-messages.html |
| Understanding SC 2.2.2 Pause, Stop, Hide | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html | https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/pause-stop-hide.html |
| Understanding SC 2.2.1 Timing Adjustable | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html | https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/timing-adjustable.html |
| SC 2.2.1 Timing Adjustable (normative text) | W3C WAI | https://www.w3.org/TR/WCAG22/#timing-adjustable | https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/timing-adjustable.html |
| Understanding SC 2.3.3 Animation from Interactions | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html | https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/animation-from-interactions.html |
| Confirmation pages pattern | GOV.UK Design System | https://design-system.service.gov.uk/patterns/confirmation-pages/ | https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/patterns/confirmation-pages/index.md |
| Panel component | GOV.UK Design System | https://design-system.service.gov.uk/components/panel/ | …/src/components/panel/index.md |
| Notification banner component | GOV.UK Design System | https://design-system.service.gov.uk/components/notification-banner/ | …/src/components/notification-banner/index.md |
| Toast component (deprecated) | Shopify Polaris | https://polaris.shopify.com/components/deprecated/toast | https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/deprecated/toast.mdx |
| Motion, Using motion | Shopify Polaris | https://polaris.shopify.com/design/motion | …/polaris.shopify.com/content/design/motion/{index,using-motion}.mdx |
| Loading UI pattern | GitHub Primer | https://primer.style/product/ui-patterns/loading/ | https://raw.githubusercontent.com/primer/design/main/content/ui-patterns/loading.mdx |
| Notification messaging UI pattern | GitHub Primer | https://primer.style/product/ui-patterns/notification-messaging/ | …/content/ui-patterns/notification-messaging.mdx |
| Motion overview | IBM Carbon | https://carbondesignsystem.com/elements/motion/overview/ | https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/elements/motion/overview.mdx |
| Notification usage, accessibility; Notification pattern | IBM Carbon | https://carbondesignsystem.com/components/notification/usage/ and https://carbondesignsystem.com/patterns/notification-pattern/ | …/src/pages/components/notification/{usage,accessibility}.mdx, …/src/pages/patterns/notification-pattern/index.mdx |
| Progress bar usage | IBM Carbon | https://carbondesignsystem.com/components/progress-bar/usage/ | …/src/pages/components/progress-bar/usage.mdx |
| Alert component (guidance includes) | USWDS | https://designsystem.digital.gov/components/alert/ | https://raw.githubusercontent.com/uswds/uswds-site/main/_components/alert/alert.md (permalink `/components/alert/`) and …/_components/alert/guidance/{accessibility,usability,when-to-use,when-to-consider-something-else}.md |
| Site alert component | USWDS | https://designsystem.digital.gov/components/site-alert/ | …/_components/site-alert/guidance/usability.md |

Also fetched and read but not quoted: Carbon loading, inline-loading and loading-pattern pages; Polaris spinner, skeleton-page, progress-bar, creating-motion and legacy loading pages; Primer spinner, progress-bar and deprecated toast pages.

Dropped:
- **Animation from interactions (2.3.3).** The source was fetched and has a quotable line ("Always give users the ability to turn off unnecessary movement."), but a viewpoint on it would duplicate `modern.honour-prefers-reduced-motion`, whose measure (emulate `prefers-reduced-motion: reduce` and list remaining translations) already covers scroll-triggered and parallax motion. It is linked from `feedback.moving-content-can-be-paused` instead.
- **A separate "skeleton vs spinner" viewpoint.** `data-display.loading-skeleton-holds-the-layout` already covers skeletons; the spinner-vs-skeleton choice was folded into `feedback.match-the-indicator-to-the-wait` from Primer's loading pattern.

## Viewpoints

### feedback.status-messages-announced-without-focus
- **Source:** W3C WAI, Understanding SC 4.1.3 Status Messages — https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- **Raw file:** https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/status-messages.html
- **Quote:** "The intent of this success criterion is to make users aware of important changes in content that are not given focus, and to do so in a way that doesn't unnecessarily interrupt their work."
- **Verified:** substring of the fetched HTML after tag stripping and whitespace collapse. The examples ("18 results returned", the add-to-cart count) and the notes that changes of context and the search results themselves are out of scope come from the same file. Primer's loading pattern (`role="status"` must always be rendered; `aria-busy` while a live region fills) supports the `prefers` list. The 3 s window in the measure is uxcli's.

### feedback.confirmation-page-says-what-happens-next
- **Source:** GOV.UK Design System, Confirmation pages — https://design-system.service.gov.uk/patterns/confirmation-pages/
- **Raw file:** https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/patterns/confirmation-pages/index.md
- **Quote:** "Confirmation pages reassure users that they have completed a transaction and helps them understand what to expect next."
- **Verified:** substring of the fetched Markdown (the grammar "helps" is GOV.UK's). The list of must-haves (reference number, what happens next and when, contact details, likely next links, feedback link, a way to save a record) and the bookmark advice are in the same file; the panel's outcome-as-heading and the warning about links inside the green panel come from the Panel component and Confirmation pages files. The mid-journey alternative (green notification banner) is from the Notification banner file. The past-tense and time-expression heuristics are uxcli's.

### feedback.toasts-carry-nothing-critical
- **Source:** Shopify Polaris, Toast component — https://polaris.shopify.com/components/deprecated/toast
- **Raw file:** https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/deprecated/toast.mdx
- **Quote:** "Avoid using toast for critical information that merchants need to act on immediately."
- **Verified:** substring of the fetched MDX (Accessibility section). The same file gives the 3-word limit, noun + verb pattern, the 'Internet disconnected' exception and why toasts are hard to reach (disappear automatically, hard to reach by keyboard, may appear away from focus). Carbon's notification pattern says the same in its own words ("Don’t use notifications that dismiss on a timer for critical or emergency messages."), and Carbon's notification usage says users should be able to reach a toast's content elsewhere after it disappears. The 15 s, 15-word and 6-character thresholds in the measure are uxcli's.

### feedback.toast-actions-wait-for-the-user
- **Source:** Shopify Polaris, Toast component — Toast with action — https://polaris.shopify.com/components/deprecated/toast
- **Raw file:** same as above.
- **Quote:** "Toast with action should persist for at least 10,000 milliseconds to give the merchant enough time to act on it."
- **Verified:** substring of the fetched MDX. The rule that the toast's action must also be available elsewhere on the page and the 5000 ms default duration are in the same file. Carbon's notification pattern ("If the toast includes an action button, then the notification should remain on screen until the user dismisses it.") is the stricter variant noted in `exceptions`. The WCAG 2.2.1 Understanding file gives the toast-with-alternative example cited in `exceptions`.

### feedback.match-the-indicator-to-the-wait
- **Source:** GitHub Primer, Loading UI pattern — https://primer.style/product/ui-patterns/loading/
- **Raw file:** https://raw.githubusercontent.com/primer/design/main/content/ui-patterns/loading.mdx
- **Quote:** "Determinate loading indicators work best for processes that are likely to take longer (approximately 3 or more seconds)."
- **Verified:** substring of the fetched MDX. The wait bands (less than 1 s: no loading state; 1–3 s: indeterminate; 3–10 s and over 10 s: determinate, backgrounded if possible), skeletons when the shape is known, placing the indicator nearest the content, interstitials only for long processes ending in a significant change, and specific labels ("loading status checks") are all in the same file. Carbon's progress bar page ("Use a determinate progress bar when the progress can be calculated against a specific goal. For example, when downloading a file of a known size.") agrees. The 80% and half-viewport thresholds are uxcli's.

### feedback.motion-duration-scales-with-size
- **Source:** IBM Carbon, Motion overview — https://carbondesignsystem.com/elements/motion/overview/
- **Raw file:** https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/elements/motion/overview.mdx
- **Quote:** "Motion’s duration should be dynamic based on the size of the animation; the larger the change in distance (traveled) or size (scaling) of the element, the longer the animation takes."
- **Verified:** substring of the fetched MDX (curly apostrophe as in the source). The duration token table is in the same file: `duration-fast-01` 70ms (button and toggle), `duration-fast-02` 110ms (fade), `duration-moderate-01` 150ms (small expansion, short movement), `duration-moderate-02` 240ms (expansion, system communication, toast), `duration-slow-01` 400ms (large expansion, important system notifications), `duration-slow-02` 700ms (background dimming); so are productive vs expressive motion and the evaluation checklist's 90–120 ms for micro-interactions. Carbon says dynamic duration is upcoming and the six tokens are static values for now. Polaris's motion principles (purposeful, responsive — "The scale of the motion should match the scale of the action performed." — and snappy) agree. The thresholds in the measure (700 ms ceiling, 150 ms for controls) are read off Carbon's token table; the grouping of controls and the area comparison are uxcli's.

### feedback.moving-content-can-be-paused
- **Source:** W3C WAI, Understanding SC 2.2.2 Pause, Stop, Hide — https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- **Raw file:** https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/pause-stop-hide.html
- **Quote:** "Content that moves or auto-updates can be a barrier to anyone who has trouble reading stationary text quickly as well as anyone who has trouble tracking moving objects."
- **Verified:** substring of the fetched HTML after tag stripping and whitespace collapse (the source breaks the sentence over two lines). The five-second rule and its absence for auto-updating content, resuming real-time content at the current state, and that a pause lasting only while focused is not a mechanism are all in the same file. The 6 s wait in the measure is uxcli's, set just past the source's five seconds.

### feedback.time-limits-warn-and-extend
- **Source:** W3C WAI, Understanding SC 2.2.1 Timing Adjustable — https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- **Raw file:** https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/timing-adjustable.html
- **Quote:** "Providing options to disable time limits, customize the length of time limits, or request more time before a time limit occurs helps those users who require more time than expected to successfully complete tasks."
- **Verified:** substring of the fetched HTML after tag stripping and whitespace collapse. The 20-second response time and "at least ten times" come from the normative SC text, fetched from https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/timing-adjustable.html ("The user is warned before time expires and given at least 20 seconds to extend the time limit with a simple action … and the user is allowed to extend the time limit at least ten times"); the Understanding file explains why 20 seconds was chosen. Keeping answers after a time-out is from SC 2.2.5 Re-authenticating, which the Understanding file references; this is said in `exceptions`.

### feedback.message-type-said-in-words
- **Source:** USWDS, Alert component — https://designsystem.digital.gov/components/alert/
- **Raw file:** https://raw.githubusercontent.com/uswds/uswds-site/main/_components/alert/guidance/accessibility.md (included on the alert page; `alert.md` has `permalink: /components/alert/`)
- **Quote:** "Users should be able to understand the purpose of the alert without relying solely on its color or the shape of its icon."
- **Verified:** substring of the fetched Markdown. The instruction to start the alert text with a word describing the type, and the list of types (informative, warning, success, error, emergency), are in the same file. GOV.UK's notification banner file says to use headings like 'Success' so as not to rely on colour alone, and to use the same heading consistently (WCAG 3.2.4); Primer's notification messaging says each state has a corresponding icon and colour. The word list and five-word window in the measure are uxcli's.

### feedback.destructive-actions-confirmed-or-undoable
- **Source:** USWDS, Alert component — When to consider something else — https://designsystem.digital.gov/components/alert/
- **Raw file:** https://raw.githubusercontent.com/uswds/uswds-site/main/_components/alert/guidance/when-to-consider-something-else.md
- **Quote:** "If an action will result in destroying a user’s work (for example, deleting an application) use a more intrusive pattern, such as a confirmation modal dialogue, to allow the user to confirm that this action is what they want."
- **Verified:** substring of the fetched Markdown (curly apostrophe as in the source). USWDS names the confirmation dialog only; the Undo alternative for reversible actions comes from Polaris's toast page ("If merchants delete an image, offer the option to [Undo] the deletion."), and this pool's combination of the two is said in `exceptions`. The wording of the confirmation itself belongs to `writing.destructive-actions-name-the-consequence`. The 2 s window is uxcli's.
