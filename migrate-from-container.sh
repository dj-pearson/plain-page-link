#!/bin/bash
# Run this script inside the Coolify Supabase container terminal

echo "=========================================="
echo "Applying Migrations from Coolify Container"
echo "=========================================="

# Default connection for local container
DB_CONNECTION="postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres"

# Or use environment variables if set
if [ ! -z "$DATABASE_URL" ]; then
    DB_CONNECTION="$DATABASE_URL"
fi

echo "Testing connection..."
psql "$DB_CONNECTION" -c "SELECT version();" || {
    echo "Connection failed! Trying alternative..."
    DB_CONNECTION="postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/postgres"
    psql "$DB_CONNECTION" -c "SELECT version();" || exit 1
}

echo "Connection successful!"
echo ""

# Create migration tracking
echo "Setting up migration tracking..."
psql "$DB_CONNECTION" <<'EOF'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    name text,
    inserted_at timestamptz DEFAULT now()
);
EOF

echo "Migration tracking ready!"
echo ""

# Apply migrations
echo "Applying migrations..."
cd /path/to/migrations  # Update this path

for migration_file in $(ls -1 *.sql | sort); do
    version="${migration_file%.sql}"

    # Check if already applied
    APPLIED=$(psql "$DB_CONNECTION" -tAc "SELECT version FROM supabase_migrations.schema_migrations WHERE version='$version';")

    if [ -n "$APPLIED" ]; then
        echo "[SKIP] $migration_file"
    else
        echo "[APPLYING] $migration_file..."
        if psql "$DB_CONNECTION" -f "$migration_file"; then
            psql "$DB_CONNECTION" -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$migration_file');"
            echo "[OK] Applied $migration_file"
        else
            echo "[ERROR] Failed to apply $migration_file"
            exit 1
        fi
    fi
done

echo ""
echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
