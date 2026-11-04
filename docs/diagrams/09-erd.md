# 09 — ERD (client-side view of remote data)

Repo นี้ **ไม่มี schema หรือ migration ของตัวเอง** และไม่ได้เป็นเจ้าของข้อมูล. ERD ด้านล่างคือ shape ที่ client types และ tool code อ่าน/เขียน
บน API ปลายทาง (Tasks API, goals cell, roles-skills cell, CRM ledger) และไฟล์ `email-accounts.yaml`. Schema จริงอยู่ใน repo ของ service เหล่านั้น.
SQLite ใน `tests/support/` เป็น test double เท่านั้น (backend sqlite ถูก retire 2026-10-09).

```mermaid
erDiagram
    TASK {
        int id "task number"
        string uuid "API id, cached by ApiTaskStore"
        string title
        string status "todo in_progress done blocked cancelled"
        int priority "1-5"
        string project
        string category
        string due_date
        string completed_at
        string notes
        string external_source
        string archived_at
        string archive_reason
        int parent_task_id
        int progress_percent
    }
    TASK_ASSIGNMENT {
        int task
        string assignee_type "user role team"
        string assignee_id
        string assignment_type
    }
    TASK_TYPE {
        int id
        string name
        string default_status
        string allowed_statuses
        boolean is_active
    }
    TASK_ROLE_SUGGESTION {
        int task
        string role_id
        string confidence
        string review_status
    }
    GOAL {
        int id
        int version
        string title
        string type
        string category
        string status "planning on add"
        int priority
        int progress_percent
        string due_date
        string completed_at
    }
    GOAL_TASK {
        int id
        int goal_id
        int sort_order
    }
    SKILL {
        int id
        string slug
        string name
        int category_id
        string level
        string target_level
        string status "not_started on add"
        int progress_percent
        float hours_invested
    }
    SKILL_CATEGORY {
        int id
        string name
        string slug
        string icon
        string color
    }
    PROGRESS_LOG {
        int id
        int skill_id
        string activity_type
        string title
        float hours_spent
        int progress_before
        int progress_after
        string logged_at
    }
    REVENUE {
        int id
        string source_type
        string source_name
        float amount
        string currency "THB default"
        string revenue_date
        string idempotency_key "mcp: + sha256 32 hex"
    }
    EMAIL_ACCOUNT {
        string email
        string provider
        string status
    }
    SERVICE {
        string id
        string name
        string category
    }
    SERVICE_LINK {
        string email
        string evidence
        string confidence "confirmed inferred unknown"
        string checked
    }
    TASK ||--o{ TASK : "parent_task_id"
    TASK ||--o{ TASK_ASSIGNMENT : "task"
    TASK ||--o{ TASK_ROLE_SUGGESTION : "task"
    GOAL ||--o{ GOAL_TASK : "goal_id"
    SKILL_CATEGORY ||--o{ SKILL : "category_id"
    SKILL ||--o{ PROGRESS_LOG : "skill_id"
    SERVICE ||--o{ SERVICE_LINK : "accounts"
    EMAIL_ACCOUNT ||--o{ SERVICE_LINK : "email"
```

Sources: `src/task-store.ts` (`TaskRecord`, `TaskAssignment`, `TaskTypeRecord`, `RoleSuggestion`), `src/task-state.ts` (`taskStatusSchema`), `src/cell-store.ts` (`CellRecord`), `src/tools/goals.ts`, `src/tools/skills.ts`, `src/portfolio-reads.ts` (`withCategory`), `src/tools/revenue.ts`, `src/email-accounts.ts`

Local files ที่ server อ่าน (ไม่ใช่ entity): `~/.config/empire-platform/client.env` (หรือ `$EMPIRE_CLIENT_CONFIG`), `<ops>/.runtime/automation-tokens/<name>.jwt`, `~/.config/empire-platform/tokens/<name>.jwt`, `~/.config/solo-crm/income.token`.

## Open questions
- ความหมายจริงของ `goal_id` ใน goal-tasks (FK ถึง `GOAL.id` หรือ legacy id) — โค้ดเทียบ `t.goal_id === g.id`
- Schema ของ decisions, decision reviews, bookmark proposals, free-image catalog อยู่ใน Python scripts นอก repo
