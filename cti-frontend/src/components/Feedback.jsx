import { Icon } from './Icons.jsx';

export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <span className="spinner-ring" aria-hidden="true" />
    </span>
  );
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="state-block" role="status">
      <Spinner label={label} />
      <p>{label}</p>
    </div>
  );
}

export function ErrorBanner({ title = 'Something went wrong', error, onRetry }) {
  const message = typeof error === 'string' ? error : error?.message || 'Unknown error.';
  return (
    <div className="banner banner-error" role="alert">
      <Icon name="alert" />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
        {onRetry && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'info', title, children }) {
  return (
    <div className="state-block empty">
      <span className="empty-icon"><Icon name={icon} size={28} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Unavailable({ children = 'Not available from the backend' }) {
  return <span className="unavailable">{children}</span>;
}

export function RansomwareBadge({ value }) {
  if (!value) return <Unavailable>Not provided</Unavailable>;
  const v = String(value).trim();
  const cls = /^known$/i.test(v) ? 'badge-danger' : /^unknown$/i.test(v) ? 'badge-neutral' : 'badge-info';
  return <span className={`badge ${cls}`}>{v}</span>;
}
