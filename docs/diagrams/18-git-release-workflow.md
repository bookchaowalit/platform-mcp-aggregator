# 18 — Git and release workflow

ประวัติ 90 วัน (ตั้งแต่ 2026-08-06): 56 commits บน `main`, 53 first-parent, PR ทั้งหมด 1 อัน (#1 `ci/devsecops-phase1`, squash-merged เป็น `0d666f3` 2026-10-17; history ช่วงหลังบน main เป็นเส้นตรง). ส่วนใหญ่ push ตรงเข้า `main`. ไม่มี tags/releases. "Production" = owner pull checkout แล้ว restart session.

```mermaid
gitGraph
    commit id: "580917d renames"
    commit id: "2d9f202 revert"
    commit id: "0d6b7e8 renames again"
    commit id: "433d5cb delivery context"
    commit id: "9b8cae2 bounded reads"
    commit id: "19ab21b test isolation"
    branch ci/devsecops-phase1
    commit id: "55ca9df shared CI"
    checkout main
    commit id: "0d666f3 squash PR 1"
    commit id: "624fe84 PRODUCT.md"
    commit id: "53a3fae hono override"
    commit id: "e473a12 email tools"
    commit id: "336bcea docs email"
```

```mermaid
flowchart LR
    Dev["Edit in checkout"] --> Check["task check: tsc --noEmit + tsx --test"]
    Check --> Push["git push origin main (or PR)"]
    Push --> CI["CI: mcp + security"]
    CI --> Pull["Owner checkout on main"]
    Pull --> Npm["npm ci"]
    Npm --> Restart["Restart agent session"]
    Restart --> List["Verify tools/list"]
    CI -.->|"not a gate: no branch protection seen in repo"| Pull
```

Sources: `git log origin/main`, `gh pr list -R bookchaowalit/platform-mcp-aggregator --state all`, `.github/workflows/ci.yml`, `Taskfile.yml`, `README.md`

หมายเหตุ: hub AGENTS.md ระบุ Codex review Stop hook ใน session ของ Claude Code — เป็น policy ของ harness ไม่ใช่ของ repo นี้.

## Open questions
- มี branch protection / ruleset บน `main` หรือไม่ (ไม่เห็นในไฟล์ repo)
- จะมี versioning (package `version` ยัง `1.0.0`, server version `1.0.0`) หรือไม่
