# quiko-app

The Quiko **web app + backend/API + database**. Next.js 16, Drizzle ORM, Postgres.

**Setup and commands live in the repo root [`../README.md`](../README.md).** Quick version:

```bash
npm install
cp .env.example .env.local     # set SESSION_SECRET (openssl rand -base64 32)
npm run db:up                  # Postgres via Docker (host port 5433)
npm run db:migrate && npm run db:seed
npm run dev                    # http://localhost:3000
```

Dev login: any phone + OTP `123456`.

More detail:
- `ARCHITECTURE.md` — how the code is organized.
- `AGENTS.md` — ⚠️ this is a modified Next.js 16; read before coding.
- `../plan.md` — feature history and what's pending.
