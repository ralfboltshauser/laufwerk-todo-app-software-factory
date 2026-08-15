import { defineConfig } from "@laufwerk/sdk";
import { createMicrosandbox } from "@laufwerk/sandbox";

const sandboxBootstrap = [
  "apt-get update -qq && apt-get install -y --no-install-recommends ca-certificates git >/dev/null && update-ca-certificates -f >/dev/null",
  "npm install --global pnpm@10.28.1 bun@1.3.14 >/dev/null && pnpm --version && bun --version",
] as const;

export const sandboxes = {
  codex: createMicrosandbox({
    credentials: "codex-subscription",
    bootstrapCommands: sandboxBootstrap,
  }),
  claude: createMicrosandbox({
    credentials: "claude-subscription",
    bootstrapCommands: sandboxBootstrap,
  }),
} as const;

export default defineConfig({
  projectId: "30ed946e-d47c-49af-80ea-a0e74af5cdc6",
  sandboxes,
});
