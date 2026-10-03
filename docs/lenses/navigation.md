# Lens research: navigation and information architecture

Researched 2026-10-03 for the uxcli lenses. This file backs the `navigation` pool (`skills/uxcli/lenses/viewpoints/navigation.json`). Its viewpoints cover how people find their way around a set of pages: where they are, how they get elsewhere, how they go back, and how navigation stays the same from page to page.

## Method and verification

The public design-system sites (design-system.service.gov.uk, designsystem.digital.gov, carbondesignsystem.com, primer.style, polaris.shopify.com, w3.org) and the GitHub API could not be reached from the research sandbox. The research took every quote from the **source files those pages are built from**:

1. It shallow-cloned each repo with `git clone --depth 1 --filter=blob:none --no-checkout` and found the file paths with `git ls-tree -r --name-only HEAD`.
2. It fetched each file this session with `curl -s https://raw.githubusercontent.com/OWNER/REPO/main/PATH`.

A script then checked each quote. It strips HTML tags, decodes entities, reduces Markdown links to their text, removes backticks and `**`, collapses whitespace, and looks for the quote as a substring of the fetched file. All 10 primary quotes passed, and so did the 61 supporting quotes listed below.

Each viewpoint's `url` is the public page built from its source file. The URL was worked out from the repo's routing:
- GOV.UK: `src/components/<x>/index.md` and `src/patterns/<x>/index.md` become `/components/<x>/` and `/patterns/<x>/`.
- USWDS: the `permalink:` front matter in `_components/<x>/<x>.md`.
- Carbon: `src/pages/components/<x>/usage.mdx` becomes `/components/<x>/usage/`.
- Primer: `content/ui-patterns/navigation.mdx` becomes `/product/ui-patterns/navigation/`, the same mapping the forms pool used.
- W3C: `understanding/20/<x>.html` becomes `/WAI/WCAG22/Understanding/<x>.html`.

Nobody loaded these URLs in a browser.

How normalisation affects the quotes:
- `navigation.you-are-here` and `navigation.pagination-says-where-and-how-many`: in the USWDS source, the first sentence of each quote is bold (`**…**`). The quote leaves out the asterisks, as the rendered page does.
- Supporting quotes from GOV.UK that contain `` `<title>` ``, `` `<main>` `` or `` `<nav>` `` drop the backticks, as the rendered page does.

Scope. Rules that other pools already hold are not repeated here. Where they relate, they are linked through `agrees`:
- `writing.links-describe-their-destination`
- `writing.one-label-per-action`
- `usability.speak-the-users-language`
- `usability.hicks-fewer-choices-when-time-matters`
- `usability.clearly-marked-emergency-exit`
- `usability.progress-indication-in-flows`
- `modern.no-junk-drawer-menus-or-unlabeled-icons`
- `canon.vignelli-syntactic-consistency`
- `color.never-the-only-signal`
- `data-display.long-tables-sort-and-say-so`
- `forms.keep-answers-after-an-error`

Not done: `docs/lenses/build-lenses.mjs` lists its schools in a `SCHOOLS` array, and `navigation` is not added to it yet. This research changed only this file and the pool.

## Sources fetched

