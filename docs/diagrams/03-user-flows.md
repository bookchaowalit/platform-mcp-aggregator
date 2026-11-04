# 03 — User flows

ไม่มี UI/routes: "flow" คือลำดับ tool calls ของ agent. มี role เดียวในทางปฏิบัติ (agent ใน session owner).

## Flow A — จัดการ task (create → update → complete / archive)

```mermaid
flowchart TD
    Start["Agent needs a task"] --> Reuse{"create_task reuse_open=true?"}
    Reuse -->|"yes"| Find["list q=title (+project, parent)"]
    Find --> Match{"open task with same title, project, parent?"}
    Match -->|"yes"| Reused["return reused:true, existing task"]
    Match -->|"no"| Create["POST /v1/tasks"]
    Reuse -->|"no"| Create
    Create --> StatusCheck{"status != todo?"}
    StatusCheck -->|"yes"| Patch["update(status)"]
    StatusCheck -->|"no"| Created["return task"]
    Patch --> Created
    Created --> Work["update_task: fields, append_notes"]
    Work --> Done{"status done?"}
    Done -->|"yes"| Complete["POST /v1/tasks/{uuid}/complete"]
    Done -->|"no"| PatchOnly["PATCH /v1/tasks/{uuid}"]
    Created --> Archive["delete_task -> POST /archive reason 'deleted via MCP delete_task'"]
```

Sources: `src/tools/tasks.ts`, `src/task-store.ts` (`ApiTaskStore.create/update/complete/archive`), `src/task-state.ts` (`updateTask`, `planTaskUpdate`)

## Flow B — decision approval (human gate)

```mermaid
flowchart TD
    L["list_decisions / get_decision"] --> E["list_decision_events"]
    E --> Act{"approve / reject / defer / complete"}
    Act --> C{"confirm=true?"}
    C -->|"no"| Refuse["success:false, no state changed"]
    C -->|"yes"| Py["decision-cli.py ACTION id --confirm --json"]
    Py --> Res["JSON from script"]
    R["list_decision_reviews"] --> S["sync_decision_reviews"]
    S --> SC{"confirm=true?"}
    SC -->|"no"| Dry["decision_review.py --dry-run"]
    SC -->|"yes"| Sync["decision_review.py --sync"]
    Sync --> Rev["review_decision confirm=true -> decision-cli.py review"]
```

Sources: `src/tools/decisions.ts`

## Flow C — delivery context (read-only, fail closed)

```mermaid
flowchart TD
    Q["get_delivery_context view=overview"] --> V{"query valid?"}
    V -->|"no"| Inv["status invalid + one error code"]
    V -->|"yes"| Role["view=role role=ID"]
    Role --> Ref["view=refinement role + step"]
    Ref --> Art["view=artifact artifact_id offset limit"]
    Art --> More{"truncated?"}
    More -->|"yes"| Next["call again offset=next_offset"]
    More -->|"no"| End["done"]
```

Sources: `src/delivery-context.ts` (`validateQuery`, `DATA_KEYS.artifact`), `README.md` (Delivery context)

## Flow D — bookmark proposal

```mermaid
flowchart LR
    P["action=propose url title"] --> Py1["brave_bookmark_workflow.py propose"]
    L["action=list"] --> Py2["... review"]
    A["action=approve/reject proposal_id"] --> Py3["... review --approve/--reject ID"]
    Py3 -.->|"outside this repo"| Job["scheduled job applies when Brave is closed"]
```

Sources: `src/tools/browser-bookmarks.ts`

## Open questions
- ไม่มี flow สำหรับ habit logging ใน MCP (ดู 02)
