# Laufwerk Todo software factory

A small authenticated Todo app used to exercise an issue-to-preview software
factory built with Laufwerk.

## Application

```bash
bun install
cp .env.example .env.local
bun run db:migrate
bun run dev
```

The stack is Next.js, Better Auth, Drizzle, Neon, and Vercel. Email/password
authentication intentionally has no email verification or password reset in
this experiment.

## Checks

```bash
bun run check
bun run test:e2e
```

## Factory

`laufwerk/workflows/issue-to-preview-pr/workflow.ts` turns one GitHub issue into
a verified Vercel preview:

1. Codex inspects the repository and proposes a plan.
2. Studio asks a human to approve the plan.
3. Codex implements in a persistent Microsandbox workspace.
4. Deterministic checks run in that exact sandbox.
5. Laufwerk writes back, pushes a branch, and creates a draft PR.
6. Vercel and Neon create an isolated preview environment.
7. Playwright and a read-only Claude session verify the result.
8. Studio asks a human before a host-side squash merge.

Run it from the repository root:

```bash
bun /path/to/laufwerk/packages/cli/src/bin.ts run issue-to-preview-pr \
  --input '{"executionKey":"issue-1-v1","issueNumber":1}'
```

The committed consumer package currently points to a sibling Laufwerk checkout
because Laufwerk is not published yet. GitHub, Vercel, and production database
credentials remain on the host; agent sandboxes receive only Codex or Claude
subscription credentials.
