# Complete Installation Steps

## Step-by-Step Installation Guide

### Part 1: Initial Setup

#### 1.1 Clone Repository

```bash
git clone https://github.com/MGalaCyber/Service-Status-Page.git
cd Service-Status-Page
pnpm install
```

#### 1.2 Create Supabase Project

1. Go to https://supabase.com
2. Click "New project"
3. Choose region closest to you
4. Wait 2-5 minutes for setup

#### 1.3 Get API Credentials

1. Go to Settings > API in your Supabase project
2. Copy and save:
    - Project URL (under "API URL")
    - Anon public key
    - Service role key
    - Database password (for direct DB access if needed)

### Part 2: Database Setup

#### 2.1 Create Tables

1. In Supabase Dashboard, go to SQL Editor
2. Create new query
3. Copy entire content from `scripts/init-schema.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Wait for completion (should succeed with no errors)

#### 2.2 Verify Tables

In SQL Editor, run:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public'
ORDER BY table_name;
```

You should see:

-   incidents
-   incident_updates
-   service_stats
-   services

#### 2.3 Add Admin User

In SQL Editor, run:

```sql
SELECT auth.admin.create_user(
  email := 'admin@example.com',
  password := 'admin123',
  email_confirm := true
);
```

#### 2.4 Add Sample Services

In SQL Editor, run:

```sql
INSERT INTO services (name, domain, description, status, is_pinned) VALUES
('API Server', 'https://api.example.com', 'Main REST API', 'operational', true),
('Web App', 'https://app.example.com', 'Frontend Application', 'operational', false),
('Database', 'https://db.example.com', 'PostgreSQL', 'operational', false),
('Cache', 'https://cache.example.com', 'Redis', 'operational', false),
('Email', 'https://email.example.com', 'Email Service', 'operational', false);
```

### Part 3: Environment Variables

#### 3.1 Create .env.local

In root directory, create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (from Connection Pooling or Direct)
POSTGRES_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Monitoring
CRON_SECRET=your-super-secret-random-string-here
NEXT_PUBLIC_VISITOR_ID=123abc

# Development (optional)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
MONITORING_API_URL=http://localhost:3000
```

**How to get credentials:**

-   `NEXT_PUBLIC_SUPABASE_URL`: Settings > API > Project URL
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings > API > Anon public
-   `SUPABASE_SERVICE_ROLE_KEY`: Settings > API > Service role secret
-   `POSTGRES_URL`: Settings > Database > Connection Pooling > PostgreSQL (Connection pooling)
-   `POSTGRES_URL_NON_POOLING`: Settings > Database > Connection String > PostgreSQL (Non-pooling)
-   `CRON_SECRET`: open terminal and run `openssl rand -hex 32`
-   `NEXT_PUBLIC_VISITOR_ID`: [Click Here](https://visitorcounter.galaxd.com)

### Part 4: Local Testing

#### 4.1 Start Development Server

```bash
pnpm run dev
```

#### 4.2 Test Status Page

-   Open http://localhost:3000
-   You should see status page with sample services
-   Charts might be empty (need monitoring data)

#### 4.3 Test Admin Dashboard

-   Open http://localhost:3000/admin/login
-   Email: `admin@example.com`
-   Password: `admin123`
-   Should login successfully

#### 4.4 Add New Service in Admin

-   In admin dashboard, fill form:
    -   Name: "Test Service"
    -   Domain: "https://test.example.com"
    -   Description: "Test"
-   Click "Add Service"
-   Should appear in services list

#### 4.5 Pin a Service

-   Click pin icon on any service
-   Service should move to top
-   Refresh page - should still be pinned

#### 4.6 Test Monitoring (Manual)

```bash
# In another terminal, run:
npm run monitor

# Or call API directly:
curl http://localhost:3000/api/monitor
```

Response should show success with services checked count.

### Part 5: Deploy to Vercel

#### 5.1 Push to GitHub

```bash
git add .
git commit -m "Initial status page setup"
git push origin main
```

#### 5.2 Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repo
4. Wait for preview deployment

#### 5.3 Add Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

Add all from .env.local:

-   NEXT_PUBLIC_SUPABASE_URL
-   NEXT_PUBLIC_SUPABASE_ANON_KEY
-   SUPABASE_SERVICE_ROLE_KEY
-   POSTGRES_URL
-   POSTGRES_URL_NON_POOLING
-   CRON_SECRET
-   NEXT_PUBLIC_VISITOR_ID

#### 5.4 Deploy

1. Push any commit to trigger deployment
2. Or click "Deploy" button in Vercel
3. Wait for build completion
4. Get your production URL

#### 5.5 Test Production

-   Open production URL
-   Status page should load
-   Admin login should work
-   Monitoring should run every 5 minutes

### Part 6: Verify Monitoring

#### 6.1 Manual Monitor Call

```bash
curl https://your-deployment.vercel.app/api/monitor
```

Response:

```json
{ "success": true, "servicesChecked": 5 }
```

#### 6.2 Check Database for Stats

In Supabase > service_stats table, you should see recent records with:

-   service_id
-   timestamp
-   status
-   ping_ms
-   response_time_ms

### Part 7: Customization (Optional)

#### 7.1 Add Real Services

Replace example URLs with real services:

-   SQL: `UPDATE services SET domain = 'https://real-api.com' WHERE ...`
-   Or via Admin Dashboard

#### 7.2 Custom Domain

In Vercel > Settings > Domains:

-   Add your custom domain
-   Follow DNS setup instructions

### Troubleshooting

**Can't connect to database:**

-   Verify all env vars are correct
-   Check Supabase project is active
-   Try connection string in different tool first

**Admin login fails:**

-   Verify admin user exists in database
-   Check email and password exactly
-   Ensure .env.local has correct credentials

**Charts are empty:**

-   Monitoring needs time to accumulate data
-   Wait 10 minutes (2 monitoring cycles)
-   Manually trigger monitoring: `curl /api/monitor`

**Cron job not running:**

-   Check vercel.json syntax
-   Verify environment variables in Vercel
-   Check Vercel cron job logs

**Real-time updates not working:**

-   Check browser console for errors
-   Verify Supabase connection
-   Check RLS policies are set correctly

### Support & Resources

-   Supabase Docs: https://supabase.com/docs
-   Next.js Docs: https://nextjs.org/docs
-   Vercel Docs: https://vercel.com/docs
-   GitHub Issues: Submit issues in repository

---

**Congratulations!** Your status page is now live! 🎉
