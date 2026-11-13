# 02 — Use cases

ไม่มี user login ใน server นี้: actor คือ process ที่ต่อ stdio (AI agent ใน session ของ owner) ซึ่งได้รับ env/token ของ owner จาก launcher.
"ระดับสิทธิ์" ที่เห็นในโค้ดคือ automation token ที่แต่ละ tool ใช้เรียก API ปลายทาง:
- `legacy-mcp` — tasks tools, goals, skills, dashboard (`src/tools/tasks.ts`, `goals.ts`, `skills.ts`, `dashboard.ts`)
- `dashboard-api` — `list_task_types` (`src/tools/customization.ts`)
- CRM owner token (`EMPIRE_CRM_LEDGER_TOKEN` หรือ `~/.config/solo-crm/income.token`) — revenue และ revenue ส่วนของ dashboard (`src/crm-ledger.ts`)
- ไม่มี token (local subprocess / file read) — decisions, analytics, health, freshness, bookmarks, images, SEO, delivery context, email accounts

```mermaid
flowchart LR
    Agent(["AI agent in owner session"])
    Launcher(["Hub launcher harness_mcp.py"])
    Owner(["Owner (via agent, gives confirm=true)"])

    subgraph Tasks["Tasks (token legacy-mcp)"]
        UC1["list_tasks"]
        UC2["create_task (reuse_open)"]
        UC3["update_task / complete_task"]
        UC4["delete_task = archive"]
        UC5["task_sync_status"]
    end
    subgraph Portfolio["Goals, skills, dashboard (legacy-mcp + CRM token)"]
        UC6["get_goals / add_goal / update_goal"]
        UC7["get_skills / get_skill / add_skill / update_skill_progress"]
        UC8["get_dashboard"]
        UC9["get_revenue / add_revenue"]
        UC10["list_task_types (dashboard-api)"]
    end
    subgraph Local["Local scripts and files (no token)"]
        UC11["list/get decisions, events, reviews"]
        UC12["approve/reject/defer/complete/review decision"]
        UC13["sync_decision_reviews (dry-run default)"]
        UC14["revenue_analytics / habit_analytics / goal_velocity"]
        UC15["system_health / check_data_freshness"]
        UC16["manage_brave_bookmark_proposals"]
        UC17["list_free_images / fetch_free_images"]
        UC18["seo_report_status / seo_monthly_report"]
        UC19["get_delivery_context (read-only)"]
        UC20["list_email_accounts / get_account_services (read-only)"]
    end

    Launcher -->|"spawns with SOLO_* roots"| Agent
    Agent --> UC1
    Agent --> UC2
    Agent --> UC3
    Agent --> UC4
    Agent --> UC5
    Agent --> UC6
    Agent --> UC7
    Agent --> UC8
    Agent --> UC9
    Agent --> UC10
    Agent --> UC11
    Agent --> UC14
    Agent --> UC15
    Agent --> UC16
    Agent --> UC17
    Agent --> UC18
    Agent --> UC19
    Agent --> UC20
    Owner -->|"confirm=true"| UC12
    Owner -->|"confirm=true"| UC13
```

Sources: `src/index.ts`, `src/tools/*.ts`, `src/crm-ledger.ts`, `src/task-store.ts` (`automationToken`), `~/bookchaowalit-empire/infra/scripts/agent/harness_mcp.py` (hub launcher, read-only)

รวม 40 tools จาก 15 modules (นับจาก `server.tool` / `server.registerTool` ใน `src/tools/`).

## Open questions
- `habits-store.ts` มี client สำหรับ log habit แต่ไม่มี MCP tool ที่ลงทะเบียน (มีแค่ `habit_analytics` ผ่าน Python) ทั้งที่ PRODUCT.md เขียนว่า "log a habit" — ตั้งใจหรือ gap?
- "confirm" มาจาก agent เอง ไม่มีการพิสูจน์ว่า owner กดยืนยันจริง (ดู 13-threat-model.md)
