# Lens research — forms and input

Researched 2026-10-03 for the uxcli lenses: the `forms` pool (`skills/uxcli/lenses/viewpoints/forms.json`), viewpoints about asking for, validating and recovering form input.

## Method and verification

The public design-system sites (design-system.service.gov.uk, designsystem.digital.gov, primer.style, w3.org) were not reachable from the research session; the proxy refused the connection. Every quote was therefore taken from the **source files those pages are built from**, fetched from GitHub raw this session with `curl`. Each quote was then checked by a script that strips Markdown backticks, the HTML tags of `.html` sources and `&nbsp;` entities, collapses whitespace, and looks for the quote as a substring of the fetched text. All 12 quotes passed. The `url` in each viewpoint is the public page built from that file, worked out from the repo's own permalinks and site layout. Nobody loaded it in a browser.

Normalisation that touches a quote:
- `forms.input-type-matches-the-answer`: the Markdown wraps `<input type="number">` in backticks. The quote leaves them out, as the rendered page does.
- `forms.group-related-inputs-in-a-fieldset`: the USWDS HTML breaks the sentence over two lines. The quote joins them with a single space.

Scope: these rules already exist in other pools and are not repeated here. Labels above fields (`usability.labels-above-fields`), placeholders are not labels (`usability.placeholders-are-not-labels`), single-column forms (`usability.single-column-forms`), field width (`usability.field-width-matches-expected-input`), one thing per page (`usability.one-thing-per-page`), blur validation (`usability.inline-validation-after-leaving-field`), checkout field count (`usability.fewer-checkout-fields`), tolerant input (`usability.postel-tolerant-input`), and the error-identification / error-prevention / redundant-entry flow probes.

## Sources fetched

| source | author | public URL | raw file fetched |
|---|---|---|---|
| Error summary component | GOV.UK Design System | https://design-system.service.gov.uk/components/error-summary/ | https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/error-summary/index.md |
| Error message component | GOV.UK Design System | https://design-system.service.gov.uk/components/error-message/ | …/src/components/error-message/index.md |
| Recover from validation errors | GOV.UK Design System | https://design-system.service.gov.uk/patterns/validation/ | …/src/patterns/validation/index.md |
| Question pages | GOV.UK Design System | https://design-system.service.gov.uk/patterns/question-pages/ | …/src/patterns/question-pages/index.md |
| Text input component | GOV.UK Design System | https://design-system.service.gov.uk/components/text-input/ | …/src/components/text-input/index.md |
| Date input component | GOV.UK Design System | https://design-system.service.gov.uk/components/date-input/ | …/src/components/date-input/index.md |
| Dates pattern | GOV.UK Design System | https://design-system.service.gov.uk/patterns/dates/ | …/src/patterns/dates/index.md |
| Fieldset component | GOV.UK Design System | https://design-system.service.gov.uk/components/fieldset/ | …/src/components/fieldset/index.md |
| Button component | GOV.UK Design System | https://design-system.service.gov.uk/components/button/ | …/src/components/button/index.md |
| Email addresses, Names, Addresses, Check answers patterns | GOV.UK Design System | https://design-system.service.gov.uk/patterns/ | …/src/patterns/{email-addresses,names,addresses,check-answers}/index.md |
| Understanding SC 1.3.5 Identify Input Purpose | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html | https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/identify-input-purpose.html |
| Understanding SC 3.3.3 Error Suggestion | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html | https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/error-suggestion.html |
| Form component (accessibility guidance include) | USWDS | https://designsystem.digital.gov/components/form/ | https://raw.githubusercontent.com/uswds/uswds-site/main/_components/form/form.md and …/_includes/forms-guidance.html |
| Forms UI pattern | GitHub Primer | https://primer.style/product/ui-patterns/forms/overview/ | https://raw.githubusercontent.com/primer/design/main/content/ui-patterns/forms/overview.mdx |

Tried and dropped: the W3C WAI forms tutorial (`w3c/wai-tutorials`, `content/forms/grouping.md` on `main` and `master`) returned 404, so the fieldset rule cites USWDS and GOV.UK instead. The GitHub tree API refused these repos in this session, so paths were found by trying the repos' own layouts. Shopify Polaris was not needed.

## Viewpoints

### forms.error-summary-at-the-top
- **Source:** GOV.UK Design System, Error summary component — https://design-system.service.gov.uk/components/error-summary/
- **Quote:** "Always show an error summary when there is a validation error, even if there’s only one."
- **Supporting, same file:** "move keyboard focus to the error summary", "link to each of the answers that have validation errors", "Put the error summary at the top of the `main` container. If your page includes breadcrumbs or a back link, place it below these, but above the `<h1>`."
- **Second school:** Primer, Forms ("Validation on submit"): "If the form has 3 or more errors, you may show an [interactive summary of errors]", and "list the invalid inputs as anchor links. When the link is activated, place focus in its corresponding input." Primer's lower bound of 3 errors is recorded as an exception.
- **Verified:** substring match against raw `error-summary/index.md`.

