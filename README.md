# Uptnable Agency Platform

A comprehensive internal system for marketing agencies to manage clients, projects, campaigns, social media, blogs, and billing. The platform includes both an agency portal for staff management and client portals for client access.

## Features

### Agency Portal
- **Dashboard**: Overview of clients, projects, campaigns, and revenue
- **Client Management**: Create, view, edit, and manage client accounts
- **Project Management**: Track projects across all clients
- **Campaign Management**: Manage email, social media, and blog campaigns
- **Social Media**: Schedule and track social media posts
- **Blog Management**: Create and manage blog posts for clients
- **Billing**: Generate and manage invoices

### Client Portal
- **Dashboard**: Overview of projects, campaigns, and spending
- **Projects**: View project status, tasks, and progress
- **Campaigns**: Track marketing campaign performance
- **Social Media**: View published social media posts and engagement
- **Blogs**: View published blog posts and analytics
- **Billing**: View invoices and payment history

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM) - easily upgradeable to PostgreSQL
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git

### Installation

1. Clone the repository:
```bash
cd /Applications/Uptnable
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `NEXTAUTH_SECRET`: Generate a random string (you can use `openssl rand -base64 32`)
- `DATABASE_URL`: Should be `file:./dev.db` for SQLite

4. Initialize the database:
```bash
npm run db:generate
npm run db:push
```

5. Seed the database with sample data:
```bash
npx tsx scripts/seed.ts
```

This creates:
- Admin user: `admin@uptnable.com` / `admin123`
- Sample client user: `client@example.com` / `client123`

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/Applications/Uptnable/
├── app/                    # Next.js app directory
│   ├── agency/            # Agency portal pages
│   ├── client/            # Client portal pages
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility functions and configurations
├── prisma/                # Database schema
├── scripts/               # Utility scripts (seed, etc.)
└── types/                 # TypeScript type definitions
```

## Database Schema

The platform uses Prisma with the following main models:

- **User**: Agency staff and client users with role-based access
- **Client**: Client companies
- **Project**: Client projects with tasks
- **Campaign**: Marketing campaigns (email, social media, blog)
- **CampaignMetric**: Campaign performance metrics
- **SocialMediaPost**: Social media posts and engagement
- **BlogPost**: Blog posts with analytics
- **Invoice**: Billing and invoices

## User Roles

- **AGENCY_ADMIN**: Full access to agency portal, can manage everything
- **AGENCY_STAFF**: Access to agency portal, can manage clients and projects
- **CLIENT_ADMIN**: Full access to client portal for their company
- **CLIENT_USER**: Limited access to client portal (read-only in some areas)

## API Routes

- `GET/POST /api/clients` - List/create clients
- `GET/PUT/DELETE /api/clients/[id]` - Get/update/delete client
- `GET/POST /api/projects` - List/create projects
- `GET/POST /api/campaigns` - List/create campaigns

## Development

### Database Management

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Adding New Features

1. Update Prisma schema if needed (`prisma/schema.prisma`)
2. Run `npm run db:push` to apply changes
3. Create API routes in `app/api/`
4. Create pages in `app/agency/` or `app/client/`
5. Add components in `components/` as needed

## Production Deployment

1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite:
   - Update `DATABASE_URL` in `.env`
   - Change `provider` in `prisma/schema.prisma` to `postgresql`
   - Run migrations
3. Set a strong `NEXTAUTH_SECRET`
4. Build the application: `npm run build`
5. Start the server: `npm start`

## Security Notes

- Passwords are hashed using bcrypt
- Role-based access control enforced via middleware
- API routes validate user permissions
- Client users can only access their own data

## Future Enhancements

- Real-time notifications
- Advanced analytics and reporting
- File uploads for documents and images
- Email notifications
- Calendar integration
- Team collaboration features
- Custom branding per client portal
- Multi-language support

## License

Proprietary - Internal use only

## Support

For issues or questions, contact the development team.

