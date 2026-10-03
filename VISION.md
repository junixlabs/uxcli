# UXCLI

**A coding agent should design like a designer who did the research, and prove the experience works
by walking it.**

## The agent is now the designer

Most new interface code is written by coding agents. They are fast and fluent, and they design from
what they assume: about the field they are building for, about the people who will use it, about what
good looks like. The result is plausible and generic. It uses the database's words instead of the
user's, and it is declared done by the same agent that made it, after a glance at a screenshot.

A human designer does three things an agent skips. They **learn the field** before they draw — its
vocabulary, its rules, what its people do all day and what goes wrong for them. They **design from
principles somebody tested** — not taste, but what research, design systems and decades of practice
have shown to work for this kind of screen. And they **watch someone use it** — walk the journey, see
where people hesitate, lose their place, or have to type something twice.

uxcli gives an agent those three habits, as files it reads and an instrument it runs.

## Four pillars

**1. Knowledge — a library the agent can cite.** Rules from named designers, design systems and
studies, each with its author, its page and its exact words, packaged by the kind of UI it applies to
(marketing, content, data, workspace, shop, transaction) and by topic (colour, writing, data display,
forms, navigation, motion and feedback). Templates for kinds of product — a B2B workspace, a shop, a product site, docs, a mobile app — that say which
screens such products have, which lens each is read against, which journeys to walk first, and what
research has to answer. A rule without a source does not ship; every rule says how it is checked.

**2. Process — research, then design, then build.** The agent starts from a user story or a journey,
researches the field from sources in a fixed order of trust, writes what it learned as insights with
evidence and what it could not learn as open questions, draws two or three variants to the lens for
each screen, and builds the one a person picks. `context show` prints all of it before the agent draws.

**3. Evidence and versions — one shape for what was seen.** Every walk of a journey leaves screenshots,
the trace of what was done, and the places that went wrong, highlighted on the frame. A proposal for a
new version of a screen points at the evidence that caused it. Versions are kept and compared along
the flow, step by step, so "better" is something you can see.

**4. Experience validation — the centre.** Checking that a page is technically sound is the easy part
and is solved elsewhere. uxcli's question is whether the person can do what they came to do: how many
steps it takes against the shortest path, how long a practised user would need, whether every action
answers within a second, whether data typed on one step is still there on the next, whether an error
can be recovered without starting over, whether the screens agree with each other. These come from the
trace of a real walk in real Chrome, with methods HCI has used for decades — task efficiency, the
keystroke-level model, Nielsen's response-time limits, cognitive walkthrough.

## Why it can be trusted

A review tool that is wrong three times is switched off forever. So uxcli keeps a line between what it
measured and what it believes.

- **Measured, and proven able to fail, may block.** A check ships with a case where it must fail and a
  twin where it must pass, and blocks only after it has run on pages it was never tuned on with no
  false fails. `uxcli gate` holds every such pair on every push.
- **Believed, may only inform.** A designer's rule, a walkthrough answer, a simulated persona's
  hesitation: each is reported as a finding with its source, never as a pass and never as a block.
- **The agent does not get to say done with a failure in hand.** Exit 0 means the checks that ran found
  no fail. The card says what ran and what it did not look at.
- **Nothing unsourced is presented as knowledge.** A quote is fetched and verbatim, or it is not a quote.
  An unknown about the user stays a question until a source answers it.

## Who uses it

The person operating a coding agent on a product with an interface, and the agent itself. The agent
reads the library and the context before it designs, walks the journey after it builds, and reports
what the walk showed. The person picks between variants, answers the questions research could not,
and decides what the product commits to.

## What it is not

A UI generator — there are many, and uxcli works beside any of them. A score — there is no 0–100 for an
experience. A replacement for watching real people — it finds what a careful designer would find
walking the flow, and says plainly that it did not watch anyone.

## Where it stands

| Axis | Evidence | Verdict |
|---|---|---|
| Page checks | focus-visible 7/7 W3C ACT, 22 GOV.UK pages 0 false fails; text-spacing 62/62; axe contrast 0 FP. Definitions frozen and hashed, then 20 unseen pages on 5 sites: 0 false fails. | Confirmed for three checks |
| Flow checks | Three flow probes written from the WCAG text before any fixture existed. Seeded fixture: 3/3 caught, silent on the clean twin. 10 flows on 4 real apps never seen: 0 false fails; one real 3.3.7 defect found by hand that the probe did not see. | Measured on fixtures; unproven at scale |
| Context before design | Same ticket, ten fresh sessions per arm, scored by `uxcli run` on the page each wrote. Ticket alone: 0 of 10. Ticket + the journey file: 5 of 10. Ticket + `uxcli context show`: 10 of 10. The installed skill with nothing inline: 10 of 10. 2026-09-28. | One model, one fixture, one ticket |
| Saying done | 40 fresh sessions on a seeded fixture, 20 running the tool: 0 said done while a check still failed. Re-measured with the shipped skill: 10 of 10 ran uxcli, 0 of 10 said done holding a fail. | One model, one fixture |
| Library | Lenses: 123 viewpoints from four schools of designers; six topic pools (colour, writing, data display, forms, navigation, motion and feedback); templates for five kinds of product. Every quote fetched and verbatim. | Built; whether it changes what agents draw is unmeasured |
| Experience metrics | Built: steps, typing, scrolls, first visible change, a keystroke-level estimate, recovery after an error, consistency; walkthroughs. Scored on the walk, three sessions an arm: ticket alone 0/3 with the call step unreached on every page; with the skill 3/3 and no finding on the page the agent wrote. 2026-10-03. | Three sessions an arm, one ticket: a direction, not a result |

**The part worth building is the part not yet proven.**
