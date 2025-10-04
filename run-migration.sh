#!/bin/bash
# Run database migration for package fields

echo "Running migration: Add package fields to runlists"
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Run the migration SQL file
psql "$DATABASE_URL" -f migrations/0002_add_package_fields_to_runlists.sql

if [ $? -eq 0 ]; then
    echo "Migration completed successfully!"
else
    echo "Migration failed!"
    exit 1
fi
