# Lens research — writing and microcopy

Researched 2026-10-03 for the uxcli "lenses" idea. This cluster covers writing for interfaces: error messages, button and link labels, consistent terminology, capitalization, plain language, empty states, success and destructive-action messages, and the formatting of dates, numbers and units. The pool is `skills/uxcli/lenses/viewpoints/writing.json`.

**How sources were verified.** The public design-system sites (design-system.service.gov.uk, carbondesignsystem.com, polaris.shopify.com, primer.style, styleguide.mailchimp.com) could not be fetched from this session: every request returned no response. All five publish their docs from open GitHub repositories, so each page's source file was downloaded from `https://raw.githubusercontent.com/<owner>/<repo>/HEAD/<path>` on 2026-10-03, with paths found through a shallow `git clone --no-checkout` and `git ls-tree`. Every quote below was then checked by a script: it collapses runs of whitespace to one space in both the quote and the file (the Markdown sources wrap lines), then tests for an exact substring match. All ten quotes matched. Curly quotes, apostrophes and the en dash in Carbon's "sentence–case" are as they appear in the source. The `url` in each viewpoint is the public page built from that file. The public URL is worked out from each repo's routing (Primer: `content/X.mdx` → `primer.style/X`; Carbon: `src/pages/X/index.mdx` → `carbondesignsystem.com/X/`; Polaris: `polaris.shopify.com/content/X.mdx` → `polaris.shopify.com/X`) and was **not** loaded in a browser.

Overlap with existing pools is recorded in `agrees` rather than repeated: jargon and error codes (`usability.speak-the-users-language`), cutting words and sentence case in passing (`usability.omit-needless-words`), link text in navigation (`usability.mindless-clicks-not-fewer-clicks`), and the layout side of empty states (`craft.dont-overlook-empty-states-teach-by-example`, `modern.every-state-is-designed`).

## Sources fetched

| source | author | public URL | raw file verified against |
|---|---|---|---|
| Error message component | GOV.UK Design System (GDS) | https://design-system.service.gov.uk/components/error-message/ | `alphagov/govuk-design-system` `src/components/error-message/index.md` |
| Button component | GOV.UK Design System | https://design-system.service.gov.uk/components/button/ | `alphagov/govuk-design-system` `src/components/button/index.md` |
| Confirmation pages pattern | GOV.UK Design System | https://design-system.service.gov.uk/patterns/confirmation-pages/ | `alphagov/govuk-design-system` `src/patterns/confirmation-pages/index.md` |
| Dialog pattern | IBM Carbon | https://carbondesignsystem.com/patterns/dialog-pattern/ | `carbon-design-system/carbon-website` `src/pages/patterns/dialog-pattern/index.mdx` |
| Common actions pattern | IBM Carbon | https://carbondesignsystem.com/patterns/common-actions/ | `carbon-design-system/carbon-website` `src/pages/patterns/common-actions/index.mdx` |
| Content: Writing style | IBM Carbon | https://carbondesignsystem.com/guidelines/content/writing-style/ | `carbon-design-system/carbon-website` `src/pages/guidelines/content/writing-style.mdx` |
| Content: Action labels | IBM Carbon | https://carbondesignsystem.com/guidelines/content/action-labels/ | `carbon-design-system/carbon-website` `src/pages/guidelines/content/action-labels.mdx` |
| Empty states pattern | IBM Carbon | https://carbondesignsystem.com/patterns/empty-states-pattern/ | `carbon-design-system/carbon-website` `src/pages/patterns/empty-states-pattern/index.mdx` |
| Notifications pattern | IBM Carbon | https://carbondesignsystem.com/patterns/notification-pattern/ | `carbon-design-system/carbon-website` `src/pages/patterns/notification-pattern/index.mdx` |
| Content: Fundamentals | Shopify Polaris | https://polaris.shopify.com/content/fundamentals | `Shopify/polaris` `polaris.shopify.com/content/content/fundamentals.mdx` |
| Content: Error messages | Shopify Polaris | https://polaris.shopify.com/content/error-messages | `Shopify/polaris` `polaris.shopify.com/content/content/error-messages.mdx` |
| Content: Grammar and mechanics | Shopify Polaris | https://polaris.shopify.com/content/grammar-and-mechanics | `Shopify/polaris` `polaris.shopify.com/content/content/grammar-and-mechanics.mdx` |
| Toast component (internal only) | Shopify Polaris | https://polaris.shopify.com/components/internal-only/toast | `Shopify/polaris` `polaris.shopify.com/content/components/internal-only/toast.mdx` |
| Descriptive buttons | GitHub Primer | https://primer.style/guides/accessibility/descriptive-buttons | `primer/design` `content/guides/accessibility/descriptive-buttons.mdx` |
| Empty states | GitHub Primer | https://primer.style/ui-patterns/empty-states | `primer/design` `content/ui-patterns/empty-states.mdx` |
| Notification messaging | GitHub Primer | https://primer.style/ui-patterns/notification-messaging | `primer/design` `content/ui-patterns/notification-messaging.mdx` |
| Web Elements | Mailchimp Content Style Guide | https://styleguide.mailchimp.com/web-elements/ | `mailchimp/content-style-guide` `06-web-elements.html.md` |
| Writing Goals and Principles | Mailchimp Content Style Guide | https://styleguide.mailchimp.com/writing-principles/ | `mailchimp/content-style-guide` `01-writing-principles.html.md` |

