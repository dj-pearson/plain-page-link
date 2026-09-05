#!/bin/bash

# ============================================
# Migration Script for Coolify Self-Hosted Supabase
# ============================================

# CONFIGURATION
# Replace these with your actual Coolify Supabase connection details
DB_HOST="your-coolify-host"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="your-password"

# Connection string
CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "=========================================="
echo "Supabase Migration to Coolify"
echo "=========================================="
echo ""

# Step 1: Check connection
echo "📡 Testing database connection..."
psql "$CONNECTION_STRING" -c "SELECT version();" || {
    echo "❌ Connection failed! Please check your credentials."
    exit 1
}
echo "✅ Connection successful!"
echo ""

# Step 2: Create migration tracking table if it doesn't exist
echo "📋 Setting up migration tracking..."
psql "$CONNECTION_STRING" <<EOF
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    name text,
    inserted_at timestamptz DEFAULT now()
);
EOF
echo "✅ Migration tracking ready!"
echo ""

# Step 3: Apply migrations in order
echo "🚀 Applying migrations..."
MIGRATION_DIR="./supabase/migrations"

for migration_file in $(ls -1 "$MIGRATION_DIR"/*.sql | sort); do
    filename=$(basename "$migration_file")
    version="${filename%.sql}"
    
    # Check if already applied
    APPLIED=$(psql "$CONNECTION_STRING" -tAc "SELECT version FROM supabase_migrations.schema_migrations WHERE version='$version';")
    
    if [ -n "$APPLIED" ]; then
        echo "⏭️  Skipping $filename (already applied)"
    else
        echo "📥 Applying $filename..."
        
        # Apply migration
        if psql "$CONNECTION_STRING" -f "$migration_file"; then
            # Record successful migration
            psql "$CONNECTION_STRING" -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$filename');"
            echo "✅ Applied $filename"
        else
            echo "❌ Failed to apply $filename"
            exit 1
        fi
    fi
    echo ""
done

echo "=========================================="
echo "✨ Migration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify tables: psql \"$CONNECTION_STRING\" -c '\dt'"
echo "2. Deploy Edge Functions to Coolify"
echo "3. Update your app's environment variables"
echo ""
