#!/bin/bash

# AWS Amplify Production Deployment Script
# Promotes staging build to main (production) branch for app-id d2fbkl7vcfz5f7

set -euo pipefail

# Configuration
AMPLIFY_APP_ID="d2fbkl7vcfz5f7"
BRANCH_NAME="main"
DIST_DIR="dist"
ZIP_FILE="artifacts.zip"

echo "🚀 Promoting to PRODUCTION (main branch)..."

# Pre-flight checklist
echo "📋 Pre-flight checklist:"

# Check 1: Ensure dist directory exists
if [[ ! -d "$DIST_DIR" ]]; then
    echo "❌ Error: ./dist folder not found. Please run staging deployment first."
    exit 1
fi
echo "✅ ./dist folder exists"

# Check 2: Ensure index.html exists, copy from real index.html if needed
if [[ ! -f "$DIST_DIR/index.html" ]]; then
    if [[ -f "index.html" ]]; then
        echo "📄 Copying index.html → dist/index.html..."
        cp index.html "$DIST_DIR/index.html"
        echo "✅ dist/index.html created from real website"
    else
        echo "❌ Error: dist/index.html missing and main index.html not found"
        exit 1
    fi
else
    echo "✅ dist/index.html exists"
fi

# Step 1: Create artifacts.zip from existing dist (flat structure)
echo "📦 Creating artifacts.zip from existing dist..."
rm -f "$ZIP_FILE"
cd "$DIST_DIR"
zip -r "../$ZIP_FILE" . -x "*.DS_Store" "*/.*" > /dev/null
cd ..

if [[ ! -f "$ZIP_FILE" ]]; then
    echo "❌ Error: Failed to create $ZIP_FILE"
    exit 1
fi

echo "✅ Created $ZIP_FILE ($(du -h "$ZIP_FILE" | cut -f1))"

# Step 2: Create deployment and capture jobId and zipUploadUrl (ONCE)
echo "🔗 Creating Amplify deployment for PRODUCTION..."
DEPLOYMENT_INFO=$(aws amplify create-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query '[jobId, zipUploadUrl]' \
    --output text)

JOB_ID=$(echo "$DEPLOYMENT_INFO" | awk '{print $1}')
UPLOAD_URL=$(echo "$DEPLOYMENT_INFO" | awk '{print $2}')

echo "📋 Job ID: $JOB_ID"
echo "🔗 Upload URL received"

# Step 3: Upload artifacts.zip to S3
echo "⬆️  Uploading artifacts.zip to S3..."
HTTP_STATUS=$(curl -s -X PUT \
    -H "Content-Type: application/zip" \
    --upload-file "$ZIP_FILE" \
    -w "%{http_code}" \
    -o /dev/null \
    "$UPLOAD_URL")

# Check upload status
if [[ "$HTTP_STATUS" != "200" && "$HTTP_STATUS" != "204" ]]; then
    echo "❌ Error: Upload failed with HTTP $HTTP_STATUS"
    exit 1
fi

echo "✅ Upload successful (HTTP $HTTP_STATUS)"

# Step 4: Start deployment
echo "🚀 Starting deployment to PRODUCTION..."
aws amplify start-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --job-id "$JOB_ID" \
    > /dev/null

echo "✅ Production deployment started!"

# Step 5: Get job status
echo "📊 Checking job status..."
JOB_STATUS=$(aws amplify get-job \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --job-id "$JOB_ID" \
    --query 'job.summary.status' \
    --output text)

echo "📋 Job Status: $JOB_STATUS"

# Step 6: Cleanup
echo "🧹 Cleaning up..."
rm -f "$ZIP_FILE"

# Step 7: Print production URLs
echo ""
echo "🌐 PRODUCTION deployment complete!"
echo "   https://main.$AMPLIFY_APP_ID.amplifyapp.com/"
echo "   https://blakelycinematics.com/"
echo ""
echo "⏳ Deployment job ID: $JOB_ID"
echo "📈 Monitor progress in AWS Amplify console"