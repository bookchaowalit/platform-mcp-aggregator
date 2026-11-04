# ADR-0002 — Thin adapter over cell/CRM APIs and owning-repo scripts

- Status: accepted (retro-documented)
- Date of evidence: 2026-11-04 (code at `336bcea`)

## Context
เดิม tools อ่าน/เขียน SQLite ตรง. ข้อมูลย้ายไป Tasks API และ domain cells; revenue ย้ายไป CRM ledger (2026-10-11 ตาม comment ใน `src/crm-ledger.ts`).

## Decision
Server ไม่มี database ของตัวเอง. Tools เรียก HTTP API ด้วย automation token ของผู้เรียก หรือ `execFile` Python script ใน repo เจ้าของ (`platform-ops-cli`, `data-lake-pipelines`, `architecture-docs`) ที่หาได้ผ่าน `SOLO_*_ROOT` หรือ sibling `../<repo>` เท่านั้น ไม่พึ่ง hub path.

## Evidence
- `src/task-store.ts`: `SQLITE_RETIRED` "the SQLite task backend was retired on 2026-10-09"; `clientSettings()` บังคับ `SOLO_EMPIRE_TASKS_BACKEND=api`
- `src/cell-store.ts` `ApiCellStore`; `src/crm-ledger.ts` `CrmLedger`
- `src/roots.ts` `sibling()`; `registryDir()` ไม่มี default
- ทุก `fetch` ใช้ `redirect: "error"`; URL ต้องเป็น https (http เฉพาะ loopback) ผ่าน `validateApiUrl`
- token files ที่ mode เปิด group/world ถูกปฏิเสธ (`automationToken`, `readClientFile`, `ledgerToken`)

## Consequences
- ความถูกต้องของ status/validation ส่วนใหญ่อยู่ที่ API/script ปลายทาง
- ordering/join ทำใน memory (`src/portfolio-reads.ts`, datasets < 400 rows ตาม comment)
- ไม่มี retry; Tasks/Cell/Habits fetch ไม่มี timeout (มีเฉพาะ CRM 30s และ subprocess timeouts)
