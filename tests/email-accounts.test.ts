import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { getAccountServices, listEmailAccounts, loadEmailRegistry } from "../src/email-accounts.js";
import { registerEmailAccountTools } from "../src/tools/email-accounts.js";

const dir = mkdtempSync(join(tmpdir(), "email-accounts-"));
after(() => rmSync(dir, { recursive: true, force: true }));
mkdirSync(join(dir, "registries"));
writeFileSync(join(dir, "registries", "email-accounts.yaml"), `schema_version: solo-empire.email-accounts.v1
updated: '2026-10-28'
accounts:
- {email: me@example.com, provider: google, owner: personal, status: active}
- {email: work@example.com, provider: microsoft-365, owner: company, status: active}
services:
- id: github
  name: GitHub
  category: dev
  accounts:
  - {email: me@example.com, evidence: api, confidence: confirmed, checked: '2026-10-28', secret: 'infisical:/github/TOKEN'}
- id: aws
  name: AWS
  category: cloud
  accounts:
  - {email: me@example.com, evidence: inbox, confidence: inferred, checked: '2026-10-28'}
- id: railway
  name: Railway
  category: cloud
  accounts:
  - {email: Work@example.com, evidence: manual, confidence: unknown, checked: '2026-10-28'}
`);
const env = { SOLO_REGISTRY_DIR: dir };

test("list_email_accounts counts services per confidence", () => {
    const result = listEmailAccounts(loadEmailRegistry(env));
    const me = result.accounts.find((a) => a.email === "me@example.com")!;
    assert.equal(me.services, 2);
    assert.deepEqual(me.by_confidence, { confirmed: 1, inferred: 1, unknown: 0 });
    assert.equal(result.accounts.find((a) => a.email === "work@example.com")!.services, 1);
});

test("get_account_services filters by email, text, confidence and category", () => {
    const registry = loadEmailRegistry(env);
    assert.deepEqual(getAccountServices(registry, { email: "WORK@example.com" }).services.map((s) => s.id), ["railway"]);
    assert.deepEqual(getAccountServices(registry, { service: "git" }).services.map((s) => s.id), ["github"]);
    assert.deepEqual(getAccountServices(registry, { confidence: "inferred" }).services.map((s) => s.id), ["aws"]);
    assert.deepEqual(getAccountServices(registry, { category: "cloud" }).services.map((s) => s.id), ["aws", "railway"]);
    assert.equal(getAccountServices(registry, { email: "nobody@example.com" }).total, 0);
});

test("missing SOLO_REGISTRY_DIR or a wrong schema fails clearly", () => {
    assert.throws(() => loadEmailRegistry({}), /SOLO_REGISTRY_DIR is not set/);
    const bad = mkdtempSync(join(tmpdir(), "email-accounts-bad-"));
    mkdirSync(join(bad, "registries"));
    writeFileSync(join(bad, "registries", "email-accounts.yaml"), "schema_version: other\n");
    assert.throws(() => loadEmailRegistry({ SOLO_REGISTRY_DIR: bad }), /schema_version/);
    rmSync(bad, { recursive: true, force: true });
});

test("tools answer over MCP and report a missing registry as an error", async () => {
    for (const [toolEnv, isError] of [[env, false], [{}, true]] as const) {
        const server = new McpServer({ name: "test", version: "0" });
        registerEmailAccountTools({ server }, toolEnv);
        const client = new Client({ name: "client", version: "0" });
        const [a, b] = InMemoryTransport.createLinkedPair();
        await Promise.all([server.connect(a), client.connect(b)]);
        const names = (await client.listTools()).tools.map((t) => t.name).sort();
        assert.deepEqual(names, ["get_account_services", "list_email_accounts"]);
        const result = await client.callTool({ name: "get_account_services", arguments: { service: "aws" } });
        assert.equal(Boolean(result.isError), isError);
        if (!isError) assert.equal((result.structuredContent as { total: number }).total, 1);
        await client.close();
    }
});