**Not used:** USWDS (`uswds/uswds-site`) was cloned but has no content-writing guide of its own; it points to plainlanguage.gov, which was not fetched. The GitHub REST API (`api.github.com/.../git/trees`) was refused for these repos from this session, so trees were listed through `git clone` instead.

**Evidence strength, for all entries:** `author`. These are design-system house rules written by in-house content teams. GOV.UK's error-message page is the only one that cites research: it says the messages "have been tested with all types of users in live services, including tax credits". It reports outcomes (users "understood what went wrong", "knew how to fix the problem") but gives no numbers, so it is not rated `study`.

## Viewpoints

### errors-say-what-and-how-to-fix
- **Quote (verbatim):** "Describe what has happened and tell them how to fix it. The message must be in plain English, use positive language and get to the point."
- **Source:** GOV.UK Design System, Error message, section "Be clear and concise". https://design-system.service.gov.uk/components/error-message/
- **Verified:** substring match in `govuk-design-system/src/components/error-message/index.md`. The same page gives the forbids list: "technical jargon like ‘form post error’, ‘unspecified error’ and ‘error 0x0000000643’"; "words like ‘forbidden’, ‘illegal’, ‘you forgot’ and ‘prohibited’"; "‘please’ because it implies a choice"; "‘sorry’ because it does not help fix the problem"; "‘valid’ and ‘invalid’ because they do not add anything to the message"; "humourous, informal language like ‘oops’". Under "Be specific" it lists generic messages to avoid ("An error occurred", "This field is required", …). Under "Match up error messages to labels" it says: "Error messages should directly include language from the question or fieldset label."
- **Corroboration:** Polaris Error messages: "Explain what’s wrong and what the merchant needs to do" and "Avoid error jargon like “invalid”". Primer empty states: "Vague messages like "There was a problem" can be frustrating."
- **Exceptions from source:** GOV.UK: "Do not use error messages to tell a user that they are not eligible or do not have permission to do something", and do not repeat an example that is already in the hint text.

### buttons-name-the-action
- **Quote (verbatim):** "Use descriptive words for the actions like Add, Delete, Save and avoid vague words like Done or OK."
- **Source:** IBM Carbon, Dialog pattern, anatomy item 3 "Actions". https://carbondesignsystem.com/patterns/dialog-pattern/
- **Verified:** substring match (whitespace-normalised; the source wraps after "Save") in `carbon-website/src/pages/patterns/dialog-pattern/index.mdx`.
- **Corroboration:** Mailchimp Web Elements: "Button copy should always include verbs." GOV.UK Button: "Write button text in sentence case, describing the action it performs." Primer Descriptive buttons: "A meaningful name describes the button’s purpose: the action that occurs when the button is activated".
- **Exception:** GOV.UK lists "‘Continue’ when the service does not save a user’s information" as correct for question pages.