### forms.error-message-says-how-to-fix
- **Source:** GOV.UK Design System, Error message component, "Be clear and concise" — https://design-system.service.gov.uk/components/error-message/
- **Quote:** "Describe what has happened and tell them how to fix it. The message must be in plain English, use positive language and get to the point."
- **Supporting, same file:** the "Do not use" list (jargon, 'please', 'sorry', 'valid'/'invalid', 'oops'); "Avoid messages like: … ‘This field is required’"; "Error messages should directly include language from the question or fieldset label."
- **Second school:** WCAG 3.3.3 Understanding, "What to do": "Where errors are detected, suggest known ways to correct them."
- **Verified:** substring match against raw `error-message/index.md` and `error-suggestion.html`.

### forms.validate-when-the-user-is-done
- **Source:** GOV.UK Design System, Recover from validation errors — https://design-system.service.gov.uk/patterns/validation/
- **Quote:** "Generally speaking, avoid validating the information in a field before the user has finished entering it. This sort of validation can cause problems - especially for users who type more slowly."
- **Supporting, same file:** "Do not validate when the user moves away from a field. Wait until they try to move to the next part of the service - usually by clicking the ‘continue’ or ‘submit’ button at the bottom of the page." and "Turn off HTML5 validation."
- **Second school:** Primer: "The default behavior of the web is to perform validation when the user attempts to submit the form. This lets the user flow quickly through the form without interruption." and "Don't attempt to validate an input before the user is done with it."
- **Disagreement, recorded rather than resolved:** GOV.UK says not to validate on blur. The existing `usability.inline-validation-after-leaving-field` (Wroblewski/Baymard) recommends blur validation for hard fields, and Primer allows it after a change plus blur. All three agree on *not while typing*, and that is what the measure checks. Because of the disagreement, the blur viewpoint is not listed in `agrees`.
- **Verified:** substring match against raw `validation/index.md` and `primer … overview.mdx`.

### forms.keep-answers-after-an-error
- **Source:** GOV.UK Design System, Error message component, "How it works" — https://design-system.service.gov.uk/components/error-message/
- **Quote:** "Do not clear any form fields when showing the Error message component. Keep both passing and failing answers."
- **Supporting:** Validation pattern: "show them the page again, with the form fields as the user filled them in". Check answers pattern: "If a user decides to go back to a previous answer, make sure information they've already entered is pre-populated."
- **Exception (password/CVV may be cleared):** a common security practice, not a GOV.UK statement. It is labelled as an exception, not a quote.
- **Verified:** substring match against raw `error-message/index.md`.

### forms.mark-optional-fields-in-words
- **Source:** GOV.UK Design System, Question pages — https://design-system.service.gov.uk/patterns/question-pages/
- **Quote:** "in most contexts, add ‘(optional)’ to the labels of optional fields"
- **Supporting, same file:** "Never mark mandatory fields with asterisks."
- **Disagreement:** USWDS form guidance says "Mark required fields as required by using a red asterisk (*)" with a key at the top of the form, *and* "Label optional fields with the word “optional” placed in parentheses." Primer: "When a field is required to have a value, it should be visibly marked as required." The schools agree that optional fields say so in words, and that is what the measure checks. The asterisk ban is GOV.UK's alone and is recorded in `exceptions`.
- **Verified:** substring match against raw `question-pages/index.md` and `forms-guidance.html`.

### forms.autocomplete-names-the-purpose
- **Source:** W3C WAI, Understanding WCAG 2.2 SC 1.3.5 Identify Input Purpose — https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html
- **Quote:** "Use code to indicate the purpose of common inputs, where technology allows." (the "In brief → What to do" line)
- **Supporting, same file:** "This success criterion is specifically scoped to inputs collecting information about the user." This is the source of the exception for fields about other people.
- **Second school:** GOV.UK Text input: "Use the `autocomplete` attribute on text inputs to help users complete forms more quickly." The Names, Addresses, Email and Date input pages give the tokens (`name`, `postal-code`, `email`, `bday-day`/`bday-month`/`bday-year`).
- **Verified:** substring match against raw `understanding/21/identify-input-purpose.html` (tags stripped). The WCAG22 public URL serves the same Understanding document, which sits in the repo's `understanding/21/` folder because the SC was added in 2.1.

