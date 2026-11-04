# 05 — C4 Context

```mermaid
C4Context
    title System Context - solo-empire MCP server (platform-mcp-aggregator)
    Person(owner, "Owner", "Works through AI agent sessions")
    System_Ext(agent, "AI agent harness", "Claude Code, Codex; spawns the server over stdio")
    System(mcp, "solo-empire MCP server", "Local stdio TypeScript server, 40 tools")
    System_Ext(tasks, "Tasks API", "EMPIRE_TASKS_API")
    System_Ext(cells, "Cell APIs", "goals, roles-skills")
    System_Ext(crm, "CRM ledger", "EMPIRE_CRM_LEDGER_API /api/v1/crm/ledger")
    System_Ext(ops, "platform-ops-cli checkout", "Python scripts in infra/scripts")
    System_Ext(lake, "data-lake-pipelines checkout", "brave_bookmark_workflow.py")
    System_Ext(arch, "architecture-docs checkout", "scripts/delivery_context.py and definitions")
    System_Ext(registry, "Hub repository-catalog", "registries/email-accounts.yaml")

    Rel(owner, agent, "Asks")
    Rel(agent, mcp, "tools/list, tools/call", "JSON-RPC stdio")
    Rel(mcp, tasks, "Bearer token", "HTTPS")
    Rel(mcp, cells, "Bearer token", "HTTPS")
    Rel(mcp, crm, "Bearer token", "HTTPS")
    Rel(mcp, ops, "python3 script --json", "subprocess")
    Rel(mcp, lake, "python3 script --json", "subprocess")
    Rel(mcp, arch, "python3 delivery_context.py --json", "subprocess")
    Rel(mcp, registry, "reads YAML", "file")
```

Sources: `src/index.ts`, `src/task-store.ts`, `src/cell-store.ts`, `src/crm-ledger.ts`, `src/roots.ts`, `src/delivery-context.ts`, `src/email-accounts.ts`, `PRODUCT.md`

Remote counterpart (ไม่ใช่ dependency ของ repo นี้): Cloudflare Worker tool hub `platform-mcp-remote-worker` (`PRODUCT.md`, `docs/README.md`).
Python scripts อาจเรียก external services ต่อ (เช่น Openverse/Pexels/Unsplash ตาม description ของ `fetch_free_images`, Gmail สำหรับ `seo_monthly_report source=gmail`) — อยู่นอก repo นี้.

## Open questions
- ปลายทางจริงของ Python scripts แต่ละตัว (DB/API ไหน) ต้องดูใน `platform-ops-cli`
