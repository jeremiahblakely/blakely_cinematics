# runtime: Python 3.13
# handler: <this_file>.lambda_handler

import json
import base64
import os
from typing import Dict, Any, Optional, Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError

# DynamoDB table (override via env var if needed)
GALLERIES_TABLE = os.environ.get("GALLERIES_TABLE", "blakely-cinematics-galleries")

# Demo fallback credentials
DEMO_FALLBACK = {
    ("DEMO2025", "preview"): {
        "clientName": "Sarah Johnson",
        "sessionType": "Headshots",
        "imageCount": 24,
        "expiresAt": "2025-11-19",
    }
}

dynamodb = boto3.resource("dynamodb")
galleries_table = dynamodb.Table(GALLERIES_TABLE)

def _cors_headers() -> Dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Accept",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Content-Type": "application/json",
    }

def _resp(body: Dict[str, Any], status: int = 200) -> Dict[str, Any]:
    return {"statusCode": status, "headers": _cors_headers(), "body": json.dumps(body)}

def _err(message: str, status: int = 401) -> Dict[str, Any]:
    return _resp({"success": False, "message": message}, status=status)

def _get_method(event: Dict[str, Any]) -> str:
    if event.get("httpMethod"):
        return str(event["httpMethod"]).upper()
    rc = event.get("requestContext") or {}
    http = rc.get("http") or {}
    m = http.get("method") or rc.get("httpMethod")
    return (m or "GET").upper()

def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    raw = event.get("body")
    if not raw:
        return {}
    if event.get("isBase64Encoded"):
        try:
            raw = base64.b64decode(raw).decode("utf-8")
        except Exception:
            return {}
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}
    if isinstance(raw, dict):
        return raw
    return {}

def _parse_credentials(event: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    method = _get_method(event)
    if method == "POST":
        data = _parse_body(event)
        return data.get("galleryCode"), data.get("password")
    qs = event.get("queryStringParameters") or {}
    return qs.get("galleryCode"), qs.get("password")

def _lookup_gallery(gallery_code: str, password: str) -> Optional[Dict[str, Any]]:
    # 1) Try DynamoDB
    try:
        resp = galleries_table.get_item(Key={"galleryCode": gallery_code})
        item = resp.get("Item")
        if item and item.get("password") == password:
            return {
                "clientName": str(item.get("clientName", "")).strip(),
                "sessionType": item.get("sessionType", ""),
                "imageCount": int(item.get("imageCount", 0)),
                "expiresAt": item.get("expiryDate") or item.get("expiresAt") or "",
            }
    except (BotoCoreError, ClientError):
        pass

    # 2) Demo fallback
    fb = DEMO_FALLBACK.get((gallery_code, password))
    if fb:
        g = dict(fb)
        g["clientName"] = g.get("clientName", "").strip()
        return g

    return None

def lambda_handler(event, context):
    method = _get_method(event)

    # Preflight handled here so headers are always present
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

    gallery_code, password = _parse_credentials(event)
    if not gallery_code or not password:
        return _err("Invalid credentials", status=401)

    gallery = _lookup_gallery(gallery_code, password)
    if gallery:
        return _resp({"success": True, "gallery": gallery}, status=200)

    return _err("Invalid credentials", status=401)
