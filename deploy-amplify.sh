#!/bin/bash

# AWS Amplify Manual Deployment Script
# Deploys coming-soon.html as index.html to Amplify

set -euo pipefail

# Configuration
AMPLIFY_APP_ID="d3ciwjumm9gj7d"
BRANCH_NAME="main"
DIST_DIR="dist"
ZIP_FILE="artifacts.zip"

echo "🚀 Starting Amplify deployment..."

# Step 1: Clean and prepare dist directory
echo "📁 Preparing dist directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Step 2: Copy coming-soon.html as index.html
if [[ ! -f "coming-soon.html" ]]; then
    echo "❌ Error: coming-soon.html not found in project root"
    exit 1
fi

echo "📄 Copying coming-soon.html → dist/index.html..."
cp coming-soon.html "$DIST_DIR/index.html"

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

# Step 5: Create deployment and get URLs
echo "🔗 Creating Amplify deployment..."
DEPLOYMENT_INFO=$(aws amplify create-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query '[jobId, zipUploadUrl]' \
    --output text)

if [[ -z "$DEPLOYMENT_INFO" ]]; then
    echo "❌ Error: Failed to create deployment"
    exit 1
fi

# Parse the response
JOB_ID=$(echo "$DEPLOYMENT_INFO" | cut -f1)
ZIP_UPLOAD_URL=$(echo "$DEPLOYMENT_INFO" | cut -f2)

echo "📋 Job ID: $JOB_ID"
echo "🔗 Upload URL received"

# Step 6: Upload artifacts.zip to S3
echo "⬆️  Uploading artifacts.zip to S3..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PUT \
    -H "Content-Type: application/zip" \
    --data-binary "@$ZIP_FILE" \
    "$ZIP_UPLOAD_URL")

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

# Step 9: Print URLs
echo ""
echo "🌐 Your site will be available at:"
echo "   Branch: https://$BRANCH_NAME.$AMPLIFY_APP_ID.amplifyapp.com/"
echo "   Main:   https://$AMPLIFY_APP_ID.amplifyapp.com/"
echo ""
echo "⏳ Deployment in progress... Check AWS Amplify console for status."