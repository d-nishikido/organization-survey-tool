#!/bin/bash

# Database Migration Runner
# Usage: ./run-migration.sh <migration_file>

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-organization_survey}"
DB_USER="${DB_USER:-survey_user}"
DB_PASSWORD="${DB_PASSWORD:-survey_password}"

MIGRATION_FILE=$1

if [ -z "$MIGRATION_FILE" ]; then
  echo "Usage: $0 <migration_file>"
  echo "Example: $0 001_create_analytics_cache.sql"
  exit 1
fi

MIGRATION_PATH="database/migrations/$MIGRATION_FILE"

if [ ! -f "$MIGRATION_PATH" ]; then
  echo "Error: Migration file not found: $MIGRATION_PATH"
  exit 1
fi

echo "Running migration: $MIGRATION_FILE"
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"

export PGPASSWORD=$DB_PASSWORD

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully"
else
  echo "❌ Migration failed"
  exit 1
fi
