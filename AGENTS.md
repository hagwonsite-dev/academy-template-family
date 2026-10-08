# Family portal template

Use real shadcn/ui primitives in components/ui. Preserve strict TypeScript, responsive mobile navigation and accessible form labels. Keep database credentials exclusively on the server.

This template is a fictional parent/student demo. Role selection is not authentication. Keep the demo warning and do not imply that real payments, push notifications or messages to a live teacher were sent. Never add real family data without authenticated membership and server-side ownership checks.

All reads and writes must validate role and student scope in src/portal.ts. Staff-only consultation records must not enter portal queries. Retain same-origin write checks in proxy and API routes. Never migrate or seed a remote database during GET/startup. Private owners may explicitly initialize fictional fixtures through the guarded setup action.

Applied migrations are immutable. Add new migration directories and preserve existing data. Never commit .env files or credentials. Deploy Next.js to Vercel Seoul with the template's own Turso database.

Run npm run lint, npm run typecheck, npm test, npm run build. After building, npx playwright test checks local persistent workflows and responsive layouts. Use a temporary local database for tests, never the public demo database.