| source | author | public URL | raw file fetched |
|---|---|---|---|
| Help users navigate a service (pattern) | GOV.UK Design System | https://design-system.service.gov.uk/patterns/navigate-a-service/ | https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/patterns/navigate-a-service/index.md |
| Breadcrumbs | GOV.UK Design System | https://design-system.service.gov.uk/components/breadcrumbs/ | …/src/components/breadcrumbs/index.md |
| Back link | GOV.UK Design System | https://design-system.service.gov.uk/components/back-link/ | …/src/components/back-link/index.md |
| Skip link | GOV.UK Design System | https://design-system.service.gov.uk/components/skip-link/ | …/src/components/skip-link/index.md |
| Pagination | GOV.UK Design System | https://design-system.service.gov.uk/components/pagination/ | …/src/components/pagination/index.md |
| Tabs | GOV.UK Design System | https://design-system.service.gov.uk/components/tabs/ | …/src/components/tabs/index.md |
| Service navigation, Header (read, not quoted) | GOV.UK Design System | https://design-system.service.gov.uk/components/service-navigation/ | …/src/components/service-navigation/index.md, …/header/index.md |
| Side navigation | USWDS | https://designsystem.digital.gov/components/side-navigation/ | https://raw.githubusercontent.com/uswds/uswds-site/main/_components/sidenav/guidance/usability.md (+ when-to-use, when-to-consider-something-else) |
| Breadcrumb | USWDS | https://designsystem.digital.gov/components/breadcrumb/ | …/_components/breadcrumb/guidance/{usability,when-to-use,when-to-consider-something-else}.md |
| Pagination | USWDS | https://designsystem.digital.gov/components/pagination/ | …/_components/pagination/guidance/{usability,when-to-use}.md |
| In-page navigation (read, not quoted) | USWDS | https://designsystem.digital.gov/components/in-page-navigation/ | …/_components/in-page-navigation/guidance/{usability,when-to-use}.md |
| UI shell header | Carbon (IBM) | https://carbondesignsystem.com/components/UI-shell-header/usage/ | https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/components/UI-shell-header/usage.mdx |
| UI shell left panel (read, not quoted) | Carbon (IBM) | https://carbondesignsystem.com/components/UI-shell-left-panel/usage/ | …/src/pages/components/UI-shell-left-panel/usage.mdx |
| Breadcrumb | Carbon (IBM) | https://carbondesignsystem.com/components/breadcrumb/usage/ | …/src/pages/components/breadcrumb/usage.mdx |
| Tabs | Carbon (IBM) | https://carbondesignsystem.com/components/tabs/usage/ | …/src/pages/components/tabs/usage.mdx |
| Navigation (UI pattern) | GitHub Primer | https://primer.style/product/ui-patterns/navigation/ | https://raw.githubusercontent.com/primer/design/main/content/ui-patterns/navigation.mdx |
| Underline nav, Nav list, Breadcrumbs | GitHub Primer | https://primer.style/product/components/underline-nav/ (and /nav-list/, /breadcrumbs/) | …/content/components/{underline-nav,nav-list,breadcrumbs}.mdx |
| Tabs | Shopify Polaris | https://polaris.shopify.com/components/navigation/tabs | https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/components/navigation/tabs.mdx |
| Understanding SC 2.4.1 Bypass Blocks | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html | https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/bypass-blocks.html |
| Understanding SC 2.4.2 Page Titled | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html | …/understanding/20/page-titled.html |
| Understanding SC 2.4.5 Multiple Ways | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html | …/understanding/20/multiple-ways.html |
| Understanding SC 2.4.8 Location | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/location.html | …/understanding/20/location.html |
| Understanding SC 3.2.3 Consistent Navigation | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html | …/understanding/20/consistent-navigation.html |
| Understanding SC 3.2.4 Consistent Identification | W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html | …/understanding/20/consistent-identification.html |

Tried and dropped:
- **Polaris Navigation component.** It sits under `content/components/deprecated/navigation.mdx`. A deprecated page was not used as a source.
- **USWDS header usability files** (`_components/header/guidance/variants/*/usability.md`). They came back empty (0 bytes).
- **"Navigation labels are the user's words."** This is already `usability.speak-the-users-language`. It is not repeated. Carbon's "Header links should be unique and clearly describe the content and location that it will link to." is recorded here as supporting evidence for `navigation.you-are-here` and `navigation.top-level-is-sections-not-a-site-map`.

## Viewpoints

### navigation.you-are-here
- **Source:** USWDS, Side navigation, https://designsystem.digital.gov/components/side-navigation/
- **Raw file:** `uswds/uswds-site` `_components/sidenav/guidance/usability.md`
- **Quote:** "Show the current page. Indicate where a user is within the navigational hierarchy. Use the “active” state to show users which page they have navigated to."
- **Supporting:**
  - WCAG 2.4.8 Location, goal: "Users know where they are in a set of pages."
  - Primer Nav list: "A nav list organizes navigation links for the user's current context and indicates which view they're currently on."
  - Primer Breadcrumbs: "For screen reader users, this information is conveyed programmatically through the use of the `aria-current` attribute in the rendered output."
  - WCAG 2.4.2 Page Titled: "Having the link and the title agree, or be very similar, is good practice and provides continuity between the link 'clicked on' and the web page that the user lands on." Also, for single-page apps: "the title of the page should also be changed dynamically to reflect the content or topic of the current view."
  - USWDS Breadcrumb: "Use the same wording in breadcrumb text as in the page title."
