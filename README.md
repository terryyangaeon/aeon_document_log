# AEON Document Log

Document reference number management system with Microsoft SSO integration.

## Features

- **Log Sheet**: Create and manage document log entries with auto-generated reference numbers
- **Staff Records**: Maintain staff directory with name, initials, and contact info
- **Configuration**: Manage system codes (document prefixes)
- **Microsoft SSO**: Single sign-on with Microsoft Entra ID (Azure AD)

## Reference Number Format

Reference numbers are auto-generated in the format: `PREFIX/SENDER_INITIAL/SEQ/YEAR/DRAFTER_INITIAL`

Example: `ADA/MB/246/2026/pc`
- `ADA` - Prefix from system configuration
- `MB` - Sender's initial (uppercase)
- `246` - Auto-increment sequence (3 digits, zero-padded, resets yearly)
- `2026` - Year from document date
- `pc` - Drafter's initial (lowercase)

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Database**: PostgreSQL with Prisma 7 ORM
- **Auth**: NextAuth.js v5 with Microsoft Entra ID
- **Hosting**: Zeabur

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Generate Prisma client: `npx prisma generate`
5. Run migrations: `npx prisma migrate dev`
6. Seed data: `npx tsx prisma/seed.ts`
7. Start dev server: `npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AZURE_AD_CLIENT_ID` | Microsoft Entra ID app client ID |
| `AZURE_AD_CLIENT_SECRET` | Microsoft Entra ID app client secret |
| `AZURE_AD_TENANT_ID` | Microsoft Entra ID tenant ID |
| `NEXTAUTH_URL` | Application URL |
| `NEXTAUTH_SECRET` | NextAuth.js secret key |

## Deploy to Zeabur

1. Connect your GitHub repo to Zeabur
2. Add a PostgreSQL service
3. Set the environment variables
4. Deploy
