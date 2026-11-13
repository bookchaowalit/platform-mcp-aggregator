# 06 — C4 Container

Process เดียว (Node.js ผ่าน `tsx`) ไม่มี container/DB ของตัวเอง. Containers ด้านล่างคือ process และ store ที่มันคุยด้วย.

```mermaid
C4Container
    title Containers - solo-empire MCP server
    System_Ext(agent, "AI agent harness", "Claude Code / Codex")
    Container(launcher, "harness_mcp.py", "Python, hub repo", "Sets SOLO_* roots and SOLO_REGISTRY_DIR, execs tsx")
    System_Boundary(b, "platform-mcp-aggregator") {
        Container(server, "MCP server process", "Node.js 22 + tsx, @modelcontextprotocol/sdk", "src/index.ts, StdioServerTransport")
    }
    Container_Ext(py, "python3 subprocesses", "Python", "ops-cli scripts, bookmark workflow, delivery exporter")
    ContainerDb_Ext(yaml, "email-accounts.yaml", "YAML file", "repository-catalog/registries")
    ContainerDb_Ext(cfg, "Owner client config and token files", "files mode 600", "client.env, automation-tokens/*.jwt, income.token")
    System_Ext(tasks, "Tasks API", "HTTPS")
    System_Ext(cells, "goals and roles-skills cells", "HTTPS")
    System_Ext(crm, "CRM ledger", "HTTPS")

    Rel(launcher, server, "execve tsx src/index.ts")
    Rel(agent, server, "JSON-RPC", "stdio")
    Rel(server, cfg, "reads URL and tokens")
    Rel(server, tasks, "fetch, redirect error")
    Rel(server, cells, "fetch, redirect error")
    Rel(server, crm, "fetch, 30s timeout")
    Rel(server, py, "execFile, timeout 30s or 45s/180s")
    Rel(server, yaml, "readFileSync")
```

Sources: `src/index.ts`, `src/task-store.ts` (`clientConfigPath`, `automationToken`), `src/crm-ledger.ts` (`ledgerToken`, `AbortSignal.timeout(30_000)`), `src/tools/free-images.ts`, `src/delivery-context.ts`, `.github/workflows/ci.yml` (`node-version: "22"`), `~/bookchaowalit-empire/infra/scripts/agent/harness_mcp.py` (read-only)