- **Exception from the same source:** USWDS Side navigation, "Keep the navigation links short. They can be shorter derivatives of page titles themselves." The measure therefore accepts containment as well as equality.
- **Number introduced:** none. The "more than colour" condition comes from `color.never-the-only-signal` and is labelled as uxcli's in `exceptions`.
- **Verified:** substring match against all the raw files named above.

### navigation.breadcrumbs-only-for-real-hierarchy
- **Source:** GOV.UK Design System, Breadcrumbs, https://design-system.service.gov.uk/components/breadcrumbs/
- **Raw file:** `alphagov/govuk-design-system` `src/components/breadcrumbs/index.md`
- **Quote:** "Do not use the breadcrumbs component on websites with a flat structure, or to show progress through a linear journey or transaction."
- **Supporting:**
  - GOV.UK, same file: "Always place breadcrumbs at the top of a page, before the `<main>` element." and "The breadcrumbs should start with your 'home' page and end with the parent section of the current page."
  - Carbon Breadcrumb: "Breadcrumbs are effective in products and experiences that have a large amount of content organized in a hierarchy of more than two levels." and "Breadcrumbs are always treated as secondary and should never entirely replace the primary navigation."
  - USWDS Breadcrumb: "Use breadcrumbs for hierarchical relationships, not linear relationships (like individual steps in a multi-step process).", "Omit breadcrumbs on the homepage of a site. Breadcrumbs could also be omitted from section landing pages." and "Start with the word “Home”."
- **Disagreement, recorded:**
  - Where the trail ends. GOV.UK ends it with the parent. Primer and USWDS end it with the current page, which carries `aria-current`. Either passes.
  - Path-based breadcrumbs. Carbon accepts them: "These show the actual steps the user took to get to the current page, rather than reflecting the site’s information architecture." GOV.UK and USWDS rule out breadcrumbs for steps, and this viewpoint follows them.
- **Number introduced:** "at least two ancestor links" is uxcli's reading of Carbon's "more than two levels". It is labelled in `exceptions`.
- **Verified:** substring match against the GOV.UK, Carbon and USWDS raw files.

### navigation.back-link-goes-one-step-back
- **Source:** GOV.UK Design System, Back link, https://design-system.service.gov.uk/components/back-link/
- **Raw file:** `src/components/back-link/index.md`
- **Quote:** "Make sure the link takes users to the previous page they were on, in the state they last saw it."
- **Supporting:**
  - Same file: "Although browsers have a back button, some sites break when you use it - so many users avoid it, instead of losing their progress in a service."
  - Same file: "Never use the back link component together with the Breadcrumbs component." In the source, "Breadcrumbs component" is a Markdown link.
  - Same file: "For more complex user journeys, consider using different link text, like 'Go back to [page]'." and "If this is not possible, you should hide the back link when JavaScript is not available."
  - GOV.UK Navigate a service: "If your service does have a clear end-to-end journey, avoid using navigation links."
  - GOV.UK Pagination: "Do not use this Pagination component for linear journeys"
- **Number introduced:** none ("step n ≥ 2" only says the rule starts at the second step).
- **Verified:** substring match against `back-link/index.md`, `navigate-a-service/index.md` and `pagination/index.md`.

### navigation.skip-link-is-the-first-tab-stop
- **Source:** GOV.UK Design System, Skip link, https://design-system.service.gov.uk/components/skip-link/
- **Raw file:** `src/components/skip-link/index.md`
- **Quote:** "Including the skip link component gives users the option to bypass the top-level navigation links and jump to the main content on a page."
- **Supporting:**
  - Same file: "All GOV.UK pages must include a skip link.", "The skip link component is visually hidden until a keyboard press activates it." and "Do not wrap the skip link in a `<nav>` region, or move it inside the header."
  - Carbon UI shell header (an image caption): "The "Skip to main content link" is the first focusable element on the Carbon website."
  - WCAG 2.4.1 Bypass Blocks: "Provide a means of skipping repeating content." The exception comes from the same file: "if a set of navigation links is provided at the bottom of a web page providing a "skip" link may be unnecessary."
- **Note:** WCAG 2.4.1 can be met in other ways, for example with landmarks or headings. The first-Tab-stop measure follows GOV.UK and Carbon practice and is stricter than the criterion. The `exceptions` say so.
- **Verified:** substring match against `skip-link/index.md`, Carbon `UI-shell-header/usage.mdx` and `bypass-blocks.html`.

