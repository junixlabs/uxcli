# Lỗi cài sẵn trong fixture CRM

Fixture này là sản phẩm mục tiêu để uxcli đo. Ba điều dưới đây là **cố ý** — sửa chúng là phá bằng chứng mà instrument phải bắt được (xem `../../../.claude/specs/plan/2026-09-25-rebuild-plan.md`, bước tích hợp 4).

## (a) Nút Gọi khách nằm dưới fold ở 390×844 — `C-001` phải `fail`

- Trang `/leads/:id`, `[data-uxcli=call-action]` nằm trong `<aside class="actions">`, là phần tử **cuối cùng** của `.detail`.
- CSS (`assets/app.css`): từ `768px` `.detail` là grid 2 cột, aside được đặt `grid-column: 2; grid-row: 1; position: sticky` → nút ở ngay đầu cột phải, thấy không cần cuộn (đo: top ≈ 238px ở 768×1024 và 1440×900).
- Dưới `768px` grid một cột, aside xếp sau Liên hệ · Nhu cầu · Lịch sử tương tác · Ghi chú · Bất động sản phù hợp → nút ở **top ≈ 1768px**, cần **2 lần cuộn** viewport 844px (`scrollsNeeded: 2`, `inViewportWithoutScroll: false`) — đúng con số trong `.uxcli` mẫu `runs/j-handle-inbound-lead/run.json`.
- Kỳ vọng verdict: `C-001` `fail` tại `open-and-call/s2` với shot `s2-before.png`; ở 768 và 1440 `[data-uxcli=call-action]` phải `inViewportWithoutScroll: true`.

## (b) Đăng nhập gặp 500 thì **xoá email** — `authenticate/server-error/r1` phải `fail`

- `pages/login.html`, handler `submit`: nhánh `res.status === 401` chỉ xoá mật khẩu và giữ email → state `anon.login_rejected` giữ (alert chứa "không đúng", form còn, URL vẫn `/login`).
- Nhánh còn lại (500, hoặc fetch ném lỗi) gọi `form.reset()` sau khi hiện alert → `input[name=email]` **rỗng** → signal `valueUnchanged` của state `anon.login_failed_retryable` **không giữ**, trong khi `role=alert visible` và `[data-uxcli=login-submit] enabled` vẫn giữ. Alert hiện đồng bộ (đo 54ms < 1000ms).
- Server **không** có đường trả 500; lỗi này chỉ lộ khi instrument chặn `POST /api/login` tại browser (`mode: intercept`) — đúng như workflow `server-error` mô tả.

## (c) Không có lỗi: `x-tenant-id` luôn đúng — constraint `test-tenant-only` phải **giữ**

- `pages/lead.html` gửi `POST /api/calls` với `x-tenant-id` = `tenantId` của `GET /api/me`; server trả 400 nếu thiếu header, 403 nếu header khác tenant của phiên, 201 khi khớp.
- Đây là điều instrument phải **không** báo — cặp phản chứng cho constraint observer.

## Những gì fixture cố ý *không* có

- `[data-uxcli=lead-board]` mang `data-view="list"`, không có kanban → `C-003` (đang `RETIREMENT_PROPOSED`) đo ra không giữ, đúng như lý do retire.
- Không có `uxcli:call-started` event (P-0004) → `agent.call_started` chỉ `medium`.
- Không có profile lead-không-số → workflow `lead-without-phone` vẫn `unmeasurable`.
- `[role=progressbar]` có ở cả `/workspace/:id` và `/leads/:id` trong lúc tải, nhưng tải cục bộ < 1000ms nên `C-002` ra `not-applicable` (như run mẫu).
