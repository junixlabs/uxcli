# Ticket CRM-214 — lead detail page

Add the page served at `GET /leads/:id` (the server already routes it to `pages/lead.html`; the file is missing).

## Data

- Session: the page sends `Authorization: Bearer <localStorage["session.token"]>` on every API call. `GET /api/me` returns `{ id, name, tenantId, workspaceId, permissions }`; a 401 means redirect to `/login`.
- `GET /api/leads/:id` returns the lead: `{ id, name, phone (E.164, e.g. +84901234567), email, status (new|contacted|qualified|lost), source, createdAt, assignedTo, requirements { type, area, budget, size, bedrooms, timeline, purpose, legal }, timeline [{ at, kind, text }], note, internalScore, suggestions [{ code, title, price, size, status, match }] }`. 404 when the lead is not in the caller's tenant.
- `POST /api/calls` with JSON `{ leadId }` and header `x-tenant-id: <me.tenantId>` returns 201 `{ call }`; 400 without the header, 403 when the header names another tenant.

## Requirements

- Show the lead's contact details, requirements, interaction timeline, internal note and score, and the suggested listings.
- A call button that POSTs to `/api/calls` and then opens `tel:<phone>`; show the call status on the page.
- A control to change the lead's status (the API for that is out of scope; wire the control, leave the request as a TODO).
- A link back to the workspace list.
- Use the existing stylesheet `/assets/app.css` (classes: `topbar`, `wrap`, `brand`, `card`, `btn`, `btn primary`, `btn ghost`, `badge`, `kv`, `timeline`, `listings`, `alert`, `progress`, `input`, `field`, `muted`, `small`). Interface language: Vietnamese, like the other pages in `pages/`.
- Plain HTML + inline script, no build step, no dependencies — like `pages/workspace.html` and `pages/login.html`.