### navigation.more-than-one-way-to-a-page
- **Source:** W3C WAI, Understanding SC 2.4.5 Multiple Ways, https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html
- **Raw file:** `w3c/wcag` `understanding/20/multiple-ways.html`
- **Quote:** "Provide at least two options for reaching the same content." (the "In brief" box)
- **Supporting:**
  - Same file: "Users with visual impairments may find it easier to navigate to the correct part of the site by using a search, rather than scrolling through a large navigation bar using a screen magnifier or screen reader."
  - Same file, small-site exception: "For a three or four page site, with all pages linked from the home page, it may be sufficient simply to provide links from and to the home page where the links on the home page can also serve as a site map."
  - Same file, example heading: "Where content is a result of a process or task".
  - GOV.UK Navigate a service: "To help users understand what the search input will cover, include ‘Search [your service]’ as placeholder text within the search input."
- **Number introduced:** "larger than a handful" of pages is uxcli's threshold. WCAG gives no site size, and this is labelled in `exceptions`. The "three or four page site" figure is WCAG's own.
- **Verified:** substring match against `multiple-ways.html` and `navigate-a-service/index.md`.

### navigation.same-navigation-on-every-page
- **Source:** W3C WAI, Understanding SC 3.2.3 Consistent Navigation, https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html
- **Raw file:** `understanding/20/consistent-navigation.html`
- **Quote:** "Consistently order navigation that repeats across multiple pages." (the "In brief" box)
- **Supporting:**
  - WCAG 3.2.4 Consistent Identification: "Consistently identify components that have the same functionality throughout a set of web pages."
  - Same file: "recurring components such as global navigation links, search controls, account controls, or footer links are encountered repeatedly across a set of web pages".
  - Same file, the context exception: "a navigation link identified as "Page 4" on one page may appropriately be identified as "Previous page" when viewed from page 5."
  - WCAG 3.2.3: "Users may initiate a change in the order by using adaptive user agents or by setting preferences".
  - Carbon UI shell header: "The switcher should always be positioned as the furthest right icon. This ensures the icon does not shift when navigating across systems."
- **Overlap:** `writing.one-label-per-action` covers labels in general, and `canon.vignelli-syntactic-consistency` covers layout in general. This viewpoint is the navigation-specific case that WCAG 3.2.3 and 3.2.4 name. They are linked in `agrees`.
- **Number introduced:** "three or more pages" is a sample size for the measure, not a rule. Comparing bounding boxes at one viewport is uxcli's test and is labelled in `exceptions`.
- **Verified:** substring match against `consistent-navigation.html`, `consistent-identification.html` and Carbon `UI-shell-header/usage.mdx`.

### navigation.top-level-is-sections-not-a-site-map
- **Source:** GOV.UK Design System, Help users navigate a service, https://design-system.service.gov.uk/patterns/navigate-a-service/
- **Raw file:** `src/patterns/navigate-a-service/index.md`
- **Quote:** "Navigation is not a site map and does not need to list every part of your service."
- **Supporting:**
  - Same file: "Links within your service must go to the most important top-level sections that are the most useful to the user."
  - Same file, on external links: they should "be grouped together, and shown after links within your service".
  - Same file: "If your service does have a clear end-to-end journey, avoid using navigation links."
  - Primer Navigation: "Minimize the number of navigational elements while ensuring that the most essential items are available."
  - Carbon UI shell header: "Header links should be unique and clearly describe the content and location that it will link to."
- **Measure:** a question. No source gives a maximum number of items, and choosing which items are "the most useful to the user" is a judgement against the actor. It cannot be a count.
- **Verified:** substring match against `navigate-a-service/index.md`, Primer `navigation.mdx` and Carbon `UI-shell-header/usage.mdx`.

