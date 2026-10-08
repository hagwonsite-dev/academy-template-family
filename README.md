# 우리의 배움 — Family Academy

학부모와 학생의 하루를 위한 모바일 우선 포털. 실제 shadcn/ui, Next.js App Router, Hono, strict TypeScript. Turso Tokyo / Vercel Seoul.

## Run

Node 22.19+, `npm ci`, `npm run dev`. Local SQLite receives fictional family records. Open http://127.0.0.1:3100. For shared public demo set PUBLIC_DEMO=1 and READ_ONLY=0. For a password-protected prototype set APP_PASSWORD and sign in with admin / that password.

The role switch is a **demo persona selector**, not family authentication. Do not store real student information in this example. Real operation requires authenticated family invitations, account ownership and per-user authorization. Parent demo sees two children; student demo sees only Haneul, including scoped invoice browsing and simulated payment. Teacher messages are parent-only in this demo; this is not a claim about unverified On-hi student messaging permissions. The server checks child scope on reads and writes; switching the public demo role is intentionally permitted.

Monthly attendance summaries, pass usage ledgers, invoice discounts and fictional partial refunds are available. Bundle payments update all selected unpaid invoices atomically on Turso/SQLite or reject the entire selection. Schedule intentions respect the academy setting. Notice comments/replies support author-role editing and tombstone deletion. Teacher-specific messages accept up to three provided fictional illustration attachments; this is not a personal photo upload service. Schedule intentions, notice receipts, votes, comments, messages and simulated payments persist in the database. Teacher messages are fictional; no SMS/push or actual card processing. Shared public records can be changed by other visitors. Do not enter personal information.

## Deploy

The catalog accepts a fork of this repository (`academy-template.json` must remain). It provisions additive SQL migrations in Turso before deploying to Vercel Seoul. Set TURSO_DATABASE_URL / TURSO_AUTH_TOKEN server-side. Remote startup never creates tables or inserts demo data. To populate a public demonstration, an administrator must apply `src/seed.ts`'s `demoSeed()` statements using a short-lived database token before deployment. An authenticated owner of a new private deployment can explicitly click “가상 가족 데이터 생성” on the setup screen; this inserts fictional rows idempotently. This is a sample portal, not a production onboarding system.

## Verify

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
After building: `npx playwright test`. Tests use a temporary local database, verify child and role scope, all main views at 390/768/1440/1920px, persistent actions, CSRF rejection and accessible shadcn dialogs.

## Research

Independent example inspired by publicly documented On-hi flows:
- https://guide.on-hi.com/88697cfe-2635-4024-afe2-11517388550f
- https://www.on-hi.com/features/parent-app/
- https://www.on-hi.com/features/notice/

The student-only layout and permission differences are this example's own design, not a claim about On-hi's exact implementation. No On-hi branding or screenshots are redistributed.
