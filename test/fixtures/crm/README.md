# Fixture CRM — sản phẩm mục tiêu của lát cắt dọc uxcli

Một CRM nhỏ cho môi giới bất động sản: đăng nhập → danh sách lead → chi tiết lead → gọi khách. Node thuần, không dependency, dữ liệu trong RAM, mỗi record mang `tenantId`. Có lỗi cài sẵn — đọc `DEFECTS.md` trước khi "sửa" bất kỳ điều gì.

## Chạy

```sh
node test/fixtures/crm/server.mjs 3000        # cổng cố định
node test/fixtures/crm/server.mjs             # cổng ngẫu nhiên (hoặc CRM_PORT=…)
# stdout in đúng một dòng khi sẵn sàng:  {"port":3000}
# stderr: một dòng mỗi request  METHOD PATH STATUS ms
```

Dừng bằng SIGINT/SIGTERM (Ctrl-C hoặc `kill <pid>`). Không có file nào được ghi ra đĩa; khởi động lại là về dữ liệu seed.

Từ test: spawn `node server.mjs 0`, đọc dòng JSON đầu trên stdout để lấy `port`, `kill` khi xong.

## Tài khoản seed (tenant `t_demo`, workspace `ws_demo`)

| Email | Mật khẩu | Quyền |
|---|---|---|
| `agent@example.invalid` | `matkhau123` | `agent` |
| `manager@example.invalid` | `matkhau123` | `agent, manager` |

6 lead seed `ld_0001`…`ld_0006`; `ld_0001` là lead mới, chưa ai nhận, số `+84901234567` (hiển thị `0901 234 567`).

## Trang và hook `data-uxcli`

| URL | Hook |
|---|---|
| `/login` | `[data-uxcli=login-form]`, `input[name=email]`, `input[name=password]`, `[data-uxcli=login-submit]`, `[role=alert][data-uxcli=login-alert]` |
| `/workspace/:id` | `[data-uxcli=lead-board][data-view=list]`, `[data-uxcli=lead-list]`, `[data-uxcli=lead-row][data-id=…]`, `[role=progressbar]` khi tải |
| `/leads/:id` | `[data-uxcli=lead-phone]`, `[data-uxcli=call-action]`, `[data-uxcli=call-status]` (ẩn cho tới khi gọi; hiện "Đang gọi…"), `[data-uxcli=back-to-list]`, `[role=progressbar]` khi tải |

Phiên: cookie `crm_session` (HttpOnly) **và** `localStorage["session.token"]` (trang gửi `Authorization: Bearer`). `/` chuyển hướng về `/login` hoặc workspace của phiên.

## API

| Method & path | Trả về |
|---|---|
| `POST /api/login` `{email,password}` | 200 `{workspaceId, token, user:{id,email,name,permissions,tenantId}}` + Set-Cookie · 401 `{error:"Email hoặc mật khẩu không đúng"}` |
| `POST /api/logout` | 204 |
| `GET /api/me` | 200 `{id,email,name,permissions,tenantId,workspaceId,tenant}` · 401 |
| `GET /api/leads` | 200 `{leads[], users[], responseSlaMinutes}` của tenant phiên |
| `GET /api/leads/:id` | 200 `{id,status,phone:"+84…",assignedTo,internalScore,…}` · 404 nếu khác tenant |
| `POST /api/calls` `{leadId}` | **cần header `x-tenant-id`**: 201 `{id,tenantId,leadId,to,status:"dialing"}` · 400 thiếu · 403 sai tenant |
| `GET /api/calls` | 200 `{calls[]}` |
| `GET /api/health` | 200 `{ok,tenants,leads}` |
| `POST /api/provision/agents` `{ttlHours?}` | 201 `{user:{id,email,password,permissions:["agent"]}, tenant:{id:"t_uxcli_…",workspaceId}, expiresAt}` |
| `GET/DELETE /api/provision/agents/:userId` | 200 · 404 — DELETE xoá user, tenant và mọi lead/call/session của tenant |
| `POST /api/provision/leads` `{tenantId,status?,createdMinutesAgo?,phone?}` | 201 `{lead:{id,phone,status,assignedTo,tenantId,createdAt}}` |
| `GET/DELETE /api/provision/leads/:id` | 200 · 404 |

## Script provisioner (`scripts/`, POSIX sh + curl, không jq)

Đích: `$UXCLI_TARGET`, nếu không thì `http://localhost:$CRM_PORT`, nếu không thì `http://localhost:3000`.

```sh
export UXCLI_TARGET=http://localhost:3000
P=$(test/fixtures/crm/scripts/provision-agent.sh)                 # {"user":{"id",…,"permissions":["agent"]},"tenant":{"id":"t_uxcli_…"},"expiresAt":"…"}
T=$(printf '%s' "$P" | sed -n 's/.*"tenant":{"id":"\([^"]*\)".*/\1/p')
L=$(test/fixtures/crm/scripts/seed-lead.sh --tenant "$T" --status new --createdMinutesAgo 10)   # {"lead":{"id","phone",…}}
printf '%s' "$L" | test/fixtures/crm/scripts/delete-lead.sh      # hoặc: delete-lead.sh <leadId>
printf '%s' "$P" | test/fixtures/crm/scripts/delete-agent.sh     # hoặc: delete-agent.sh <userId>
```

`seed-lead.sh` nhận `--tenant` (hoặc `$UXCLI_TENANT_ID`), `--status`, `--createdMinutesAgo` (0…1440), `--phone`. Script xoá GET lại record sau khi DELETE và **exit 1 nếu vẫn còn**; exit 2 khi thiếu tham số.

## Smoke test bằng curl

```sh
T=http://localhost:3000
curl -s $T/api/health
curl -s -i -X POST $T/api/login -H 'content-type: application/json' -d '{"email":"agent@example.invalid","password":"sai"}' | head -1      # 401
curl -s -c cj -X POST $T/api/login -H 'content-type: application/json' -d '{"email":"agent@example.invalid","password":"matkhau123"}'
curl -s -b cj $T/api/me
curl -s -b cj $T/api/leads/ld_0001
curl -s -b cj -X POST $T/api/calls -H 'content-type: application/json' -d '{"leadId":"ld_0001"}'                            # 400 thiếu x-tenant-id
curl -s -b cj -X POST $T/api/calls -H 'content-type: application/json' -H 'x-tenant-id: t_demo' -d '{"leadId":"ld_0001"}'   # 201
```

## Kiểm tra lỗi cài sẵn trong Chrome thật

```sh
node test/fixtures/crm/check.mjs http://localhost:3000
```

16 kiểm tra: hook và state ở 390×844 / 768×1024 / 1440×900, nút gọi dưới fold chỉ ở 390, header tenant trên `POST /api/calls`, hai nhánh hồi phục đăng nhập (401 giữ email, 500 xoá email). Đặt `SHOT_DIR=…` để lưu ảnh.

## `.uxcli/` của fixture

A copy of the **authored** files in `examples/crm/.uxcli/` (project, understanding, journeys, commitments, profiles, policy, probes, corpus) and `domain/leads-policy.json`; the profiles' provisioners point at `test/fixtures/crm/scripts/*.sh`. `runs/` and `index.json` are not copied (see `.gitignore`); `proposals/` are. `policy.environments.local.origin` stays `http://localhost:3000` — the real port is read by the runner at run time.
