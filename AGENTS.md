# Repository contract

This is a deliberately small, mobile-first Todo application.

- Run `bun run check` before proposing a change.
- Keep the application accessible at a 320px viewport.
- Every Todo query and mutation must be scoped to the authenticated server-side user.
- Database changes require a committed Drizzle migration.
- Do not modify `laufwerk/`, `.github/`, `.env*`, or `.vercel/` from a product workflow.
- Do not add architectural layers or dependencies without a concrete need.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
