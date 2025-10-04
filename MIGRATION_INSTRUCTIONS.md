# Database Migration Instructions

## Migration: Add Package Fields to Runlists

This migration adds the package-based workflow fields to the `runlists` table.

### What's Being Added:
- `package_name` - Friendly name for the inspection package
- `assigned_inspector_id` - Inspector assigned to the package
- `package_status` - Status of the package (pending/in_progress/completed)
- `is_package` - Boolean flag to identify package runlists

### How to Run the Migration:

#### Option 1: Using the migration script (recommended)
```bash
# Set your DATABASE_URL environment variable
export DATABASE_URL="your-database-url-here"

# Run the migration
./run-migration.sh
```

#### Option 2: Manual SQL execution
```bash
# Connect to your database and run:
psql $DATABASE_URL -f migrations/0002_add_package_fields_to_runlists.sql
```

#### Option 3: Using drizzle-kit push (will sync all schema changes)
```bash
npm run db:push
```

### Verification:

After running the migration, verify the columns were added:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'runlists'
AND column_name IN ('package_name', 'assigned_inspector_id', 'package_status', 'is_package');
```

### Rollback (if needed):

If you need to rollback this migration:
```sql
ALTER TABLE "runlists" DROP COLUMN IF EXISTS "package_name";
ALTER TABLE "runlists" DROP COLUMN IF EXISTS "assigned_inspector_id";
ALTER TABLE "runlists" DROP COLUMN IF EXISTS "package_status";
ALTER TABLE "runlists" DROP COLUMN IF EXISTS "is_package";
```

### Next Steps After Migration:

1. Restart your application server
2. The batch upload modal will now require package name and inspector
3. Use the cleanup endpoint to remove incomplete inspections (optional):
   ```bash
   curl -X DELETE https://your-app-url/api/inspections/cleanup-incomplete
   ```
