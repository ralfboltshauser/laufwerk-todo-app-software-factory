# Repository contract

This is a deliberately small, mobile-first Todo application.

- Run `bun run check` before proposing a change.
- Keep the application accessible at a 320px viewport.
- Every Todo query and mutation must be scoped to the authenticated server-side user.
- Database changes require a committed Drizzle migration.
- Do not modify `laufwerk/`, `.github/`, `.env*`, or `.vercel/` from a product workflow.
- Do not add architectural layers or dependencies without a concrete need.
