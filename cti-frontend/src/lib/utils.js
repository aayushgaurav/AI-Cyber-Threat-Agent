import { useEffect, useRef, useState } from 'react';

/** Normalises the list endpoint, which may return an array or an object wrapping one. */
export function normalizeList(data) {
  if (Array.isArray(data)) return { items: data, total: null };
  if (data && typeof data === 'object') {
    const items = data.items ?? data.results ?? data.vulnerabilities ?? data.data ?? [];
    const total = data.total ?? data.count ?? data.total_count ?? null;
    return { items: Array.isArray(items) ? items : [], total: typeof total === 'number' ? total : null };
  }
  return { items: [], total: null };
}

/** Reads a field trying several likely key names, returns null when missing/empty. */
export function pick(obj, keys) {
  if (!obj) return null;
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
}

export const FIELD_KEYS = {
  cve: ['cve_id', 'cveID', 'cve', 'id'],
  vendor: ['vendor', 'vendor_project', 'vendorProject'],
  product: ['product'],
  name: ['vulnerability_name', 'vulnerabilityName', 'name', 'title'],
  added: ['date_added', 'dateAdded'],
  due: ['due_date', 'dueDate'],
  ransomware: ['known_ransomware_use', 'knownRansomwareCampaignUse', 'ransomware_use'],
  action: ['required_action', 'requiredAction'],
  description: ['short_description', 'shortDescription', 'description'],
  notes: ['notes'],
  cwes: ['cwes', 'cwe'],
};

export function field(vuln, name) {
  return pick(vuln, FIELD_KEYS[name]);
}

export function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Runs an async loader with AbortController support.
 * loader receives (signal). Re-runs whenever deps change.
 */
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef.current(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ data: null, error, loading: false });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
