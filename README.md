# 📊 Advanced Status Page

![Preview](./public/preview.png)

Professional real-time status page with automation monitoring, incident tracking, dan advanced analytics.

---

## 🚀 Features

### Public Status Page

-   ✅ **Real-time Status Display** - Live service status with auto-refresh
-   ✅ **90-Day Status Bar** - Visual history with colored bars (green/yellow/red/gray)
-   ✅ **Hover Tooltips** - Show date, status, ping, response time, request count
-   ✅ **Service Pinning** - Pin important services to top with dashed separator
-   ✅ **Pinned Services Section** - Prominently display critical services

### Statistics & Analytics

-   ✅ **Response Time Charts** - Area chart with gradient fill for 30 days
-   ✅ **Request Volume** - Bar chart with colored bars
-   ✅ **90-Day Uptime Trend** - Area chart for trend visualization
-   ✅ **Colored Stats Cards** - Uptime, Response Time, Ping, Request counts
-   ✅ **Color-coded Data** - Green for operational, yellow for degraded, red for offline
-   ✅ **Per-row Layout** - Charts organized per row (not bento grid)

### Incident Management

-   ✅ **Automatic Incident Creation** - Auto-detect when service down
-   ✅ **Active Incidents Tab** - Real-time incident list with status
-   ✅ **Previous Incidents** - Historical incident with duration
-   ✅ **Incident Details** - Title, description, impact level, duration
-   ✅ **Status Updates** - Track incident status progression
-   ✅ **Auto-Resolution** - Auto-resolve when service recover

### Admin Dashboard

-   ✅ **Admin Authentication** - Email/password login
-   ✅ **Service Management** - Add/delete/update services
-   ✅ **Service Pinning** - Pin/unpin services for priority
-   ✅ **Domain Display** - Show domain for each service
-   ✅ **Incident Management** - View and manage incidents
-   ✅ **Real-time Updates** - Live data with Supabase subscriptions

### Real-time Monitoring

-   ✅ **Automatic Health Checks** - Every 5 minutes via Vercel Cron
-   ✅ **Response Time Tracking** - Measure ping and response time
-   ✅ **Status Detection** - Operational/Degraded/Offline/Maintenance
-   ✅ **Request Counting** - Track request volume per period
-   ✅ **Uptime Calculation** - Calculate availability percentage

### Design & UX

-   ✅ **Dark Theme** - Professional dark mode with sophisticated colors
-   ✅ **Responsive Layout** - Mobile-friendly and desktop optimized
-   ✅ **Real-time Updates** - Supabase Realtime subscriptions
-   ✅ **Smooth Animations** - Polished transitions
-   ✅ **Accessible Design** - WCAG compliant

---

## 📚 Tech Stack

-   **Frontend**: Next.js 16 + React 19
-   **Database**: Supabase (PostgreSQL)
-   **Realtime**: Supabase Realtime subscriptions
-   **Charts**: Recharts with custom styling
-   **UI Components**: shadcn/ui + Radix UI
-   **Styling**: Tailwind CSS v4
-   **Monitoring**: Vercel Cron Jobs
-   **Deployment**: Vercel

---

## 🛠️ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/MGalaCyber/Service-Status-Page.git
cd Service-Status-Page
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local with Supabase credentials
```

### 3. Setup Database

-   Open Supabase Dashboard
-   Go to SQL Editor
-   Run all scripts from `scripts/init-schema.sql`
-   Add admin user: `select auth.admin.create_user(...)`

### 4. Run Locally

```bash
npm run dev
# Status Page: http://localhost:3000
# Admin: http://localhost:3000/admin/login
```

### 5. Deploy to Vercel

```bash
vercel deploy --prod
```

## Database Structure

### Services Table

```sql
- id (UUID)
- name (VARCHAR)
- domain (VARCHAR)
- description (TEXT)
- status (VARCHAR) - operational/degraded/offline/maintenance
- ping_ms (FLOAT)
- is_pinned (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

### Service Stats Table

```sql
- id (UUID)
- service_id (FK)
- stats (JSONB)
- oldest_timestamp, newest_timestamp, created_at, updated_at (TIMESTAMPTZ)
```

### Incidents Table

```sql
- id (UUID)
- service_id (FK)
- title (VARCHAR)
- description (TEXT)
- status (VARCHAR) - investigating/identified/monitoring/resolved
- impact (VARCHAR) - minor/degraded/major
- started_at, resolved_at, created_at, updated_at (TIMESTAMPTZ)
```

### Incidents Updates Table

```sql
- id (UUID)
- service_id (FK)
- message (TEXT)
- status (VARCHAR) - investigating/identified/monitoring/resolved
- created_at (TIMESTAMPTZ)
```

## 🔥 API Routes

### GET /api/monitor

Triggers monitoring for all services:

-   Check health for each service
-   Record stats to database
-   Create/resolve incidents automatically
-   Called by Vercel Cron every 5 minutes

### GET /admin/login

Admin authentication page

### GET /admin/dashboard

Admin control panel

## 📝 Customization

### Custom Status Colors

Edit `app/globals.css` - status color definitions

### Add More Services

Via admin dashboard or direct Auth insert

### Change Chart Colors

Edit Recharts components in stats-view.tsx

## 📃 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
POSTGRES_URL=postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres

# Monitoring
CRON_SECRET=YOUR_CRON_SCRET
NEXT_PUBLIC_VISITOR_ID=123abc

# Optional: For development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
MONITORING_API_URL=http://localhost:3000
```

## 📞 Support

For support:

1. Check SETUP_GUIDE.md for installation
2. Check DATABASE_SETUP.md for database
3. Review Supabase docs: https://supabase.com/docs
4. Check error logs in Vercel dashboard

## License

[Apache 2.0](https://github.com/MGalaCyber/Service-Status-Page#Apache-2.0-1-ov-file)
