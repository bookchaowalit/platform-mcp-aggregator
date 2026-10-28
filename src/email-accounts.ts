import { readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";
import { z } from "zod";
import { registryDir } from "./roots.js";

/**
 * Read-only view of the hub's email account registry (email-accounts.yaml): which addresses exist and which services
 * each is signed up to. Every link keeps its evidence (api, inbox, manual) and confidence (confirmed, inferred,
 * unknown) so callers can tell a fact from a guess. The registry stores no secret values, only Infisical paths.
 */

export const EMAIL_ACCOUNTS_SCHEMA = "solo-empire.email-accounts.v1";
export const CONFIDENCE = ["confirmed", "inferred", "unknown"] as const;

type Link = { email: string; evidence: string; confidence: (typeof CONFIDENCE)[number]; checked: string;
    login?: string; secret?: string; seen?: string; notes?: string };
type Service = { id: string; name: string; category?: string; accounts?: Link[] };
type Account = { email: string; provider: string; owner?: string; status: string; purpose?: string;
    access?: Record<string, string>; notes?: string };
export type EmailRegistry = { schema_version: string; updated: string; accounts?: Account[]; services?: Service[] };

export class EmailRegistryError extends Error {}

export function loadEmailRegistry(env: NodeJS.ProcessEnv = process.env): EmailRegistry {
    const dir = registryDir(env);
    if (!dir) throw new EmailRegistryError("SOLO_REGISTRY_DIR is not set; start the server from the solo-empire hub launcher");
    let data: EmailRegistry;
    try {
        data = parse(readFileSync(resolve(dir, "registries", "email-accounts.yaml"), "utf-8"));
    } catch {
        throw new EmailRegistryError("email-accounts.yaml could not be read from SOLO_REGISTRY_DIR/registries");
    }
    if (data?.schema_version !== EMAIL_ACCOUNTS_SCHEMA) {
        throw new EmailRegistryError(`email-accounts.yaml schema_version is not ${EMAIL_ACCOUNTS_SCHEMA}`);
    }
    return data;
}

const count = (links: Link[]) => Object.fromEntries(CONFIDENCE.map((c) => [c, links.filter((l) => l.confidence === c).length]));

export function listEmailAccounts(registry: EmailRegistry) {
    const links = (registry.services ?? []).flatMap((s) => s.accounts ?? []);
    return {
        updated: registry.updated,
        accounts: (registry.accounts ?? []).map((account) => {
            const own = links.filter((l) => l.email.toLowerCase() === account.email.toLowerCase());
            return { ...account, services: own.length, by_confidence: count(own) };
        }),
    };
}

export const accountServicesQuerySchema = {
    email: z.string().optional().describe("Only services linked to this email address"),
    service: z.string().optional().describe("Only services whose id or name contains this text (case-insensitive)"),
    confidence: z.enum(CONFIDENCE).optional().describe("Only links with this confidence"),
    category: z.string().optional().describe("Only services in this category, e.g. cloud, ai, finance"),
};
const querySchema = z.object(accountServicesQuerySchema);
export type AccountServicesQuery = z.infer<typeof querySchema>;

export function getAccountServices(registry: EmailRegistry, query: AccountServicesQuery) {
    const email = query.email?.toLowerCase();
    const text = query.service?.toLowerCase();
    const services = (registry.services ?? [])
        .filter((s) => !query.category || s.category === query.category)
        .filter((s) => !text || s.id.toLowerCase().includes(text) || s.name.toLowerCase().includes(text))
        .map((s) => ({
            id: s.id, name: s.name, category: s.category,
            accounts: (s.accounts ?? []).filter((l) => (!email || l.email.toLowerCase() === email)
                && (!query.confidence || l.confidence === query.confidence)),
        }))
        .filter((s) => s.accounts.length > 0);
    return {
        updated: registry.updated,
        note: "confirmed = provider API or manual check; inferred = signup/billing mail only; unknown = not verified",
        total: services.length,
        by_confidence: count(services.flatMap((s) => s.accounts)),
        services,
    };
}
