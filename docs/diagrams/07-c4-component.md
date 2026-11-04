# 07 — C4 Component

```mermaid
C4Component
    title Components - MCP server process
    Container_Boundary(p, "MCP server process") {
        Component(entry, "index.ts", "McpServer + StdioServerTransport", "Builds ToolContext, runPyScript, registers modules")
        Component(roots, "roots.ts", "env/sibling lookup", "opsRoot, dataLakeRoot, architectureRoot, knowledgeRoot, registryDir")
        Component(toolsApi, "API-backed tool modules", "tasks, customization, goals, skills, dashboard, revenue", "zod schemas")
        Component(toolsPy, "Script-backed tool modules", "decisions, analytics, data-freshness, cron, browser-bookmarks, free-images, seo-report", "runPyScript or execFile")
        Component(toolsRead, "Read-only tool modules", "delivery-context, email-accounts", "registerTool with readOnlyHint")
        Component(taskStore, "task-store.ts + task-state.ts", "ApiTaskStore, AsyncMutex, updateTask", "Tasks API client, client.env reader, token lookup")
        Component(cellStore, "cell-store.ts + portfolio-reads.ts", "ApiCellStore", "Generic cell client; sort/join in memory")
        Component(ledger, "crm-ledger.ts", "CrmLedger, ledgerSection", "Revenue reads and idempotent add")
        Component(dc, "delivery-context.ts", "validator", "Strict JSON, contract, SHA256, safe paths")
        Component(email, "email-accounts.ts", "YAML reader", "schema solo-empire.email-accounts.v1")
        Component(habits, "habits-store.ts", "ApiHabitsStore", "Exported for owner CLI; no MCP tool uses it")
    }
    Rel(entry, toolsApi, "register")
    Rel(entry, toolsPy, "register with runPyScript")
    Rel(entry, toolsRead, "register")
    Rel(toolsApi, taskStore, "openTaskStore")
    Rel(toolsApi, cellStore, "openCellStore")
    Rel(toolsApi, ledger, "ledgerSection / openCrmLedger")
    Rel(toolsRead, dc, "getDeliveryContext")
    Rel(toolsRead, email, "loadEmailRegistry")
    Rel(cellStore, taskStore, "automationToken, clientValue, validateApiUrl")
    Rel(ledger, taskStore, "clientValue, validateApiUrl")
    Rel(habits, taskStore, "automationToken, clientValue")
    Rel(toolsPy, roots, "scriptsDir, dataLakeRoot")
    Rel(dc, roots, "architectureRoot, knowledgeRoot")
```

Sources: `src/index.ts`, `src/roots.ts`, `src/tool-context.ts`, `src/tools/*.ts`, `src/task-store.ts`, `src/task-state.ts`, `src/cell-store.ts`, `src/portfolio-reads.ts`, `src/crm-ledger.ts`, `src/delivery-context.ts`, `src/email-accounts.ts`, `src/habits-store.ts`

หมายเหตุ: `task-store.ts` ระบุว่าแชร์กับ owner CLI (`platform-ops-cli`) ด้วย — repo นี้จึงเป็นทั้ง server และ shared TS library ของ ops-cli (comment หัวไฟล์ `src/task-store.ts`, `src/habits-store.ts`).
