import { getStats, listVulnerabilities, apiBaseUrl } from '../lib/api.js';
import { normalizeList, useAsync } from '../lib/utils.js';
import { useHealth } from '../components/StatusIndicator.jsx';
import { Icon } from '../components/Icons.jsx';
import { ErrorBanner, LoadingBlock, EmptyState, Unavailable } from '../components/Feedback.jsx';
import VulnerabilityTable from '../components/VulnerabilityTable.jsx';

const LATEST_COUNT = 8;

function StatCard({ icon, label, children, tone = '' }) {
  return (
    <div className={`card stat-card ${tone}`}>
      <span className="stat-icon"><Icon name={icon} size={22} /></span>
      <div>
        <p className="stat-label">{label}</p>
        <div className="stat-value">{children}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ navigate, active }) {
  const health = useHealth();
  const stats = useAsync((signal) => getStats(signal), [active]);
  const latest = useAsync((signal) => listVulnerabilities({ limit: LATEST_COUNT, offset: 0 }, signal), [active]);

  const count = stats.data?.unique_vulnerabilities;
  const records = latest.data ? normalizeList(latest.data).items : [];

  const healthLabel =
    health.status === 'online' ? 'Operational'
      : health.status === 'checking' ? 'Checking…'
        : health.status === 'degraded' ? 'Unexpected response'
          : 'Unreachable';

  return (
    <div className="page">
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Overview of the local threat intelligence database and backend service.</p>
      </div>

      <div className="grid stats-grid">
        <StatCard icon="database" label="Vulnerabilities in local database">
          {stats.loading ? <span className="muted">Loading…</span>
            : stats.error ? <Unavailable>Unavailable</Unavailable>
              : typeof count === 'number' ? count.toLocaleString() : <Unavailable>Not reported</Unavailable>}
        </StatCard>
        <StatCard icon="pulse" label="API health" tone={`tone-${health.status}`}>
          {healthLabel}
          {health.data?.service && <small className="stat-sub">{health.data.service}</small>}
        </StatCard>
        <StatCard icon="source" label="Threat intelligence source">
          CISA KEV Catalog
          <small className="stat-sub">Known Exploited Vulnerabilities</small>
        </StatCard>
      </div>

      {stats.error && <ErrorBanner title="Could not load database statistics" error={stats.error} />}

      <div className="grid quick-grid">
        <button type="button" className="card quick-link" onClick={() => navigate('/analyst')}>
          <span className="stat-icon"><Icon name="analyst" size={22} /></span>
          <span>
            <strong>AI Threat Analyst</strong>
            <small>Ask questions and get answers backed by retrieved evidence.</small>
          </span>
          <Icon name="arrow" />
        </button>
        <button type="button" className="card quick-link" onClick={() => navigate('/explorer')}>
          <span className="stat-icon"><Icon name="search" size={22} /></span>
          <span>
            <strong>Vulnerability Explorer</strong>
            <small>Search, page through and inspect individual records.</small>
          </span>
          <Icon name="arrow" />
        </button>
      </div>

      <section className="card panel" aria-labelledby="latest-heading">
        <div className="panel-head">
          <h2 id="latest-heading">Vulnerability records</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/explorer')}>
            View all
          </button>
        </div>
        <p className="muted panel-note">
          The first {LATEST_COUNT} records returned by the backend, in the order the API provides them. Source: {apiBaseUrl}
        </p>
        {latest.loading && <LoadingBlock label="Loading records…" />}
        {latest.error && <ErrorBanner title="Could not load records" error={latest.error} />}
        {!latest.loading && !latest.error && records.length === 0 && (
          <EmptyState icon="database" title="No records returned">
            The backend responded but returned no vulnerability records.
          </EmptyState>
        )}
        {!latest.loading && !latest.error && records.length > 0 && <VulnerabilityTable items={records} compact />}
      </section>
    </div>
  );
}
