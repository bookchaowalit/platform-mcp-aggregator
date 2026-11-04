# 21 — Incident response

ไม่มี alert channel อัตโนมัติสำหรับ repo นี้ (ไม่มี Sentry, Telegram, uptime ใน code/workflows). "Alerts" ที่มีจริง: tool error ใน agent session, CI failure บน GitHub, Renovate vulnerability PRs (label `security`).

```mermaid
flowchart TD
    A1["Tool returns isError or throws in session"] --> Triage
    A2["CI run red on main (gh run list)"] --> Triage
    A3["Renovate vulnerability alert PR"] --> Triage
    Triage{"Where is the fault?"}
    Triage -->|"config: client.env, token mode, SOLO_* root"| Cfg["Fix owner config, chmod 600, set env"]
    Triage -->|"script missing or failing"| Sib["Fix sibling repo (ops-cli, data-lake, architecture-docs)"]
    Triage -->|"remote API error or hang"| Remote["Check Tasks API / cell / CRM service"]
    Triage -->|"code bug in this repo"| Fix["Fix + test, task check, push main"]
    Triage -->|"security job finding"| Dep["Dependency override or bump (e.g. hono 4.13.11)"]
    Cfg --> Restart["Restart session, verify tools/list"]
    Sib --> Restart
    Remote --> Restart
    Fix --> CIok["CI green"] --> Restart
    Dep --> CIok
    Restart --> PM["Postmortem: gap, no template or location in repo"]
```

Sources: `src/index.ts`, `src/task-store.ts` (error messages for config/token mode), `src/crm-ledger.ts`, `README.md`, `.github/workflows/ci.yml`, `renovate.json`, commit `53a3fae` (example dependency fix)

## Open questions
- ไม่มี postmortem template/ที่เก็บ — ใช้ของ architecture-docs หรือไม่
- CI ที่ red บน `main` ตั้งแต่ 2026-10-28 ยังไม่มีใครรับ (ดู 15)
