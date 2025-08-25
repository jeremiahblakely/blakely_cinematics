# File: lambda_getImages.py
# Handler: lambda_getImages.lambda_handler
# Runtime: Python 3.13

import json, os, base64
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import BotoCoreError, ClientError

# ---- Env vars (you already set these) ----
IMAGES_TABLE   = os.environ.get("IMAGES_TABLE", "blakely-cinematics-images")
IMAGES_BUCKET  = os.environ.get("IMAGES_BUCKET", "")         # e.g. blakely-cinematics
IMAGES_PREFIX  = os.environ.get("IMAGES_PREFIX", "images")   # e.g. images
PRESIGN_SECONDS = int(os.environ.get("PRESIGN_SECONDS", "3600"))  # 0 => public URL

dynamodb = boto3.resource("dynamodb")
images_table = dynamodb.Table(IMAGES_TABLE)
s3 = boto3.client("s3")

def _cors_headers() -> Dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Accept",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Content-Type": "application/json",
    }

def _resp(body: Dict[str, Any], status: int = 200) -> Dict[str, Any]:
    return {"statusCode": status, "headers": _cors_headers(), "body": json.dumps(body)}

def _method(event: Dict[str, Any]) -> str:
    # Works for REST or HTTP APIs
    if event.get("httpMethod"):
        return str(event["httpMethod"]).upper()
    rc = event.get("requestContext") or {}
    http = rc.get("http") or {}
    m = http.get("method") or rc.get("httpMethod")
    return (m or "GET").upper()

def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    b = event.get("body")
    if not b:
        return {}
    if event.get("isBase64Encoded"):
        try:
            b = base64.b64decode(b).decode("utf-8")
        except Exception:
            return {}
    if isinstance(b, str):
        try:
            return json.loads(b)
        except json.JSONDecodeError:
            return {}
    if isinstance(b, dict):
        return b
    return {}

def _gallery_code(event: Dict[str, Any]) -> Optional[str]:
    if _method(event) == "POST":
        data = _parse_body(event)
        return (data.get("galleryCode") or "").strip() or None
    qs = event.get("queryStringParameters") or {}
    return (qs.get("galleryCode") or "").strip() or None

def _build_url(gallery_code: str, item: Dict[str, Any]) -> Optional[str]:
    # 1) If DB already provides a URL, use it
    if item.get("s3Url"):
        return item["s3Url"]

    # 2) Else use s3Key if present
    key = item.get("s3Key")

    # 3) Else default to images/<code>/<imageId>.jpg
    if not key:
        image_id = item.get("imageId")
        if not (IMAGES_BUCKET and image_id and gallery_code):
            return None
        key = f"{IMAGES_PREFIX}/{gallery_code}/{image_id}.jpg"

    if not IMAGES_BUCKET:
        return None

    # Return presigned or public URL
    if PRESIGN_SECONDS > 0:
        try:
            return s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": IMAGES_BUCKET, "Key": key},
                ExpiresIn=PRESIGN_SECONDS,
            )
        except Exception as e:
            print(f"Presign error for {key}: {e}")
            return None
    else:
        return f"https://{IMAGES_BUCKET}.s3.amazonaws.com/{key}"

def _query_images(code: str) -> List[Dict[str, Any]]:
    try:
        resp = images_table.query(KeyConditionExpression=Key("galleryCode").eq(code))
        items = resp.get("Items", [])

        # Sort (uploaded first, then by id)
        def _sort_key(it):
            return (it.get("uploadDate") is None, it.get("uploadDate"), it.get("imageId"))
        items.sort(key=_sort_key)

        out = []
        for it in items:
            out.append({
                "imageId": it.get("imageId"),
                "url": _build_url(code, it),
                "uploadedAt": it.get("uploadDate"),
            })
        return out
    except (BotoCoreError, ClientError) as e:
        print(f"DynamoDB error: {e}")
        return []

def lambda_handler(event, context):
    try:
        m = _method(event)
        if m == "OPTIONS":
            # Preflight
            return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

        code = _gallery_code(event)
        if not code:
            return _resp({"success": False, "message": "galleryCode is required", "images": []}, 400)

        images = _query_images(code)
        return _resp({"success": True, "galleryCode": code, "count": len(images), "images": images}, 200)

    except Exception as e:
        print(f"Unhandled error: {e}")
        return _resp({"success": False, "message": "Internal Server Error"}, 500)
