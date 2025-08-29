#!/usr/bin/env bash
set -euo pipefail

REGION="us-east-1"
FUNCTION_NAME="vip-handler-dev"

BUILD_DIR="$(mktemp -d)"
ZIP="${BUILD_DIR}/vip-handler.zip"

cp backend/vip-handler/vip_handler.py "${BUILD_DIR}/vip_handler.py"
(cd "${BUILD_DIR}" && zip -q -j "${ZIP}" "vip_handler.py")

aws lambda update-function-code \
  --region "${REGION}" \
  --function-name "${FUNCTION_NAME}" \
  --zip-file "fileb://${ZIP}"

aws lambda get-function \
  --region "${REGION}" \
  --function-name "${FUNCTION_NAME}" \
  --query 'Configuration.[LastModified,Version,Handler,Runtime]' \
  --output table
