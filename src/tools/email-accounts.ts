import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    accountServicesQuerySchema, EmailRegistryError, getAccountServices, listEmailAccounts, loadEmailRegistry,
} from "../email-accounts.js";

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function reply(read: () => object) {
    try {
        const result = read();
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result as Record<string, unknown> };
    } catch (error) {
        const message = error instanceof EmailRegistryError ? error.message : "email registry read failed";
        return { content: [{ type: "text" as const, text: message }], isError: true };
    }
}

export function registerEmailAccountTools({ server }: { server: McpServer }, env: NodeJS.ProcessEnv = process.env): void {
    server.registerTool("list_email_accounts", {
        title: "Email accounts",
        description: "List every email address in the registry (provider, owner, status, which connector reads it) with how many services each is linked to, split by confidence.",
        inputSchema: {},
        annotations: READ_ONLY,
    }, async () => reply(() => listEmailAccounts(loadEmailRegistry(env))));

    server.registerTool("get_account_services", {
        title: "Services per email account",
        description: "Which services an email address is signed up to (or which email a service uses). Each link says its evidence and confidence: report inferred or unknown links as unverified, never as fact.",
        inputSchema: accountServicesQuerySchema,
        annotations: READ_ONLY,
    }, async (query) => reply(() => getAccountServices(loadEmailRegistry(env), query)));
}
