# Database Setup Instructions

## Quick Database Setup via SQL

Copy entire content from `scripts/init-schema.sql` and paste it into Supabase SQL Editor.

## Verify Setup

Run query below to verify:

```sql
-- Check services
SELECT COUNT(*) as services_count FROM services;
SELECT COUNT(*) as incidents_count FROM incidents;
SELECT COUNT(*) as incident_updates_count FROM incident_updates;
SELECT COUNT(*) as service_stats_count FROM service_stats;

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema='public';
```

## Create Admin

```sql
SELECT auth.admin.create_user(
  email := 'admin@example.com',
  password := 'admin123',
  email_confirm := true
);
```

## Next Steps

1. Login ke admin dashboard: `http://localhost:3000/admin/login`
2. Add more services via admin dashboard
3. Wait for monitoring data (5 minutes first)
4. Check charts and statistics