### forms.input-type-matches-the-answer
- **Source:** GOV.UK Design System, Text input component, "Avoid using inputs with a type of number" — https://design-system.service.gov.uk/components/text-input/
- **Quote:** "With <input type="number"> there’s a risk of users accidentally incrementing a number when they’re trying to do something else - for example, scroll up or down the page." (backticks around the element left out, as the page renders it)
- **Supporting, same file:** "If you're asking the user to enter a whole number, set the `inputmode` attribute to `numeric` …"; the guidance on negative numbers; "Do not disable copy and paste"; turning spellcheck off for names, references and emails.
- **Verified:** substring match against raw `text-input/index.md` after backtick removal.

### forms.memorable-dates-as-three-fields
- **Source:** GOV.UK Design System, Date input component — https://design-system.service.gov.uk/components/date-input/
- **Quote:** "Use the date input component when you’re asking users for a date they’ll already know, or can look up without using a calendar."
- **Supporting, same file:** "The date input component consists of 3 fields to let users enter a day, month and year."; "Never automatically tab users between the fields of the date input …"; "Accept month names written out in full or abbreviated form". Dates pattern: "Never make a calendar control that depends on JavaScript as the only input option."; the example-date rule (day ≥ 13, month ≤ 9); matching a document's format for document dates.
- **Inferred, not quoted:** "three dropdowns" in `forbids`. GOV.UK specifies text fields. The dropdown objection comes from `craft.anything-but-dropdowns`, which is listed in `agrees`.
- **Verified:** substring match against raw `date-input/index.md` and `dates/index.md`.

### forms.ask-only-what-you-need
- **Source:** GOV.UK Design System, Question pages — https://design-system.service.gov.uk/patterns/question-pages/
- **Quote:** "You should make sure you know why you’re asking every question and only ask users for information you really need."
- **Supporting, same file:** the link to a question protocol (Caroline Jarrett, UXmatters, 2010; the link was not fetched); "Make sure to only ask for a piece of information once within a single journey."; "allow users to answer ‘I do not know’ or ‘I’m not sure’ if they are valid responses".
- **Measure is a question:** whether a field is needed cannot be read off the page.
- **Verified:** substring match against raw `question-pages/index.md`.

### forms.group-related-inputs-in-a-fieldset
- **Source:** USWDS, Form component, Accessibility guidance — https://designsystem.digital.gov/components/form/
- **Quote:** "Group each set of thematically related controls in a fieldset element. Use the legend element to offer a label within each one."
- **Supporting, same file:** "Use a single legend for fieldset (this is required)."
- **Second school:** GOV.UK Fieldset: "The first element inside a fieldset must be a `legend` which describes the group of inputs."
- **Verified:** the public page's Markdown (`_components/form/form.md`) only includes `forms-guidance.html`, which holds the text. Substring match after tag stripping and whitespace collapse.

### forms.hint-text-is-short-and-linked
- **Source:** GOV.UK Design System, Text input component, "Hint text" — https://design-system.service.gov.uk/components/text-input/
- **Quote:** "Keep hint text to a single short sentence, without any full stops."
- **Supporting, same file:** "Do not include links within hint text. While screen readers will read out the link text when describing the field, they will not tell users that the text is a link." Question pages has the same rule and the statement-heading alternative for long explanations. Error message: "put the message in red after the question text and hint text", which fixes the order label → hint → error → input.
- **Second school:** Primer: "Caption text should be as short as possible."
- **Measure threshold:** "about 120 characters" is uxcli's way of making "short sentence" checkable. No source gives that number.
- **Verified:** substring match against raw `text-input/index.md`.

### forms.do-not-disable-the-submit-button
- **Source:** GitHub Primer, Forms UI pattern, "Validation" — https://primer.style/product/ui-patterns/forms/overview/
- **Quote:** "Disabled buttons are discouraged, as they don't clearly communicate what actions a user should take to complete a form."
- **Second school:** GOV.UK Button: "Disabled buttons have poor contrast and can confuse some users, so avoid them if possible." (`&nbsp;` in source). USWDS: "Avoid disabled states, especially for text inputs." It allows them to prevent "multiple form submissions", recorded as an exception alongside GOV.UK's `data-prevent-double-click`.
- **URL caveat:** derived from the repo path `content/ui-patterns/forms/overview.mdx` and Primer's current `/product/` site section. Not loaded.
- **Verified:** substring match against raw `overview.mdx`, `button/index.md` and `forms-guidance.html`.

## Considered and not added

- **Check answers before submitting** (GOV.UK Check answers pattern): well sourced but out of the brief's list, and transaction-only. A candidate for a later pass.
- **Size inputs to the answer** and **one thing per page**: already covered by `usability.field-width-matches-expected-input` and `usability.one-thing-per-page`. GOV.UK Text input repeats the first ("Postcode inputs should be postcode-sized, phone number inputs should be phone number-sized.").
- **Do not restrict length with `maxlength`** (GOV.UK Text input): sourced and measurable. Left for a later pass to keep the pool near ten.
