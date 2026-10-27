
const BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = null, network = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.network = network;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
      ...options,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(
      `Cannot reach the backend at ${BASE_URL}. Make sure the FastAPI server is running and CORS allows this origin.`,
      { network: true },
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = typeof body?.detail === 'string' ? body.detail : body?.detail ? JSON.stringify(body.detail) : '';
    } catch {
      /* body was not JSON */
    }
    const fallback = response.status === 404 ? 'Not found.' : `Request failed with status ${response.status}.`;
    throw new ApiError(detail || fallback, { status: response.status });
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('The backend returned a response that is not valid JSON.', { status: response.status });
  }
}

export const apiBaseUrl = BASE_URL;

export const getHealth = (signal) => request('/health', { signal });

export const getStats = (signal) => request('/stats', { signal });

export function listVulnerabilities({ q = '', limit = 20, offset = 0 } = {}, signal) {
  const params = new URLSearchParams();
  if (q && q.trim()) params.set('q', q.trim());
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return request(`/vulnerabilities?${params.toString()}`, { signal });
}

export const getVulnerability = (cveId, signal) =>
  request(`/vulnerabilities/${encodeURIComponent(cveId)}`, { signal });

export const askQuestion = (question, signal) =>
  request('/ask', { method: 'POST', body: JSON.stringify({ question }), signal });
