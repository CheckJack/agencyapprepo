# Setup Checklist

## What's Missing to Get Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` and set:
- `NEXTAUTH_SECRET`: Generate a random secret (run `openssl rand -base64 32` or use any random string)
- `DATABASE_URL`: Should be `file:./dev.db` (already correct for SQLite)
- `NEXTAUTH_URL`: Should be `http://localhost:3000` for development

Example `.env`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key-here"
NODE_ENV="development"
```

### 3. Initialize Database
```bash
npm run db:generate
npm run db:push
```

### 4. Seed Sample Data
```bash
npm run seed
```

This creates:
- Admin user: `admin@uptnable.com` / `admin123`
- Sample client: `client@example.com` / `client123`

### 5. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Quick Verification

After setup, you should be able to:
1. ✅ Visit http://localhost:3000 and be redirected to `/login`
2. ✅ Login with `admin@uptnable.com` / `admin123`
3. ✅ See the agency dashboard
4. ✅ Access `/agency/clients` to see the sample client
5. ✅ Logout and login with `client@example.com` / `client123`
6. ✅ See the client dashboard

## Common Issues

### "Module not found" errors
- Run `npm install` to install all dependencies

### "Prisma Client not generated"
- Run `npm run db:generate`

### "Database not found"
- Run `npm run db:push` to create the database

### "Authentication errors"
- Make sure `.env` file exists with `NEXTAUTH_SECRET` set
- Restart the dev server after creating `.env`

### "Cannot find module '@/lib/auth-server'"
- This file was just created - make sure it exists
- Restart your TypeScript server/IDE if needed

