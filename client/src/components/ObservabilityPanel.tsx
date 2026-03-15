type Props = {
  backendOk: boolean | null;
  analyticsOk: boolean | null;
  lastRefresh: Date | null;
  eventCount: number | null;
  onRefresh: () => void;
  refreshing: boolean;
};

export default function ObservabilityPanel({
  backendOk,
  analyticsOk,
  lastRefresh,
  eventCount,
  onRefresh,
  refreshing,
}: Props) {
  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div className="observability-panel card">
      <h3 className="observability-title">System status</h3>
      <div className="observability-grid">
        <div className="observability-item">
          <span className="muted">Backend</span>
          <span className={backendOk === true ? 'status-ok' : backendOk === false ? 'status-err' : 'status-pending'}>
            {backendOk === true ? 'Up' : backendOk === false ? 'Down' : '—'}
          </span>
        </div>
        <div className="observability-item">
          <span className="muted">Analytics</span>
          <span className={analyticsOk === true ? 'status-ok' : analyticsOk === false ? 'status-err' : 'status-pending'}>
            {analyticsOk === true ? 'Up' : analyticsOk === false ? 'Down' : '—'}
          </span>
        </div>
        <div className="observability-item">
          <span className="muted">Last refresh</span>
          <span>{lastRefresh ? formatTime(lastRefresh) : '—'}</span>
        </div>
        <div className="observability-item">
          <span className="muted">Event count</span>
          <span>{eventCount !== null ? eventCount : '—'}</span>
        </div>
        <div className="observability-actions">
          <button type="button" className="btn-secondary" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}