### navigation.tabs-switch-views-in-one-context
- **Source:** GitHub Primer, Navigation (UI pattern), section "Tabs", https://primer.style/product/ui-patterns/navigation/
- **Raw file:** `primer/design` `content/ui-patterns/navigation.mdx`
- **Quote:** "Activating a tab may or may not change the URL, but you can't mix tabs that change the URL with tabs just switch the visible tab panel." This is verbatim, including the source's missing "that".
- **Supporting:**
  - Same file: "Tabs go directly above the content they affect."
  - Primer Underline nav: "One of the tabs should be selected by default when the user loads the page.", "Views should be able to be navigated in any order. This is not a pattern for navigating stepped flows." and "Avoid more than 2 levels of tab hierarchy."
  - Polaris Tabs: "Only be active one at a time."
  - GOV.UK Tabs: "For this reason, do not use the tabs component as a form of page navigation." and "Tabs hide content from users and not everyone will notice them or understand how they work."
  - GOV.UK Tabs, no-JavaScript fallback: "When JavaScript is not available, users will see the tabbed content on a single page, in order from first to last, with a table of contents that links to each of the sections."
- **Disagreement, recorded rather than resolved:** the sources differ on filtered views of one list.
  - Polaris: tabs should "Represent the same kind of content, such as a list-view with different filters applied. Don’t use tabs to group content that is dissimilar."
  - Carbon: "When toggling between different formats of the same content or filtering the same content, use content switcher".
  - Primer Underline nav: "Each tab panel should have discrete content with a unique URL, not just different formats to view the same content."
  
  The measure checks only what all four sources agree on: one tab selected, one kind of tab per set, tabs above their panel, and no more than two levels.
- **Number introduced:** none. The two-level limit is Primer's.
- **Verified:** substring match against Primer `navigation.mdx` and `underline-nav.mdx`, Polaris `tabs.mdx`, Carbon `tabs/usage.mdx` and GOV.UK `tabs/index.md`.

### navigation.pagination-says-where-and-how-many
- **Source:** USWDS, Pagination, https://designsystem.digital.gov/components/pagination/
- **Raw file:** `_components/pagination/guidance/usability.md`
- **Quote:** "Show the size of the paginated set. Users want to know the length of a paginated section."
- **Supporting:**
  - Same file: "Highlight the current page. Pagination shows the current page the user is on in relation to the entire collection of pages."
  - Same file: "The USWDS Pagination component will always show the last page of the set as a navigable link, or show an ellipsis at the end of the links if the set is unbounded."
  - Same file: "indicate the missing pages with an indicator like a non-selectable ellipsis." and "Don't split the navigation items over multiple lines."
  - GOV.UK Pagination: "Show the page number in the page `<title>` so that screen reader users know they’ve navigated to a different page. For example, 'Search results (page 1 of 4)'."
  - GOV.UK Pagination: "Do not show the previous page link on the first page – and do not show the next page link on the last page." and "Do not show pagination if there's only one page of content."
  - GOV.UK Pagination, on infinite scroll: "Avoid using the 'infinite scroll' technique to automatically load content when the user approaches the bottom of the page. This causes problems for keyboard users."
  - GOV.UK Pagination, on split content: "Use the 'block' style of pagination to let users navigate through related content that has been split across multiple pages."
  - Primer Navigation: "pagination should go directly below the collection it navigates."
- **Number introduced:** none.
- **Verified:** substring match against USWDS `pagination/guidance/usability.md`, GOV.UK `pagination/index.md` and Primer `navigation.mdx`.

### navigation.primary-nav-visible-on-wide-screens
- **Source:** GitHub Primer, Navigation (UI pattern), section "Responsive sidebar navigation patterns", https://primer.style/product/ui-patterns/navigation/
- **Raw file:** `content/ui-patterns/navigation.mdx`
- **Quote:** "On wide viewports, the sidebar is always visible."
- **Supporting:**
  - Carbon UI shell header: "As a header scales down to fit smaller screen sizes, header links and menus should collapse into a left-panel hamburger menu."
  - Carbon, same file: "These links move to the side menu in narrow screen widths." and "hamburger menu is only needed when there is a collapsable left navigation." (the source spells it "collapsable").
- **Number introduced:** the 1280 px and 375 px test widths are uxcli's. Neither source names a breakpoint, and this is labelled in `exceptions`.
- **Verified:** substring match against Primer `navigation.mdx` and Carbon `UI-shell-header/usage.mdx`.

## Dropped

- Polaris Navigation: its page is deprecated, so it was not used.
- USWDS Header usability guidance: the raw files were empty.
- A separate "labels in the user's words" viewpoint: it duplicates `usability.speak-the-users-language`.
- A separate "link text matches the page heading" viewpoint: it was folded into `navigation.you-are-here`, to keep the pool at ten and because both answer "where am I".
