# ADR-0004 — Delivery context is read-only and fails closed

- Status: accepted (retro-documented)
- Date of evidence: 2026-11-04 (commits `433d5cb`, `e30e63c`, `24f9f43`, `9b8cae2`)

## Decision
`get_delivery_context` เรียก exporter ที่ fixed path `architecture-docs/scripts/delivery_context.py` แบบ `shell: false`, env ถูก scrub (`PATH`, `LANG`, `PYTHONIOENCODING`, `PYTHONNOUSERSITE`, `EMPIRE_CLIENT_CONFIG=/nonexistent`), timeout 30s, maxBuffer 2 MiB; ตรวจ strict JSON (ห้าม duplicate keys), contract `solo-empire.delivery-context.v1`, SHA256 ของทุก source file, และ authority ทั้งสี่ต้องเป็น `not_verified`. ล้มเหลวคืน `status` `invalid` หรือ `unavailable` พร้อม error code เดียวจาก allowlist ไม่มี raw output.

## Evidence
- `src/delivery-context.ts` (`execute`, `validateResult`, `strictJson`, `getDeliveryContext`, `ADAPTER_CODES`, `EXPORTER_CODES`)
- `src/tools/delivery-context.ts` annotations `readOnlyHint: true`, `openWorldHint: false`
- `tests/delivery-context.test.ts` (27 tests)

## Consequences
- shared parser กับ owner CLI (`parseDeliveryCliArgs`) ทำให้ผลตรงกัน
- `runtime_integrated` เป็น `false` เสมอ: ไม่ใช่สถานะงานจริง
