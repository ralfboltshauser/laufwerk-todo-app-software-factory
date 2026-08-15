import type { HarnessAgentSkill } from "@laufwerk/sdk/harness";

export const repositorySkill = {
  name: "laufwerk-todo-repository",
  description: "Work safely in the small Laufwerk Todo application.",
  content: [
    "Read AGENTS.md before changing code.",
    "Keep every Todo operation scoped to the authenticated server-side user.",
    "Preserve the mobile-first 320px experience and accessible HTML controls.",
    "Database changes require a committed Drizzle migration.",
    "Do not modify laufwerk/, .github/, .env files, or .vercel/.",
    "Prefer the smallest change that satisfies the issue and run bun run check.",
  ].join("\n"),
} satisfies HarnessAgentSkill;
