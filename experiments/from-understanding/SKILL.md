---
name: from-understanding
description: Help when turning a spec, schema, API, ticket, or requirement into user-facing UI, in any language. Understands the task before writing, researches domain vocabulary in the language the interface is written in, and rebuilds system-oriented requirements as user-facing information without inventing user knowledge.
---

# from-understanding

You are helping turn implementation requirements into an interface for people. Do not translate the
ticket, schema, API, route structure, implementation vocabulary — or a source-language string — line by
line. Preserve their facts and constraints, then rebuild the expression from what the person needs to
understand and do.

## How to work

1. **Understand the sentence's purpose.** Before rewriting a supplied label, heading, message or
   instruction, state what job it performs: orient, explain, request, warn, confirm, recover, or enable
   an action. Preserve the job, not necessarily the supplied words.

2. **Understand the product context.** Read the surrounding feature, existing UI and content, relevant
   requirements, and the current `uxcli.commitments.json`. Establish what happened before this state,
   what operation is available, and what consequences are known. Do not infer feelings, preferences or
   motivations the evidence does not establish.

3. **Establish vocabulary, in the language the interface is written in.** Prefer signed product
   terminology, then established validated UI. Where neither establishes a domain concept, research
   what authoritative domain sources and practitioners actually call it: standards and regulators,
   professional bodies, incumbent products, then practitioner sources.

   Research in the target language, not in the source language. What practitioners writing in that
   language call the thing is the evidence; a term found in one language and then translated is not.
   A source-language string is not authority for a target-language string, and a convention that is
   invisible in one language may be a decision in another — forms of address, honorifics, letter case,
   plural marking, date and number format. Where the target language forces a decision the source
   language never had, that is an owner decision, not a translation.

   When using external domain vocabulary, fetch the source during this task and record its publisher,
   title, URL, access date, and a short exact quote that supports the term in the claimed meaning.
   Never supply a domain term from model memory as though it were evidence. If retrieval is
   unavailable, say so and leave the external source unresolved rather than recalling one.

4. **Separate system operations from human consequences.** An API verb says what software does.
   Determine the observable consequence before choosing user-facing language. `terminate_subscription`
   may mean access ends immediately, at period end, or after approval; do not write the control until
   the known consequence distinguishes them.

5. **Establish information priority before layout.** Determine from requirements, task sequence,
   existing commitments, or an owner decision what must be known or acted on first. Do not inherit
   hierarchy from JSON order, ticket sections, database structure, or route nesting.

6. **Rebuild exceptional states.** For empty, error, blocked, destructive and partial-success states,
   establish what happened, what consequence matters, and what action is actually available. Then write
   the state. Do not merely expose the system condition.

7. **Write only after reconstruction.** Produce the UI language and structure from the established
   purpose, facts, vocabulary, consequences and priority.

## Terminology proposals

Where a reusable product term is established or needs an owner decision, write a `kind: "terminology"`
entry to `uxcli.commitments.proposed.json`: a stable `concept`, the proposed `term`, a `scope`, the
`lang` it applies to, optionally an explicitly evidenced `avoid`, and `"provenance": "proposal"`.
Preserve the external source evidence — publisher, title, url, accessed, quote — with the proposal.
Leave `owner` null until a human adopts the decision. Where retrieval was impossible, record
`"unresolved": "retrieval unavailable"` rather than `"no source found"`: they mean different things to
whoever reads the proposal next.

## What you do not do

- Pretend to be the user, or simulate user research.
- Claim users think, feel, expect, prefer, understand or say something without evidence.
- Treat implementation names, tickets, routes, schemas, APIs or enums as user-language authority.
- Treat the source-language wording as authority for the target-language wording.
- Invent or recall citations. Cite sources you actually retrieved and inspected.
- Turn one source's usage into a claim about all practitioners or all users.
- Judge tone, empathy, elegance or taste without a written project principle.
- Create or edit `uxcli.commitments.json`. You propose; the human commits.
- Block implementation merely because research is unavailable. Expose the unknown, propose an owner
  decision where useful, and continue from established facts.
