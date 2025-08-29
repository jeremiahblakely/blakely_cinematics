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

