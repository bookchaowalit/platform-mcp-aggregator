# ADR-0003 — No Sentry or third-party error reporter

- Status: accepted (retro-documented)
- Date of evidence: 2026-11-04 (commit `624fe84` "docs: add PRODUCT.md, including why Sentry does not apply")

## Context
Tool arguments มีข้อมูลส่วนตัว (task text, revenue, decisions).

## Decision
ไม่ติดตั้ง Sentry/PostHog. Errors คืนเป็น fixed error codes หรือข้อความให้ agent แสดงใน session.

## Evidence
- `PRODUCT.md` Operating Context: "Sentry does not apply ... an error reporter would send tool arguments ... to a third party"
- `package.json`: ไม่มี SDK ของ Sentry/PostHog; `src/` มีแค่ `console.error` ตอน start และ fatal (`src/index.ts`)

## Consequences
- ไม่มีสัญญาณ error นอก session; Measure "unexpected-error rate" ยังวัดไม่ได้ (PRODUCT.md `[ต้องยืนยัน]`)
