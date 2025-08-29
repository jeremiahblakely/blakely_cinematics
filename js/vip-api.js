// Minimal VIP API helper
// Exports: vipHealth() -> GET /health returning JSON

export async function vipHealth() {
  const base = window.VIP_API_BASE || '';
  const url = base.replace(/\/$/, '') + '/health';
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Health ${res.status}`);
  return res.json();
}

function vipBase() {
  return (window.VIP_API_BASE || '').replace(/\/$/, '');
}

async function json(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function vipFinalize(galleryId, { assetIds, folderId } = {}) {
  const payload = {};
  if (Array.isArray(assetIds) && assetIds.length) payload.assetIds = assetIds;
  if (typeof folderId === 'string' && folderId) payload.folderId = folderId;
  const url = `${vipBase()}/vip/galleries/${encodeURIComponent(galleryId)}/finalize`;
  return json('POST', url, payload);
}

export async function vipRestore(galleryId, { assetIds, folderId } = {}) {
  const payload = {};
  if (Array.isArray(assetIds) && assetIds.length) payload.assetIds = assetIds;
  if (typeof folderId === 'string' && folderId) payload.folderId = folderId;
  const url = `${vipBase()}/vip/galleries/${encodeURIComponent(galleryId)}/restore`;
  return json('POST', url, payload);
}

export async function vipTrash(galleryId, { assetIds, folderId } = {}) {
  const payload = {};
  if (Array.isArray(assetIds) && assetIds.length) payload.assetIds = assetIds;
  if (typeof folderId === 'string' && folderId) payload.folderId = folderId;
  const url = `${vipBase()}/vip/galleries/${encodeURIComponent(galleryId)}/trash`;
  return json('POST', url, payload);
}

export async function vipRemoveFromFolder(galleryId, folderId, { assetIds } = {}) {
  const url = `${vipBase()}/vip/galleries/${encodeURIComponent(galleryId)}/folders/${encodeURIComponent(folderId)}/items`;
  // Some APIs accept a JSON body for DELETE; send assetIds when provided
  return json('DELETE', url, Array.isArray(assetIds) && assetIds.length ? { assetIds } : undefined);
}
