# 01 — Business process (As-Is / To-Be)

`platform-mcp-aggregator` คือ local MCP server (stdio, TypeScript) ชื่อ `solo-empire` v1.0.0 ที่ให้ AI agents ของ owner
(Claude Code, Codex ฯลฯ) เรียก typed tools แทนการเข้าถึง database หรือ shell เอง ไม่มี hosted runtime และไม่มี database ของตัวเอง:
ทุก tool เป็น thin adapter ที่เรียก HTTP API ของ cell/CRM หรือ subprocess ไปยัง script ใน repo เจ้าของข้อมูล

Last reviewed: 2026-11-27 · commit `590ec2a`

## As-Is (จากโค้ดวันนี้)

```mermaid
flowchart LR
    Owner["Owner"] -->|"asks in session"| Agent["AI agent (Claude Code / Codex)"]
    Agent -->|"tools/call over stdio"| MCP["solo-empire MCP server (src/index.ts)"]
    MCP -->|"zod-validated input"| Router{"Tool module"}
    Router -->|"tasks, list_task_types"| TasksAPI["Tasks API (EMPIRE_TASKS_API)"]
    Router -->|"goals, skills, dashboard"| Cells["Cell APIs: goals, roles-skills"]
    Router -->|"get_revenue, add_revenue, dashboard"| CRM["CRM ledger API (EMPIRE_CRM_LEDGER_API)"]
    Router -->|"decisions, analytics, health, freshness, images, seo"| OpsPy["platform-ops-cli Python scripts"]
    Router -->|"manage_brave_bookmark_proposals"| LakePy["data-lake-pipelines brave_bookmark_workflow.py"]
    Router -->|"get_delivery_context"| ArchPy["architecture-docs scripts/delivery_context.py"]
    Router -->|"email account tools"| Yaml["SOLO_REGISTRY_DIR registries/email-accounts.yaml"]
    TasksAPI --> Result["JSON text result or isError"]
    Cells --> Result
    CRM --> Result
    OpsPy --> Result
    LakePy --> Result
    ArchPy --> Result
    Yaml --> Result
    Result --> Agent
    Agent --> Owner
```

Sources: `src/index.ts`, `src/tools/*.ts`, `src/task-store.ts`, `src/cell-store.ts`, `src/crm-ledger.ts`, `src/delivery-context.ts`, `src/email-accounts.ts`, `PRODUCT.md`, `README.md`

ขั้นตอนที่มี human gate ในโค้ด:
- decision tools (`approve_decision`, `reject_decision`, `defer_decision`, `complete_decision`, `review_decision`) ต้องส่ง `confirm=true` มิฉะนั้นคืน `success:false` และไม่เปลี่ยนสถานะ (`src/tools/decisions.ts`)
- `sync_decision_reviews` รัน `--dry-run` เว้นแต่ส่ง `confirm=true` จึงเป็น `--sync` (`src/tools/decisions.ts`); `fetch_free_images` และ `seo_monthly_report` ไม่เขียนไฟล์จนกว่า `apply=true`
- `manage_brave_bookmark_proposals` สร้างแค่ proposal; การเขียน Brave profile จริงทำโดย scheduled job นอก repo นี้ (`src/tools/browser-bookmarks.ts`)

## To-Be (จาก PRODUCT.md)

แหล่ง To-Be ที่อนุญาตมีเพียง `PRODUCT.md` (ไม่มี `specs/`, `docs/UPGRADE-PLAN.md` ใน repo). สิ่งที่ PRODUCT.md ระบุเป็นเป้าหมาย:
- วัด "tool calls ที่ fail ด้วย unexpected error แทน defined error code" — ต้องมี local call logging ซึ่งยังไม่มี (`[ต้องยืนยัน]` ใน PRODUCT.md)
- Tools ที่ไม่มี test ของ response contract = 0 (ปัจจุบันยังไม่ถึง ดู 17-test-coverage-matrix.md)
- `task check` เขียวบน `main` เสมอ

```mermaid
flowchart LR
    Agent["AI agent"] --> MCP["solo-empire MCP server"]
    MCP --> Tools["Tool modules (unchanged contracts)"]
    MCP -.->|"gap: not implemented"| CallLog["Local tool-call log (error code vs unexpected)"]
    Tools -.->|"gap: target 0 untested tools"| Tests["Response-contract test per tool"]
```

Sources: `PRODUCT.md` (Measures)

## Gap

| ID | As-Is → To-Be | Status | Owner | Evidence |
|---|---|---|---|---|
| G1 | ไม่มี local tool-call logging → วัดสัดส่วน call ที่ fail ด้วย unexpected error ได้ | todo | claude | `PRODUCT.md` (Measures); ไม่พบ call logging ใน `src/index.ts` |
| G2 | มี test เฉพาะบาง module (`tests/*.test.ts`) → ทุก tool มี test ของ response contract (เป้า 0 tool ที่ไม่มี test) | todo | claude | `PRODUCT.md` (Measures); `docs/diagrams/17-test-coverage-matrix.md` |
| G3 | ไม่มี roadmap เขียนไว้นอกเหนือ Measures → roadmap ของ owner | decide | owner | ขอให้ owner เขียน To-Be/roadmap เพิ่ม |

## Open questions

- จะเก็บ local call logging ที่ไหน และไม่ส่ง tool arguments ออกนอกเครื่องอย่างไร (PRODUCT.md ห้าม third-party reporter)
- `task check` เขียวบน `main` ทุกครั้งหรือไม่ [ต้องยืนยัน] (ยังไม่ได้ตรวจ CI ในรอบนี้)
