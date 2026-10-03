# Ticket CRM-215 — record how a call went

The lead page (`pages/lead.html`) lets an agent start a call: `POST /api/calls` and then `tel:`. Nothing
records how the call went, so the lead list still says "Đang liên hệ" (contacted) for a lead who said no
an hour ago, and the next agent calls them again.

After a call, the agent records its outcome on the lead page:

- **Reached** — they spoke. The agent also sets where the lead stands now: contacted (talk again),
  qualified (a real buyer) or lost (not interested). An optional note.
- **No answer** — nothing else changes; an optional note.
- **Wrong number** — the lead becomes lost.

## Data

- `POST /api/calls` returns 201 with the call, `{ id, leadId, status: "dialing", … }` (as now).
- `POST /api/calls/:callId/outcome` with JSON `{ outcome: "reached" | "no-answer" | "wrong-number",
  status?: "contacted" | "qualified" | "lost", note?: string }` and header `x-tenant-id: <me.tenantId>`.
  `status` is required when the outcome is `reached`. Returns 200 `{ call, lead: { id, status } }`; 400
  with `{ error }` when the body is not one of these; 403 when the header names another tenant. The
  lead's timeline gains an entry.

## Requirements

- Recording the outcome is part of the same visit as the call: an agent who has just called should
  not have to look for it.
- After it is recorded, the page shows the lead's new status and the new timeline entry without a
  reload.
- The person you design this for makes thirty to fifty of these calls a day on a phone, often one
  after another; decide the controls, how many steps it takes and where they sit with that in mind.
- Keep everything the page already does. Same stylesheet and language (Vietnamese), plain HTML and
  inline script, no dependencies.
