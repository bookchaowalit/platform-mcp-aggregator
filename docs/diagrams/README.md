# Core 22 SDLC diagram pack — platform-mcp-aggregator

ชุดภาพ SDLC 22 รายการตาม SDLC Diagram Catalog v2 (knowledge-base `knowledge/tech/core-cs/sdlc-diagram-catalog.md`) วาดจากโค้ดที่ `origin/main` `336bcea` (2026-11-04).
Repo นี้คือ local stdio MCP server `solo-empire` (TypeScript, 40 tools) — ไม่ hosted, ไม่มี database ของตัวเอง; ดู `PRODUCT.md`.

| # | Item | Status | File | Sources read |
|---|---|---|---|---|
| 01 | Business process | done | [01-business-process.md](01-business-process.md) | `src/index.ts`, `src/tools/*.ts`, `PRODUCT.md` |
| 02 | Use cases | done | [02-use-cases.md](02-use-cases.md) | `src/tools/*.ts`, `src/task-store.ts`, hub `harness_mcp.py` |
| 03 | User flows | done | [03-user-flows.md](03-user-flows.md) | `src/tools/tasks.ts`, `decisions.ts`, `browser-bookmarks.ts`, `src/delivery-context.ts` |
| 04 | Traceability (RTM) | done | [04-traceability.md](04-traceability.md) | `PRODUCT.md`, `src/**`, `tests/**`, `ci.yml` |
| 05 | C4 context | done | [05-c4-context.md](05-c4-context.md) | `src/**`, `PRODUCT.md` |
| 06 | C4 container | done | [06-c4-container.md](06-c4-container.md) | `src/**`, `ci.yml`, hub `harness_mcp.py` |
| 07 | C4 component | done | [07-c4-component.md](07-c4-component.md) | `src/**` |
| 08 | ADRs | done (4) | [08-adr/](08-adr/) | `src/**`, `PRODUCT.md`, `package.json`, git log |
| 09 | ERD | done (client-side view; repo owns no schema) | [09-erd.md](09-erd.md) | `src/task-store.ts`, `cell-store.ts`, `tools/goals.ts`, `tools/skills.ts`, `tools/revenue.ts`, `email-accounts.ts` |
| 10 | Sequences | done | [10-sequences.md](10-sequences.md) | `src/tools/tasks.ts`, `revenue.ts`, `delivery-context.ts`, `decisions.ts`, `src/index.ts` |
| 11 | State machines | done | [11-state-machines.md](11-state-machines.md) | `src/task-state.ts`, `src/task-store.ts`, `src/delivery-context.ts` |
| 12 | API and integrations | done | [12-api-integration.md](12-api-integration.md) | `src/*.ts`, `src/tools/*.ts`, `package.json` |
| 13 | Threat model | done | [13-threat-model.md](13-threat-model.md) | `src/**`, `ci.yml`, `renovate.json` |
| 14 | Backup / DR | done (stateless; data owned elsewhere) | [14-backup-dr.md](14-backup-dr.md) | `src/**`, `README.md`, `PRODUCT.md` |
| 15 | CI/CD pipeline | done | [15-cicd-pipeline.md](15-cicd-pipeline.md) | `ci.yml`, `platform-ci-workflows` @`87dc5e1`, `gh run list` |
| 16 | Deployment | done (local checkout, no hosting) | [16-deployment.md](16-deployment.md) | hub `.mcp.json` + `harness_mcp.py`, `src/roots.ts`, `README.md` |
| 17 | Test coverage matrix | done | [17-test-coverage-matrix.md](17-test-coverage-matrix.md) | `tests/**` |
| 18 | Git / release workflow | done | [18-git-release-workflow.md](18-git-release-workflow.md) | git log, `gh pr list`, `Taskfile.yml` |
| 19 | Service dependency map | done | [19-service-dependency-map.md](19-service-dependency-map.md) | `package.json`, `src/**` |
| 20 | Observability | done (mostly gaps by design) | [20-observability.md](20-observability.md) | `src/**`, `PRODUCT.md` |
| 21 | Incident response | done | [21-incident-response.md](21-incident-response.md) | `src/**`, `ci.yml`, `renovate.json` |
| 22 | DORA | done (proxies; no deploy events) | [22-dora.md](22-dora.md) | git log, `gh run list`, `gh pr list` |

Reused existing docs (linked, not copied): `PRODUCT.md`, `README.md`, `docs/MCP-REFERENCE.md`, `src/tools/README.md`.

## Key gaps found (code-verified)
- No retry anywhere; Tasks/Cell/Habits HTTP calls have no timeout (CRM has 30s).
- 11 of 15 tool modules (30 of 40 tools) have no tests; `cell-store.ts` and `runPyScript` untested.
- `habits-store.ts` is not used by any MCP tool (no habit logging tool) although `PRODUCT.md` mentions logging a habit.
- No call logging, so the PRODUCT.md unexpected-error measure cannot be computed; `X-Correlation-Id` is a fixed string.
- CI `security` job (osv-scanner, trivy-fs) red on the last two `main` runs (2026-10-28).
- Decision `confirm=true` comes from the agent, not a verified human signal.