### links-describe-their-destination
- **Quote (verbatim):** "Don’t say things like “Click here!” or “Click for more information” or “Read this.” Write the sentence as you normally would, and link relevant keywords."
- **Source:** Mailchimp Content Style Guide, Web Elements → Links. https://styleguide.mailchimp.com/web-elements/
- **Verified:** substring match in `mailchimp/content-style-guide/06-web-elements.html.md`. The curly quotes (U+201C/U+201D) and apostrophe (U+2019) were checked byte by byte with `od -c`.
- **Corroboration:** Polaris Grammar and mechanics → Links: "Never use “click here” or “here” for link text" and "If you have to include “learn more” links, avoid having more than one per screen". That second rule is the exception.

### one-label-per-action
- **Quote (verbatim):** "When buttons perform the same action, they have the same name."
- **Source:** GitHub Primer, Descriptive buttons, "How to test names". https://primer.style/guides/accessibility/descriptive-buttons
- **Verified:** substring match in `primer/design/content/guides/accessibility/descriptive-buttons.mdx`. The next bullet gives the other half of the measure: "When buttons perform different actions, they don’t have the same name." The guidelines add: "Don’t reuse the same (visible) label or (invisible) name for buttons which perform different actions."
- **Corroboration:** Carbon Action labels: "Users rely on consistent labels for common actions to predict how to interact with an interface." Carbon Writing style: "TIP: Create a terminology list of words for your product that includes preferred words and words not to use."
- **Exception:** Carbon Common actions defines Remove separately from Delete ("as a removed item is not destroyed"), so the two can coexist when they mean different things.

### sentence-case-ui-text
- **Quote (verbatim):** "Use sentence–case capitalization for all UI text elements."
- **Source:** IBM Carbon, Content → Writing style → Capitalization. https://carbondesignsystem.com/guidelines/content/writing-style/
- **Verified:** substring match in `carbon-website/src/pages/guidelines/content/writing-style.mdx`. Note that the source writes "sentence–case" with an en dash (U+2013), kept as is. The same page says: "Title case can also slow reading and comprehension down" and "All caps capitalization has been shown to be slower to read". No study is linked for either, so evidence stays `author`.
- **Corroboration:** Polaris Grammar → Capitalization: "Use sentence case (capitalize the first word only) for:" headings, subheadings, buttons, card titles. GOV.UK Button: "Write button text in sentence case".
- **Dissent, recorded as an exception:** Mailchimp Web Elements uses "title case for menu names", for form titles, for "main or global navigation" and for page titles. House styles differ on titles and navigation. They agree on buttons and field labels.

### plain-language-reading-level
- **Quote (verbatim):** "Aim for a 7th grade reading level—it’s easiest for merchants to digest"
- **Source:** Shopify Polaris, Content → Fundamentals, "Write like merchants talk". https://polaris.shopify.com/content/fundamentals
- **Verified:** substring match in `Shopify/polaris/polaris.shopify.com/content/content/fundamentals.mdx`. The em dash (U+2014) and apostrophe (U+2019) are in the source. The same section says "Use plain language" and "Some jargon is okay, as long as it’s what actual merchants say". "Inspire action" says "Start sentences with verbs so they feel like actionable instructions".
- **Corroboration:** Carbon Writing style: "Be succinct, and keep sentences as short and simple as possible." Mailchimp principles: "Clear. Understand the topic you’re writing about. Use simple words and sentences."
- **Measure note:** the grade-9 and 25-word thresholds in `measure.what` are uxcli's tolerance around Polaris's 7th-grade target. The source does not give them.

