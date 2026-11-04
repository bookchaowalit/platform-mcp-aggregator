# 10 — Sequences

ไม่มี retry ในทุก path ด้านล่าง (ไม่พบ retry/backoff ใน `src/`). Error ที่ไม่ได้จับใน handler ถูก throw ออกไปให้ MCP SDK.

## S1 — `update_task` status=done

```mermaid
sequenceDiagram
    participant A as AI agent
    participant S as MCP server (tools/tasks.ts)
    participant St as ApiTaskStore
    participant T as Tasks API
    A->>S: tools/call update_task {id, status: done}
    S->>St: openTaskStore("legacy-mcp", channel mcp)
    Note over St: clientSettings and automationToken, no network yet
    S->>St: updateTask() inside exclusive() mutex
    St->>T: GET /v1/tasks/number/{id}
    alt 404
        T-->>St: 404
        St-->>S: "missing"
        S-->>A: isError, Task id not found
    else found
        T-->>St: task (uuid cached)
        Note over St: planTaskUpdate: done drops progress_percent
        St->>T: POST /v1/tasks/{uuid}/complete
        T-->>St: 2xx
        St->>T: GET /v1/tasks/number/{id}
        T-->>St: task
        S-->>A: success, legacy task row
    end
```

Sources: `src/tools/tasks.ts`, `src/task-state.ts`, `src/task-store.ts`

## S2 — `add_revenue` (idempotent)

```mermaid
sequenceDiagram
    participant A as AI agent
    participant S as tools/revenue.ts
    participant L as CrmLedger
    participant C as CRM ledger API
    A->>S: add_revenue {source_type, amount, revenue_date, ...}
    S->>S: key = "mcp:" + sha256(date, type, amount, currency, source_name)[0:32]
    S->>L: openCrmLedger() reads URL + owner token
    L->>C: POST /api/v1/crm/ledger/revenue (30s timeout, redirect error)
    alt network error or timeout
        L-->>S: LedgerError 503 unavailable
        S-->>A: success false, available false, reason
    else HTTP error
        C-->>L: 4xx/5xx error.code
        S-->>A: success false, reason
    else ok
        C-->>L: outcome, revenue
        S-->>A: success true, outcome, id
    end
```

Sources: `src/tools/revenue.ts`, `src/crm-ledger.ts`

## S3 — `get_delivery_context`

```mermaid
sequenceDiagram
    participant A as AI agent
    participant S as tools/delivery-context.ts
    participant D as delivery-context.ts
    participant P as python3 delivery_context.py
    participant F as architecture-docs files
    A->>S: get_delivery_context {view, role, step}
    S->>D: getDeliveryContext(query)
    D->>D: validateQuery, safePath(root, script)
    D->>P: execFile shell false, scrubbed env, 30s, 2 MiB
    P-->>D: stdout JSON
    D->>D: strictJson, contract and authority checks
    D->>F: read each source, compare SHA256
    alt any check fails
        D-->>S: status invalid or unavailable, one error code
        S-->>A: isError true, structuredContent
    else ready
        D-->>S: status ready
        S-->>A: text + structuredContent (same object)
    end
```

Sources: `src/delivery-context.ts`, `src/tools/delivery-context.ts`

## S4 — Script-backed tool (e.g. `approve_decision`)

```mermaid
sequenceDiagram
    participant A as AI agent
    participant S as tools/decisions.ts
    participant R as runPyScript (index.ts)
    participant P as decision-cli.py (platform-ops-cli)
    A->>S: approve_decision {decision_id, confirm}
    alt confirm false
        S-->>A: success false, no state changed
    else confirm true
        S->>R: script, [approve, id, --confirm, ...]
        R->>R: existsSync(script) else reject "script not found"
        R->>P: execFile python3 ... --json (30s, 2 MiB, cwd ops root)
        alt exit error
            P-->>R: stderr
            R-->>S: throw Error(stderr first 500 chars)
        else stdout
            R-->>S: JSON.parse or raw first 4000 chars
            S-->>A: JSON text
        end
    end
```

Sources: `src/tools/decisions.ts`, `src/index.ts` (`runPyScript`)
