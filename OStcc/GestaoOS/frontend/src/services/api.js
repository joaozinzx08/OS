export async function api(path, options = {}) {
  let response;
  try { response = await fetch('/api' + path, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } }); }
  catch { throw new Error('Não foi possível conectar. Confira se o backend está rodando.'); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('session-expired'));
    const error = new Error(data?.details?.map(d => (d.field ? d.field + ': ' : '') + d.message).join(' ') || data?.error || 'Não foi possível concluir a operação.');
    error.status = response.status; throw error;
  }
  return data;
}
export const send = (method, data) => ({ method, body: JSON.stringify(data) });
