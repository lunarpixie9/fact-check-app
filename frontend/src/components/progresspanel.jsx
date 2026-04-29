const verdictStyle = (verdict) => {
  switch (verdict) {
    case 'Verified': return { pill: 'verified', label: 'Verified' }
    case 'Inaccurate': return { pill: 'inaccurate', label: 'Inaccurate' }
    case 'False': return { pill: 'false', label: 'False' }
    default: return { pill: 'false', label: 'Unknown' }
  }
}

export default function ProgressPanel({
  statusMsg, progress, results, currentClaim, isError, errorMsg, onReset
}) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <section className="section-card">
      <div className="status-row">
        <strong>{isError ? 'Processing error' : 'Fact-check in progress'}</strong>
        {progress.total > 0 && (
          <span className="muted">
            {progress.current} / {progress.total} claims
          </span>
        )}
      </div>

      {progress.total > 0 && (
        <div className="progress-track">
          <div className="progress-value" style={{ width: `${pct}%` }} />
        </div>
      )}

      <p className="muted" style={{ margin: 0 }}>
        {isError ? errorMsg : statusMsg}
      </p>

      {currentClaim && !isError && (
        <div style={{
          marginTop: 12,
          borderLeft: '3px solid var(--accent)',
          paddingLeft: 10,
          color: 'var(--muted)',
          fontSize: 13,
        }}>
          {currentClaim}
        </div>
      )}

      {isError && (
        <div className="inline-btns">
          <button className="btn btn-primary" onClick={onReset}>
            Try again
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="result-list">
          {results.map((r, i) => {
            const s = verdictStyle(r.verdict)
            return (
              <article key={i} className="result-item">
                <div className="result-head">
                  <strong style={{ fontSize: 14 }}>{r.claim}</strong>
                  <span className={`pill ${s.pill}`}>{s.label}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}