### empty-states-say-what-next
- **Quote (verbatim):** "From the text, users should be able to understand what steps they might take next."
- **Source:** GitHub Primer, UI patterns → Empty states, "Secondary text". https://primer.style/ui-patterns/empty-states
- **Verified:** substring match in `primer/design/content/ui-patterns/empty-states.mdx`. The same page, under "Primary action", says: "If the space is empty because this the feature hasn't been used yet, the action should initiate a creation flow or link to a feature." Its error-state guidance gives the forbids ("There was a problem"; the over-literal "US East-2 database cluster" example).
- **Corroboration:** Carbon Empty states pattern, anatomy "Body": "Explain clearly the next action to populate the space."
- **Measure note:** the 6-word floor is uxcli's. The source does not give it.

### success-names-what-happened
- **Quote (verbatim):** "Written in the pattern of: noun + verb"
- **Source:** Shopify Polaris, Toast component (internal only), Content guidelines → Message. https://polaris.shopify.com/components/internal-only/toast
- **Verified:** substring match in `Shopify/polaris/polaris.shopify.com/content/components/internal-only/toast.mdx`. The same text appears in the deprecated public Toast page, `content/components/deprecated/toast.mdx`. Its Do list: "Product updated", "Collection added". Its Don't list: "Your product has been successfully updated", "Discount: Saved successfully", "Your Order was Archived Today". The page is filed as internal-only/deprecated, but its content rule is unchanged and is the most specific source found.
- **Corroboration and exception:** Primer Notification messaging, "Success": "Use success messaging sparingly and rely more on interaction context". A message is not needed when, for example, "a user is brought to the newly created issue page upon successful creation". Its needed example is an inline message reading "Issue #21 created". Carbon Notifications gives "Success! Your resource has been created." as a Do example. That contradicts the noun-first pattern, so the pool follows Polaris and Primer.

### destructive-actions-name-the-consequence
- **Quote (verbatim):** "Clearly describe the action being confirmed and explain any potential consequences that it may cause. Both the title and the button should reflect the action that will occur."
- **Source:** IBM Carbon, Dialog pattern → "Confirm a user decision". https://carbondesignsystem.com/patterns/dialog-pattern/
- **Verified:** substring match (whitespace-normalised) in `carbon-website/src/pages/patterns/dialog-pattern/index.mdx`.
- **Corroboration:** Carbon Common actions → Delete: "Ask for confirmation of the delete, with guidance about what will occur if they delete". For high-impact deletion: "have the user type the name of the resource they are deleting". GOV.UK Button → Warning buttons: "Do not only rely on the red colour of a warning button to communicate the serious nature of the action" and "Make sure the context and button text make clear what will happen if the user selects it."
- **Exception from source:** Carbon "Low-impact deletion": "Delete the data upon click or tap without further warning."

### dates-numbers-units-for-the-reader
- **Quote (verbatim):** "Use the month’s full name. If there isn’t enough space, use 3-letter abbreviations. Don’t write dates with numerals only."
- **Source:** Shopify Polaris, Content → Grammar and mechanics → "Numbers, dates, and currency". https://polaris.shopify.com/content/grammar-and-mechanics
- **Verified:** substring match in `Shopify/polaris/polaris.shopify.com/content/content/grammar-and-mechanics.mdx`. The same section also says "Use numerals", "Use commas for numbers with four or more digits. Avoid shortening numbers." (Don't: "12 k"), "Don’t use ordinal indicators", "Include a space between the number and the unit." (Don't: "3.4lb"), and "the currency comes after the dollar amount".
- **Exception from source:** "Dates, numbers, and measurements are often formatted automatically according to users’ local preferences … These guidelines are for manually formatting in American English". The viewpoint therefore asks for the reader's locale, not US order.

## Dropped

None of the planned viewpoints was dropped for an unverifiable quote. Two planned topics were folded into others instead of standing alone:
- *Avoid jargon and internal system names* is already `usability.speak-the-users-language`. It is folded into the forbids of `errors-say-what-and-how-to-fix` and `plain-language-reading-level`.
- *Specific, label-matched error messages* (GOV.UK "Be specific" / "Match up error messages to labels") is on the same source page as the main error rule. It is folded into `errors-say-what-and-how-to-fix`, whose measure checks it.
