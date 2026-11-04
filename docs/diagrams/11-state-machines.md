# 11 — State machines

Server ไม่บังคับ transitions เอง (API ปลายทางเป็นเจ้าของกฎ); ด้านล่างคือสิ่งที่โค้ดใน repo นี้ส่ง/รู้จักจริง.

## Task (`taskStatusSchema` + archive)

ค่า status: `todo`, `in_progress`, `done`, `blocked`, `cancelled`. `create_task` รับเฉพาะ `todo|in_progress|done|blocked`.
การเข้า `done` ใช้ `POST /complete` เสมอ (PATCH ตั้ง done ไม่ได้). ไม่มีการตรวจ allowed transition ฝั่ง client.

```mermaid
stateDiagram-v2
    [*] --> todo: create_task (POST /v1/tasks)
    todo --> in_progress: update_task
    todo --> blocked: update_task
    in_progress --> blocked: update_task
    blocked --> in_progress: update_task
    todo --> done: complete_task / update status done
    in_progress --> done: complete_task / update status done
    blocked --> done: complete_task
    done --> in_progress: update_task (legacy completed_at = null)
    todo --> cancelled: update_task status cancelled
    in_progress --> cancelled: update_task status cancelled
    todo --> Archived: delete_task (POST archive)
    in_progress --> Archived: delete_task
    done --> Archived: delete_task
    cancelled --> Archived: delete_task
    Archived --> [*]
```

หมายเหตุ: create ที่ status != todo = POST แล้ว update ต่อ (ไม่ atomic). `unarchive()` มีใน `ApiTaskStore` แต่ไม่มี MCP tool เรียก. ทุกสถานะ update ได้อิสระ — เส้นที่วาดคือตัวอย่างที่ schema อนุญาต ไม่ใช่กฎที่ client บังคับ.

Sources: `src/task-state.ts`, `src/task-store.ts` (`create`, `update`, `complete`, `archive`, `unarchive`), `src/tools/tasks.ts`

## Delivery context result

```mermaid
stateDiagram-v2
    [*] --> validating: getDeliveryContext
    validating --> invalid: query, JSON, contract, filter, provenance, integrity, output_limit, role_unknown
    validating --> unavailable: exporter missing, timeout, failed, unsafe_path
    validating --> ready: all checks pass
    ready --> [*]
    invalid --> [*]
    unavailable --> [*]
```

Sources: `src/delivery-context.ts` (`getDeliveryContext` catch mapping, `DeliveryContextResult.status`)

## Bookmark proposal (as driven by this tool)

```mermaid
stateDiagram-v2
    [*] --> proposed: action propose
    proposed --> approved: action approve proposal_id
    proposed --> rejected: action reject proposal_id
    approved --> applied: scheduled job, outside this repo
```

Sources: `src/tools/browser-bookmarks.ts`

## Goal / skill / decision
- Goal: `add_goal` ตั้ง `planning`; dashboard อ่าน `active`, `planning`; `update_goal` status เป็น free string และใส่ `completed_at` เมื่อ status = `completed`. ไม่มี enum.
- Skill: `add_skill` default `not_started`; status free string.
- Decision: actions `approve`, `reject`, `defer`, `complete`, `review` ส่งให้ `decision-cli.py`; ค่า status จริงอยู่ใน Python (ไม่อยู่ใน repo นี้).

Sources: `src/tools/goals.ts`, `src/tools/dashboard.ts`, `src/tools/skills.ts`, `src/tools/decisions.ts`

## Open questions
- Tasks API บังคับ transition อะไรบ้าง (เช่น done → cancelled) — ต้องดู repo ของ Tasks API
- ชุดค่า status ของ goals/skills/decisions เป็นทางการคืออะไร
