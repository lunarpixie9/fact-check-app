import { useState } from 'react'

const VERDICT_META = {
  Verified: { cls: 'verified', label: 'Verified' },
  Inaccurate: { cls: 'inaccurate', label: 'Inaccurate' },
  False: { cls: 'false', label: 'False' },
}

function ClaimCard({ item, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const meta = VERDICT_META[item.verdict] || VERDICT_META.False

  return (
    <article className="result-item">
      <div className="result-head">
        <strong style={{ fontSize: 14 }}>{item.claim}</strong>
        <span className={`pill ${meta.cls}`}>{meta.label}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <span className="muted" style={{ fontSize: 12 }}>
          Confidence: {item.confidence ?? 0}%
        </span>
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: 12 }}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {expanded && (
        <div style={{ fontSize: 13 }}>
          <p><strong>Reasoning:</strong> {item.reasoning || 'Not provided.'}</p>
          {item.verdict !== 'Verified' && item.correct_fact && (
            <p><strong>Correct fact:</strong> {item.correct_fact}</p>
          )}
          {item.context && <p><strong>Original context:</strong> {item.context}</p>}
          {item.sources?.length > 0 && (
            <div>
              <strong>Sources:</strong>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {item.sources.filter(Boolean).map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function SummaryCard({ label, count }) {
  return (
    <div className="summary-box">
      <h3>{count}</h3>
      <p>{label}</p>
    </div>
  )
}

export default function ResultsPanel({ results, summary, onReset }) {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All'
    ? results
    : results.filter((r) => r.verdict === filter)

  const filters = ['All', 'Verified', 'Inaccurate', 'False']

  return (
    <section className="section-card">
      <h2 style={{ marginTop: 0 }}>Fact-check report</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Review each claim, inspect the evidence, and export the full report.
      </p>

      <div className="summary-grid">
        <SummaryCard
          label="Total claims"
          count={summary?.total ?? results.length}
        />
        <SummaryCard
          label="Verified"
          count={summary?.verified ?? 0}
        />
        <SummaryCard
          label="Inaccurate"
          count={summary?.inaccurate ?? 0}
        />
        <SummaryCard
          label="False"
          count={summary?.false ?? 0}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {filters.map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
            style={{ padding: '7px 12px' }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="muted" style={{ padding: '12px 0' }}>
          No claims in this filter.
        </div>
      ) : (
        <div className="result-list">
          {filtered.map((item, i) => (
            <ClaimCard key={i} item={item} index={i} />
          ))}
        </div>
      )}

      <div className="inline-btns">
        <button className="btn btn-primary" onClick={onReset}>
          Check another PDF
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const data = JSON.stringify(results, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'factcheck-report.json'
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Export JSON report
        </button>
      </div>
    </section>
  )
}