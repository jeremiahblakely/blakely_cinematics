import json
import time
from typing import Any, Dict, Tuple

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
}

def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body),
    }

def _ok(body: Dict[str, Any]) -> Dict[str, Any]:
    return _resp(200, body)

def _bad_request(msg: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    return _resp(400, {"message": msg, **(details or {})})

def _not_found(event: Dict[str, Any]) -> Dict[str, Any]:
    return _resp(404, {
        "message": "Route not found",
        "resource": event.get("resource"),
        "method": event.get("httpMethod"),
    })

def _now_ts() -> int:
    return int(time.time())

def _parse_json_body(event: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any] | None]:
    try:
        raw = event.get("body")
        if raw is None:
            return {}, _bad_request("Missing request body")
        if isinstance(raw, dict):
            return raw, None
        return json.loads(raw or "{}"), None
    except Exception:
        return {}, _bad_request("Invalid JSON body")

def _is_nonempty_str(v: Any) -> bool:
    return isinstance(v, str) and len(v.strip()) > 0

def _is_nonempty_list(v: Any) -> bool:
    return isinstance(v, list) and len(v) > 0

def handle_health(_event: Dict[str, Any]) -> Dict[str, Any]:
    return _ok({"ok": True, "service": "vip"})

def handle_restore(event: Dict[str, Any]) -> Dict[str, Any]:
    path = event.get("pathParameters") or {}
    gallery_id = path.get("galleryId") or "unknown"

    body, err = _parse_json_body(event)
    if err:
        return err

    asset_ids = body.get("assetIds")
    if not _is_nonempty_list(asset_ids) or not all(_is_nonempty_str(a) for a in asset_ids):
        return _bad_request("`assetIds` must be a non-empty array of strings")

    now = _now_ts()
    return _ok({
        "galleryId": gallery_id,
        "restored": [{"assetId": a, "restoredAt": now} for a in asset_ids],
    })

def handle_finalize(event: Dict[str, Any]) -> Dict[str, Any]:
    path = event.get("pathParameters") or {}
    gallery_id = path.get("galleryId") or "unknown"

    body, err = _parse_json_body(event)
    if err:
        return err

    folder_id = body.get("folderId")
    asset_ids = body.get("assetIds")

    if not _is_nonempty_str(folder_id):
        return _bad_request("`folderId` must be a non-empty string")

    if not _is_nonempty_list(asset_ids) or not all(_is_nonempty_str(a) for a in asset_ids):
        return _bad_request("`assetIds` must be a non-empty array of strings")

    return _ok({
        "galleryId": gallery_id,
        "folderId": folder_id,
        "finalized": {
            "assetIds": asset_ids,
            "finalizedAt": _now_ts(),
        }
    })

def handle_delete_items(event: Dict[str, Any]) -> Dict[str, Any]:
    path = event.get("pathParameters") or {}
    gallery_id = path.get("galleryId") or "unknown"
    folder_id  = path.get("folderId") or "unknown"

    body, err = _parse_json_body(event)
    if err:
        return err

    asset_ids = body.get("assetIds")
    if not _is_nonempty_list(asset_ids) or not all(_is_nonempty_str(a) for a in asset_ids):
        return _bad_request("`assetIds` must be a non-empty array of strings")

    return _ok({
        "galleryId": gallery_id,
        "folderId": folder_id,
        "removed": asset_ids,
    })

def handle_trash(event: Dict[str, Any]) -> Dict[str, Any]:
    path = event.get("pathParameters") or {}
    gallery_id = path.get("galleryId") or "unknown"

    body, err = _parse_json_body(event)
    if err:
        return err

    asset_ids = body.get("assetIds")
    ttl_days = body.get("ttlDays", 30)

    if not _is_nonempty_list(asset_ids) or not all(_is_nonempty_str(a) for a in asset_ids):
        return _bad_request("`assetIds` must be a non-empty array of strings")
    try:
        ttl_days = int(ttl_days)
    except Exception:
        return _bad_request("`ttlDays` must be an integer", {"ttlDays": ttl_days})

    now = _now_ts()
    trashed = [{"assetId": a, "trashedAt": now, "ttlDays": ttl_days} for a in asset_ids]

    return _ok({
        "galleryId": gallery_id,
        "trashed": trashed,
    })

def handle_options(_event: Dict[str, Any]) -> Dict[str, Any]:
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

ROUTES = {
    ("GET",     "/health"): handle_health,
    ("OPTIONS", "/health"): handle_options,

    ("POST",    "/vip/galleries/{galleryId}/restore"):  handle_restore,
    ("OPTIONS", "/vip/galleries/{galleryId}/restore"):  handle_options,

    ("POST",    "/vip/galleries/{galleryId}/finalize"): handle_finalize,
    ("OPTIONS", "/vip/galleries/{galleryId}/finalize"): handle_options,

    ("DELETE",  "/vip/galleries/{galleryId}/folders/{folderId}/items"): handle_delete_items,
    ("OPTIONS", "/vip/galleries/{galleryId}/folders/{folderId}/items"): handle_options,

    ("POST",    "/vip/galleries/{galleryId}/trash"): handle_trash,
    ("OPTIONS", "/vip/galleries/{galleryId}/trash"): handle_options,
}

def lambda_handler(event, _context):
    method  = (event.get("httpMethod") or "").upper()
    resource = event.get("resource") or ""

    handler = ROUTES.get((method, resource))
    if not handler:
        if method == "OPTIONS":
            return handle_options(event)
        return _not_found(event)

    try:
        return handler(event)
    except Exception as exc:
        return _resp(500, {
            "message": "Internal server error",
            "error": str(exc),
            "resource": resource,
            "method": method,
        })
