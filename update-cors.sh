#!/bin/bash
# Script to update CORS headers in all Edge Functions
# Security Fix: Replace wildcard CORS with restricted origins

FUNCTIONS_DIR="supabase/functions"

echo "Updating CORS headers in Edge Functions..."

# Find all index.ts files
find "$FUNCTIONS_DIR" -name "index.ts" -type f | while read -r file; do
  # Skip _shared directory
  if [[ "$file" == *"/_shared/"* ]]; then
    continue
  fi

  echo "Processing: $file"

  # Check if file already imports getCorsHeaders
  if grep -q "getCorsHeaders" "$file"; then
    echo "  ✓ Already updated"
    continue
  fi

  # Check if file has the old CORS pattern
  if ! grep -q "'Access-Control-Allow-Origin': '\*'" "$file"; then
    echo "  - No wildcard CORS found"
    continue
  fi

  # Create backup
  cp "$file" "$file.bak"

  # Step 1: Add import if not present
  if ! grep -q "import.*cors.ts" "$file"; then
    # Find the last import line
    last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    if [ -n "$last_import_line" ]; then
      sed -i "${last_import_line}a import { getCorsHeaders } from '../_shared/cors.ts';" "$file"
    fi
  fi

  # Step 2: Remove old corsHeaders constant
  sed -i "/^const corsHeaders = {/,/^};/d" "$file"

  # Step 3: Add dynamic CORS headers at start of serve function
  # Find the line with "serve(async (req)" and add after it
  sed -i "/serve(async (req)/a\  const corsHeaders = getCorsHeaders(req.headers.get('origin'));\n" "$file"

  echo "  ✓ Updated successfully"
done

# Clean up backup files
find "$FUNCTIONS_DIR" -name "*.bak" -delete

echo "Done! CORS headers updated in all Edge Functions."
