#!/bin/bash

# Configuration
FUNCTION_NAME="send-feedback"
MIGRATION_FILE="supabase/activate_cron.sql"

# 0. Check for Supabase CLI
if ! command -v npx &> /dev/null; then
  echo "❌ Error: npx is required but not installed."
  exit 1
fi

echo "==================================================="
echo "   🚀 SprayHub Feedback System Deployment Tool   "
echo "==================================================="

# 1. Login Check
echo "🔍 Checking Supabase login status..."
npx supabase projects list &> /dev/null
if [ $? -ne 0 ]; then
  echo "⚠️  You are not logged in."
  echo "👉 Please log in via the browser window that will open."
  npx supabase login
  
  if [ $? -ne 0 ]; then
    echo "❌ Login failed. Aborting."
    exit 1
  fi
else
  echo "✅ Already logged in."
fi

# 2. Resend API Key
echo ""
echo "🔑 Enter your full Resend API Key (starts with re_...):"
read -r RESEND_KEY

if [[ -z "$RESEND_KEY" ]]; then
  echo "❌ API Key cannot be empty."
  exit 1
fi

echo "... Setting secret RESEND_API_KEY ..."
npx supabase secrets set RESEND_API_KEY="$RESEND_KEY"

# 3. Deploy Function
echo ""
echo "☁️  Deploying Edge Function '$FUNCTION_NAME'..."
npx supabase functions deploy "$FUNCTION_NAME" --no-verify-jwt

if [ $? -eq 0 ]; then
  echo "✅ Function deployed successfully!"
else
  echo "❌ Deployment failed."
  exit 1
fi

# 4. Final Instructions
echo ""
echo "==================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "==================================================="
echo "⚠️  ONE LAST STEP:"
echo "1. Go to your Supabase Dashboard > SQL Editor"
echo "2. Open the file '$MIGRATION_FILE' (or copy its content)"
echo "3. Replace 'VOTRE_CLE_SERVICE_ROLE' with your actual Service Role Key"
echo "4. Run it to start the daily schedule."
echo ""
