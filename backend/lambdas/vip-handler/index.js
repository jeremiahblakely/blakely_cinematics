// VIP Handler Lambda (stub)
// Adds: POST /vip/galleries/{galleryId}/finalize

function cors(headers = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    ...headers,
  };
}

function ok(body) {
  return {
    statusCode: 200,
    headers: cors({'Content-Type': 'application/json'}),
    body: JSON.stringify(body),
  };
}

function badRequest(message) {
  return {
    statusCode: 400,
    headers: cors({'Content-Type': 'application/json'}),
    body: JSON.stringify({ message }),
  };
}

export const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.rawPath || '';

  // Simple CORS preflight support
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

  // Match POST /vip/galleries/{galleryId}/finalize
  const finalizeMatch = path.match(/^\/?vip\/galleries\/(?<galleryId>[^\/]+)\/finalize\/?$/);

  if (method === 'POST' && finalizeMatch) {
    const galleryId = event.pathParameters?.galleryId || finalizeMatch.groups?.galleryId;
    let payload;
    try {
      payload = event.body ? JSON.parse(event.body) : {};
    } catch {
      return badRequest('Invalid JSON body');
    }

    const hasAssets = Array.isArray(payload.assetIds);
    const hasFolder = typeof payload.folderId === 'string' && payload.folderId.length > 0;
    if ((hasAssets && hasFolder) || (!hasAssets && !hasFolder)) {
      return badRequest('Provide exactly one of assetIds or folderId.');
    }

    const now = Math.floor(Date.now() / 1000);
    let finalized = [];
    let mode = 'assets';
    if (hasAssets) {
      finalized = payload.assetIds.map((id) => ({ assetId: String(id), status: 'ready_for_edit', finalizedAt: now }));
      mode = 'assets';
    } else {
      // folder mode stub: return small fake list
      mode = 'folder';
      finalized = [
        { assetId: 'stub_001', status: 'ready_for_edit', finalizedAt: now },
        { assetId: 'stub_002', status: 'ready_for_edit', finalizedAt: now },
        { assetId: 'stub_003', status: 'ready_for_edit', finalizedAt: now },
      ];
    }

    console.log(JSON.stringify({ route: 'finalize', galleryId, mode, count: finalized.length }));

    const response = {
      galleryId,
      ...(hasAssets ? { assetIds: payload.assetIds } : {}),
      ...(hasFolder ? { folderId: payload.folderId } : {}),
      finalized,
    };
    return ok(response);
  }

  // default 404 for unknown routes
  return {
    statusCode: 404,
    headers: cors({'Content-Type': 'application/json'}),
    body: JSON.stringify({ message: 'Not Found' }),
  };
};

