# ADR-0001 — Local stdio MCP server in TypeScript, not hosted

- Status: accepted (retro-documented)
- Date of evidence: 2026-11-04 (code at `336bcea`)

## Context
Agents ของ owner ต้องการ typed tools เหนือระบบส่วนตัว (tasks, goals, revenue, decisions ฯลฯ) ภายใน session บนเครื่อง owner.

## Decision
ใช้ `@modelcontextprotocol/sdk` (`McpServer` + `StdioServerTransport`) เขียนด้วย TypeScript รันด้วย `tsx` เป็น process ต่อ session; ไม่มี hosted deployment. Remote clients ใช้ `platform-mcp-remote-worker` แทน.

## Evidence
- `src/index.ts`: `new StdioServerTransport()`, `server.connect(transport)`, name `solo-empire` version `1.0.0`
- `package.json`: dependency `@modelcontextprotocol/sdk`, scripts `start`/`dev`
- `PRODUCT.md` Operating Context: "Not deployed: runs as a stdio process on the owner's machine"
- hub launcher `~/bookchaowalit-empire/infra/scripts/agent/harness_mcp.py` execs `node_modules/.bin/tsx src/index.ts`

## Consequences
- session เดิมไม่เห็น tool ใหม่จนกว่าจะ restart (`README.md`)
- ไม่มี uptime/monitoring ฝั่ง server (ดู 20-observability.md)
- `package.json` มี `publishConfig` ไป GitHub Packages แต่ไม่มี workflow publish — ยังไม่มีการใช้งาน
