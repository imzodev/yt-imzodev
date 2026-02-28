#!/bin/bash

# Load environment variables
source .env

# Generate types using the project ID from environment
supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/lib/database.types.ts

echo "✅ TypeScript types generated successfully!"
