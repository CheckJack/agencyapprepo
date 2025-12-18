# Quick Start Guide

## Initial Setup (5 minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and set:
   - `NEXTAUTH_SECRET`: Run `openssl rand -base64 32` to generate a secret
   - `DATABASE_URL`: Already set to `file:./dev.db` (SQLite)

3. **Initialize database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Seed with sample data:**
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

6. **Login:**
   - Agency Admin: `admin@uptnable.com` / `admin123`
   - Client User: `client@example.com` / `client123`

## What You Get

### Agency Portal (`/agency`)
- Dashboard with overview statistics
- Client management (create, view, edit clients)
- Project management
- Campaign management
- Billing and invoices

### Client Portal (`/client`)
- Dashboard with their data
- View projects and progress
- View campaigns
- View social media posts
- View blog posts
- View invoices and billing

## Next Steps

1. Create your first client via `/agency/clients/new`
2. Create projects for clients
3. Set up campaigns
4. Generate invoices

## Database Management

- View data: `npm run db:studio`
- Reset database: Delete `dev.db` and run `npm run db:push` again
- Reseed: `npm run seed`

## Production

For production, switch to PostgreSQL:
1. Update `DATABASE_URL` in `.env`
2. Change `provider` in `prisma/schema.prisma` to `postgresql`
3. Run `npm run db:push`

