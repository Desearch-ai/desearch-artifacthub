export function apiKey() {
  const key = process.env.DESEARCH_API_KEY;
  if (!key || !key.trim() || /[\r\n]/.test(key)) {
    throw new Error('Set DESEARCH_API_KEY to a valid API key.');
  }
  return key;
}

export function results(data) {
  if (!Array.isArray(data) || data.some(item => !item ||
    ['title', 'link', 'snippet'].some(field => typeof item[field] !== 'string'))) {
    throw new Error('Invalid search response.');
  }
  return data;
}

export async function search(query, num = 3, { fetchImpl = fetch } = {}) {
  if (typeof query !== 'string' || !query.trim()) throw new Error('Query is required.');
  if (!Number.isInteger(num) || num < 1) throw new Error('num must be a positive integer.');
  const key = apiKey();
  const url = new URL('https://api.desearch.ai/web');
  url.search = new URLSearchParams({ query, num: String(num) }).toString();
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'GET', headers: { Authorization: `Bearer ${key}` },
      redirect: 'error', signal: AbortSignal.timeout(30_000)
    });
  } catch { throw new Error('Search request failed.'); }
  if (!response.ok) throw new Error(`Search HTTP status ${response.status}.`);
  let body;
  try { body = await response.json(); } catch { throw new Error('Invalid search response.'); }
  return results(body?.data);
}
