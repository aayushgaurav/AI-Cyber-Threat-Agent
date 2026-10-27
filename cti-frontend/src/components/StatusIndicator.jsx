import { useCallback, useEffect, useState } from 'react';
import { getHealth, apiBaseUrl } from '../lib/api.js';

/** Polls /health and shows connection status. Shared via a tiny module-level hook. */
export function useHealth(intervalMs = 30000) {
  const [state, setState] = useState({ status: 'checking', data: null, error: null });

  const check = useCallback(async (signal) => {
    try {
      const data = await getHealth(signal);
      setState({ status: data?.status === 'ok' ? 'online' : 'degraded', data, error: null });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setState({ status: 'offline', data: null, error });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    check(controller.signal);
    const id = setInterval(() => check(controller.signal), intervalMs);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [check, intervalMs]);

  return state;
}

const LABELS = {
  checking: 'Checking API…',
  online: 'API connected',
  degraded: 'API responded unexpectedly',
  offline: 'API unreachable',
};

export default function StatusIndicator() {
  const { status } = useHealth();
  return (
    <div className={`status-pill status-${status}`} role="status" title={`Backend: ${apiBaseUrl}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{LABELS[status]}</span>
    </div>
  );
}
