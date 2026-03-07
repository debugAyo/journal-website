# Ubuntu Journal (UJ) - Academic Journal Platform

A full-featured academic journal management system built with Next.js 16, Prisma ORM, and PostgreSQL.

## Features

- **User Roles**: AUTHOR, REVIEWER, EDITOR, ADMIN with role-based access control
- **Manuscript Submission**: Authors can submit manuscripts with co-author information
- **Peer Review**: Double-blind peer review workflow with quality ratings
- **Editorial Dashboard**: Editor tools for reviewer assignment, decision-making
- **Revision System**: Authors can submit revisions based on reviewer feedback
- **Publication**: Admin tools for organizing issues, volumes, and publishing articles
- **Public Site**: Browse issues, search articles, view article landing pages

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **File Uploads**: Cloudinary
- **Styling**: Tailwind CSS v4
- **Email**: SendGrid or SMTP (Nodemailer)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Cloudinary account
- SendGrid account (or SMTP server)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd journal-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.production.example .env
   # Edit .env with your values
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3002 in your browser.

### Test Accounts (After Seeding)

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@ubuntu-journal.org    | password123 |
| Editor   | editor@ubuntu-journal.org   | password123 |
| Reviewer | reviewer1@example.com    | password123 |
| Reviewer | reviewer2@example.com    | password123 |
| Author   | author1@example.com      | password123 |
| Author   | author2@example.com      | password123 |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset database and re-seed

## Project Structure

```
app/
├── api/                    # API routes
│   ├── admin/              # Admin APIs (users, volumes, issues, publish)
│   ├── auth/               # Authentication endpoints
│   ├── editor/             # Editor APIs (submissions, reviewers, decisions)
│   ├── reviewer/           # Reviewer APIs (my-reviews, accept, decline, submit)
│   ├── search/             # Public search API
│   ├── submissions/        # Submission APIs (create, my-submissions, resubmit)
│   └── upload/             # File upload API
├── about/                  # Public about page
├── articles/[id]/          # Public article landing page
├── auth/                   # Login/register pages
├── dashboard/              # Protected dashboard pages
│   ├── admin/              # Admin pages (users, issues, publish)
│   ├── editor/             # Editor pages (submissions, decisions)
│   ├── my-submissions/     # Author submissions list
│   ├── reviewer/           # Reviewer dashboard and review form
│   ├── revision/           # Revision upload page
│   └── submit/             # New submission form
├── editorial-board/        # Public editorial board page
├── issues/                 # Public issue browser
├── search/                 # Public search page
└── submit/                 # Public author guidelines
lib/
└── prisma.js               # Prisma client singleton
prisma/
├── schema.prisma           # Database schema
├── seed.js                 # Database seeder
└── migrations/             # Migration files
docs/                       # Handover documentation
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker / VPS

1. Build the application:
   ```bash
   npm run build
   ```

2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Start the server:
   ```bash
   npm run start
   ```

See `docs/RUNBOOK.md` for detailed deployment and operations guide.

## Documentation

- [Admin Manual](docs/ADMIN_MANUAL.md)
- [Editor Manual](docs/EDITOR_MANUAL.md)
- [Author Manual](docs/AUTHOR_MANUAL.md)
- [Reviewer Manual](docs/REVIEWER_MANUAL.md)
- [Operations Runbook](docs/RUNBOOK.md)

## License

MIT
