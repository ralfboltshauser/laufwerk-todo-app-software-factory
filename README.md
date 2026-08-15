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

The repository-local Laufwerk workflow is documented after its first verified
end-to-end run.
