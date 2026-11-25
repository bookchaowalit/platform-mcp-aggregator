import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

/**
 * Sibling-repository lookups. mcp-aggregator depends on no hub layout: every other
 * checkout is found through an explicit env var, or the sibling folder that
 * sits next to this repository (../<repo>).
 */

/** This repository's root (src/ or dist/ is one level below it). */
export const MCP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function sibling(envName: string, repo: string, env: NodeJS.ProcessEnv = process.env): string {
    return env[envName] ? resolve(env[envName] as string) : resolve(MCP_ROOT, "..", repo);
}

/** ops-toolkit checkout (Python scripts the tools shell out to, owner CLI, .runtime tokens). Override: SOLO_OPS_ROOT. */
export function opsRoot(env: NodeJS.ProcessEnv = process.env): string {
    return sibling("SOLO_OPS_ROOT", "platform-ops-cli", env);
}

/** Directory holding the ops-toolkit Python scripts. Override: SOLO_OPS_SCRIPTS_DIR. */
export function opsScriptsDir(env: NodeJS.ProcessEnv = process.env): string {
    return env.SOLO_OPS_SCRIPTS_DIR ? resolve(env.SOLO_OPS_SCRIPTS_DIR) : resolve(opsRoot(env), "infra", "scripts");
}

/** data-lake checkout. Override: SOLO_DATA_LAKE_ROOT. */
export function dataLakeRoot(env: NodeJS.ProcessEnv = process.env): string {
    return sibling("SOLO_DATA_LAKE_ROOT", "data-lake-pipelines", env);
}

/** Architecture definitions and central templates. Override: SOLO_ARCHITECTURE_ROOT. */
export function architectureRoot(env: NodeJS.ProcessEnv = process.env): string {
    return sibling("SOLO_ARCHITECTURE_ROOT", "architecture-docs", env);
}

/**
 * Architecture document tooling (scripts/delivery_context.py and the other guards), moved out of the
 * document tree into platform-ops-cli/architecture (SPEC-001, knowledge store
 * plans/architecture-docs-store/). Override: SOLO_ARCHITECTURE_TOOLS.
 */
export function architectureToolsRoot(env: NodeJS.ProcessEnv = process.env): string {
    // Operator configuration, not request input. When getDeliveryContext falls back to this folder it
    // first refuses ".." and denied components in the raw SOLO_ARCHITECTURE_TOOLS and SOLO_OPS_ROOT
    // values, then checks the exporter path component by component (no symlinks) before spawning.
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    return env.SOLO_ARCHITECTURE_TOOLS ? resolve(env.SOLO_ARCHITECTURE_TOOLS) : resolve(opsRoot(env), "architecture");
}

/** Policy documents use the architecture checkout's sibling, including custom architecture roots. */
export function knowledgeRoot(env: NodeJS.ProcessEnv = process.env): string {
    return env.SOLO_KNOWLEDGE_ROOT !== undefined
        ? resolve(env.SOLO_KNOWLEDGE_ROOT)
        : resolve(architectureRoot(env), "..", "knowledge-base");
}

/**
 * The Solo Empire repository-catalog folder (registries/email-accounts.yaml lives under it). There is no sibling default: the hub is
 * not a sibling checkout, so its launcher passes SOLO_REGISTRY_DIR explicitly. Returns undefined when unset.
 */
export function registryDir(env: NodeJS.ProcessEnv = process.env): string | undefined {
    return env.SOLO_REGISTRY_DIR ? resolve(env.SOLO_REGISTRY_DIR) : undefined;
}
