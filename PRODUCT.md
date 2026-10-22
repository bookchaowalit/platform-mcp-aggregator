# Product

<!-- impeccable:product-schema 1 -->

## Platform

mcp server (local stdio, TypeScript)

## Users

- The owner's AI agents (Claude Code, Codex and others) started from a harness that wires
  `npx tsx <checkout>/src/index.ts`, for example the `solo-empire` hub's `.mcp.json`.
- Through those agents, the owner: tasks, goals, habits, decisions, revenue, dashboard,
  analytics, cron, skills, bookmarks, free images, SEO reports and the delivery context.

## Product Purpose

One local MCP server that gives agents typed, validated tools over the owner's systems, so an
agent never needs raw database access, ad-hoc shell commands or guessed paths to read a task,
log a habit or look up a delivery workflow.

Success: agents finish owner workflows through these tools, every tool answers with a fixed
contract or a clear error code, and nothing reaches a production API from tests.

## Positioning

A thin adapter, not a second backend: tools call the cell and CRM HTTP APIs with the caller's
own token, or shell out to the owning repository's scripts (`platform-ops-cli`,
`architecture-docs`, `data-lake-pipelines`) found through `SOLO_*_ROOT` variables. The hosted
counterpart for remote clients is the Cloudflare Worker tool hub (`platform-mcp-remote-worker`).

## Operating Context

- Not deployed: runs as a stdio process on the owner's machine; a session must restart to see
  new tools (`tools/list`).
- CI: shared `ci-node` (`tsc --noEmit`, `tsx --test`) and the security workflow on GitHub-hosted
  runners; tests run with `EMPIRE_CLIENT_CONFIG=/nonexistent`.
- Sentry does not apply: the server lives only inside the owner's agent session, and an error
  reporter would send tool arguments (task text, revenue, decisions) to a third party. Tool
  errors return fixed error codes to the agent, which shows them in the session.

## Capabilities and Constraints

- Tool modules in `src/tools/` (one `register*Tools(context)` each); names, schemas and response
  contracts stay backward compatible unless the MCP version changes on purpose.
- `get_delivery_context` is read-only and validates the `architecture-docs` exporter output
  (contract `solo-empire.delivery-context.v1`, source SHA256) before returning it.
- Callers cannot set roots, paths, commands or environment; a missing script fails with a
  clear message.
- Out of scope: creating approvals, sending client documents, and any hosted deployment.

## Measures

- Tool calls that fail with an unexpected error rather than a defined error code
  ([ต้องยืนยัน] needs local call logging).
- `task check` green on `main` (target: always).
- Tools without a test of their response contract (target: 0) [ต้องยืนยัน current count].
