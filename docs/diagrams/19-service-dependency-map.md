# 19 — Service dependency map

```mermaid
flowchart LR
    MCP["solo-empire MCP server"]
    subgraph Runtime["Runtime libs (package.json)"]
        SDK["@modelcontextprotocol/sdk"]
        Zod["zod"]
        Yaml["yaml 2.9.1"]
        Node["Node.js 22 + tsx"]
    end
    subgraph HTTP["Hosted APIs"]
        Tasks["Tasks API"]
        Goals["goals cell"]
        RS["roles-skills cell"]
        CRM["CRM ledger"]
    end
    subgraph Local["Local sibling checkouts"]
        Ops["platform-ops-cli infra/scripts"]
        Lake["data-lake-pipelines"]
        Arch["architecture-docs"]
        KB["knowledge-base (policy docs for delivery context)"]
        Cat["hub repository-catalog"]
        Py["python3"]
    end
    MCP --> SDK
    MCP --> Zod
    MCP --> Yaml
    MCP --> Node
    MCP -->|"tasks tools, list_task_types"| Tasks
    MCP -->|"goals tools, dashboard"| Goals
    MCP -->|"skills tools, dashboard"| RS
    MCP -->|"revenue tools, dashboard"| CRM
    MCP --> Py
    Py -->|"decisions, analytics, health, freshness, images, seo"| Ops
    Py -->|"bookmarks"| Lake
    Py -->|"delivery context"| Arch
    MCP -->|"SHA256 verify"| Arch
    MCP -->|"policy files"| KB
    MCP -->|"email-accounts.yaml"| Cat
    Ops -.->|"outside this repo"| Down["Script backends (DBs, Openverse/Pexels/Unsplash, Gmail)"]
```

Sources: `package.json`, `src/index.ts`, `src/roots.ts`, `src/tools/*.ts`, `src/delivery-context.ts` (`knowledgeRoot`, `KNOWLEDGE_PATHS`), `src/email-accounts.ts`

Reverse dependency: `platform-ops-cli` owner CLI ใช้ `src/task-store.ts` และ `src/delivery-context.ts` จาก repo นี้ (comment ใน `src/task-store.ts`, `src/delivery-context.ts` `parseDeliveryCliArgs`, tests ที่ spawn `infra/cli.ts`).

| Dependency | Failure behaviour in code |
|---|---|
| Tasks / cell API down | fetch throws; no timeout; error propagates to SDK |
| CRM down | `LedgerError 503` → `available:false` in `get_revenue` / dashboard; `add_revenue` returns `success:false` |
| Script missing | `script not found ...` error (runPyScript); bookmarks: explicit message; delivery: `exporter_unavailable` |
| Registry dir unset | `SOLO_REGISTRY_DIR is not set ...` isError |
