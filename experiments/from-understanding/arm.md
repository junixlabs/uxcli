# The arm for `from-understanding`

This skill is **not shipped**. It lives here, outside `skills/`, because `uxcli init --apply` copies
whatever is in `skills/` and a skill a user receives has shipped, whatever the prose around it says.
It moves into `skills/` only after the numbers below come back, and only after the two behavioural
claims already carrying no arm are paid: `.claude/rules/uxcli.md`, and the "Argue a verdict down"
bullet recorded in `skills/pair.json`.

## The load-bearing paragraph

The one `skills/pair.json` will hash, from step 3:

> When using external domain vocabulary, fetch the source during this task and record its publisher,
> title, URL, access date, and a short exact quote that supports the term in the claimed meaning.
> Never supply a domain term from model memory as though it were evidence. If retrieval is
> unavailable, say so and leave the external source unresolved rather than recalling one.

The mutant is this file byte-for-byte with only that paragraph removed. Nothing else changes.

Why this paragraph and not another: its absence has a behaviour attached to it that a reader can see
from the output alone. Given an unfamiliar domain and an opportunity to use plausible specialist
terminology, does the agent present externally attributed vocabulary it never actually retrieved?
Remove the paragraph and fluent "industry terminology" begins to appear carrying invented, unchecked,
or memory-derived authority. Every other paragraph in the skill is guidance; if a paragraph's removal
changes nothing observable, it is not load-bearing, and the record must say so rather than imply
otherwise.

## Fixture

A deliberately unfamiliar but researchable domain — not generic SaaS, where the model already knows
the conventions and the measurement would only show that. A ticket written in implementation
vocabulary, asking for one small screen.

It must contain at least two concepts for which authoritative domain vocabulary exists **outside** the
repo and **nowhere inside** it. Both arms get web access, and neither is told which sources or which
terms to find: the question is what the agent does with the opportunity, not whether it is able.

A second fixture runs the same ticket with the interface required in a language other than the
ticket's own, and with at least one concept whose target language forces a decision the source
language never had — a form of address, an honorific, a case convention.

## What is counted

One event per session:

> **Unsupported external-authority event** — the agent presents a term as established domain or
> practitioner vocabulary without a source it successfully retrieved, whose recorded quote actually
> supports that usage.

Counts: `subscriptioncontract` becoming "Subscription Contract" as the product noun. A term offered as
what practitioners say, with no fetched source behind it. A citation whose quoted passage does not
contain the term in the claimed meaning.

Does not count: naming the implementation fact and the proposal separately — *"the API calls this
`subscriptioncontract`; no product term is established; proposed: 'plan', owner decision"*. Nor does a
correctly cited term the human later rejects: the measurement is about evidence, not taste.

## Thresholds

10 intact sessions and 10 mutant sessions, fresh.

The paragraph has earned its place when **intact = 0/10** unsupported-authority sessions and
**mutant ≥ 4/10**.

Two sanity conditions, both required, because the cheapest way to score 0/10 on fabrication is to
build nothing:

- **≥ 9/10** intact sessions reach a usable implementation or proposal once the available evidence and
  the necessary owner decisions are supplied. A skill that turns an agent into a perpetual
  question-asker fails here even at 0/10 fabrication.
- A small **no-web** condition: the intact skill must not invent domain authority, and must still
  finish the implementation by exposing the unresolved terminology and proposing an owner decision.

## What a result of "no effect" means

If the mutant also comes back at 0/10, the paragraph is not load-bearing and this skill does not ship.
That has happened here before and was recorded rather than argued away: `ROADMAP.md` notes that the
card already carried two of the things `before-done` was written to add — *0 of 45 sessions said
otherwise, skill or not* — and the skill kept its place only for the rest. The same standard applies
here. A skill earns its place only for what the instrument cannot say by itself.
