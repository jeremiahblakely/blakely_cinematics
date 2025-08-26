#!/bin/bash

# AWS Amplify Staging Deployment Script
# Deploys to staging branch for app-id d2fbkl7vcfz5f7

set -euo pipefail

# Configuration
AMPLIFY_APP_ID="d2fbkl7vcfz5f7"
BRANCH_NAME="staging"
DIST_DIR="dist"
ZIP_FILE="artifacts.zip"

echo "🚀 Starting Amplify STAGING deployment..."

# Step 1: Clean and prepare dist directory
echo "📁 Preparing dist directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Step 2: Copy coming-soon.html as index.html if needed
if [[ ! -f "$DIST_DIR/index.html" && -f "coming-soon.html" ]]; then
    echo "📄 Copying coming-soon.html → dist/index.html..."
    cp coming-soon.html "$DIST_DIR/index.html"
elif [[ -f "$DIST_DIR/index.html" ]]; then
    echo "📄 Using existing dist/index.html..."
else
    echo "❌ Error: No index.html found and coming-soon.html missing"
    exit 1
fi

# Step 3: Copy public assets if they exist
if [[ -d "public" ]]; then
    echo "📂 Copying public assets..."
    cp -r public/* "$DIST_DIR/" 2>/dev/null || true
fi

# Step 4: Create artifacts.zip (flat structure)
echo "📦 Creating artifacts.zip..."
rm -f "$ZIP_FILE"
cd "$DIST_DIR"
zip -r "../$ZIP_FILE" . -x "*.DS_Store" "*/.*"
cd ..

if [[ ! -f "$ZIP_FILE" ]]; then
    echo "❌ Error: Failed to create $ZIP_FILE"
    exit 1
fi

echo "✅ Created $ZIP_FILE ($(du -h "$ZIP_FILE" | cut -f1))"

# Step 5: Create deployment and get URLs (ONCE)
echo "🔗 Creating Amplify deployment for STAGING..."
DEPLOYMENT_INFO=$(aws amplify create-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query '[jobId, zipUploadUrl]' \
    --output text)

JOB_ID=$(echo "$DEPLOYMENT_INFO" | awk '{print $1}')
UPLOAD_URL=$(echo "$DEPLOYMENT_INFO" | awk '{print $2}')

echo "📋 Job ID: $JOB_ID"
echo "🔗 Upload URL received"

# Step 6: Upload artifacts.zip to S3
echo "⬆️  Uploading artifacts.zip to S3..."
HTTP_STATUS=$(curl -s -X PUT \
    -H "Content-Type: application/zip" \
    --upload-file "$ZIP_FILE" \
    -w "%{http_code}" \
    -o /dev/null \
    "$UPLOAD_URL")

if [[ "$HTTP_STATUS" != "200" && "$HTTP_STATUS" != "204" ]]; then
    echo "❌ Error: Upload failed with HTTP $HTTP_STATUS"
    exit 1
fi

echo "✅ Upload successful (HTTP $HTTP_STATUS)"

# Step 7: Start deployment
echo "🚀 Starting deployment..."
aws amplify start-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --job-id "$JOB_ID" \
    > /dev/null

echo "✅ Deployment started successfully!"

# Step 8: Cleanup
echo "🧹 Cleaning up..."
rm -f "$ZIP_FILE"
rm -rf "$DIST_DIR"

# Step 9: Print staging preview URL
echo ""
echo "🌐 STAGING environment available at:"
echo "   https://staging.$AMPLIFY_APP_ID.amplifyapp.com/"
echo ""
echo "⏳ Deployment in progress... Check AWS Amplify console for status."
echo "📋 Job ID: $JOB_ID"