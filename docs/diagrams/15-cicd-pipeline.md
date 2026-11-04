# 15 — CI/CD pipeline

Workflow เดียว: `.github/workflows/ci.yml` (`CI`). Triggers: `push` to `main`, `pull_request`, `workflow_dispatch`. `permissions: contents: read`; concurrency `ci-${{ github.ref }}` cancel-in-progress. Runners: GitHub-hosted (public repo, comment หัวไฟล์). ไม่มี CD job.

```mermaid
flowchart TD
    Push["push main"] --> CI["CI workflow"]
    PR["pull_request"] --> CI
    WD["workflow_dispatch"] --> CI
    CI --> Mcp["job mcp: ci-node.yml @87dc5e1 v1.1.1"]
    CI --> Sec["job security: security.yml @87dc5e1 v1.1.1"]
    subgraph Node["ci-node (node-version 22)"]
        N1["Checkout"] --> N2["Detect package manager npm"]
        N2 --> N3["Install dependencies"]
        N3 --> N4["Lint: no biome or lint script, warning skip"]
        N4 --> N5["Typecheck: npm run typecheck = tsc --noEmit"]
        N5 --> N6["Test: npm run test = tsx --test tests/*.test.ts"]
        N6 --> N7["Build: npm run build = tsc"]
    end
    subgraph Security["security"]
        S1["gitleaks"]
        S2["semgrep"]
        S3["osv-scanner"]
        S4["trivy-fs"]
    end
    Mcp --> N1
    Sec --> S1
    Sec --> S2
    Sec --> S3
    Sec --> S4
    N7 --> End["no deploy step"]
```

Sources: `.github/workflows/ci.yml`, `package.json` (scripts), reusable workflow `bookchaowalit/platform-ci-workflows/.github/workflows/ci-node.yml` and `security.yml` (local clone read for step names; pinned SHA `87dc5e1c7e04` in ci.yml)

ไม่มี `needs` ระหว่าง jobs (รันขนาน). ไม่ได้ส่ง `coverage-threshold` จึงไม่มี coverage gate. Tests ที่ต้องใช้ `platform-ops-cli` หรือ `architecture-docs` จะ skip บน CI.

## สถานะล่าสุด (`gh run list -R bookchaowalit/platform-mcp-aggregator`, 2026-11-04)

| Date (UTC) | Event | SHA | Result | Failing jobs |
|---|---|---|---|---|
| 2026-10-28 16:10 | push main | `336bcea` | failure | security/trivy-fs, security/osv-scanner |
| 2026-10-28 15:51 | push main | `e473a12` | failure | security/trivy-fs, security/osv-scanner |
| 2026-10-22 09:46 | push main | `53a3fae` | success | — |
| 2026-10-22 09:31 | push main | `624fe84` | failure | security/osv-scanner |
| 2026-10-17 09:30 | push main | `0d666f3` | success | — |
| 2026-10-17 09:15 | pull_request #1 | `55ca9df` | success | — |

`mcp / node (.)` ผ่านทุก run ที่ตรวจ. Dependency updates: Renovate (`renovate.json`) ทุกวันจันทร์ก่อน 9 โมง (Asia/Bangkok), lockfile maintenance วันที่ 1.

## Open questions
- สาเหตุ osv-scanner / trivy-fs fail บน `336bcea` (log fetch timeout ตอนเขียน)
