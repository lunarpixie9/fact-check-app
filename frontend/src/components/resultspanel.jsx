import { useState } from 'react'

const VERDICT_META = {
  Verified:   { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)', icon: '✓', label: 'Verified' },
  Inaccurate: { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)', icon: '~', label: 'Inaccurate' },
  False:      { color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)',   icon: '✗', label: 'False' },
}

function ConfidencePip({ value }) {
  const color = value >= 75 ? 'var(--green)' : value >= 45 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 80, height: 4,
        background: 'var(--surface2)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-dim)',
      }}>{value}%</span>
    </div>
  )
}

function ClaimCard({ item, index }) {
  const [expanded, setExpanded] = useState(false)
  const meta = VERDICT_META[item.verdict] || VERDICT_META['False']

  return (
    <div style={{
      border: `1px solid ${expanded ? meta.border : 'var(--border)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      animation: `fadeUp 0.35s ease ${index * 0.05}s both`,
    }}>
      {/* card header — always visible */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '16px 20px',
          background: expanded ? meta.bg : 'var(--surface)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          transition: 'background 0.2s',
        }}
      >
        {/* verdict badge */}
        <div style={{
          flexShrink: 0,
          width: 32, height: 32,
          borderRadius: 8,
          background: meta.bg,
          border: `1px solid ${meta.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 15,
          color: meta.color,
        }}>{meta.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            color: 'var(--text)',
            lineHeight: 1.55,
            fontStyle: 'italic',
            marginBottom: 8,
          }}>"{item.claim}"</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: meta.color,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontWeight: 600,
            }}>{meta.label}</span>
            <ConfidencePip value={item.confidence ?? 0} />
          </div>
        </div>

        <span style={{
          color: 'var(--text-faint)',
          fontSize: 18,
          flexShrink: 0,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          userSelect: 'none',
        }}>⌄</span>
      </div>

      {/* expanded details */}
      {expanded && (
        <div style={{
          padding: '0 20px 20px',
          background: meta.bg,
          borderTop: `1px solid ${meta.border}`,
          animation: 'fadeUp 0.2s ease both',
        }}>
          {/* reasoning */}
          <Section label="Reasoning">
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
              {item.reasoning || 'No reasoning provided.'}
            </p>
          </Section>

          {/* correct fact — only if not verified */}
          {item.verdict !== 'Verified' && item.correct_fact && (
            <Section label="Correct Fact">
              <div style={{
                padding: '12px 16px',
                background: 'var(--green-bg)',
                border: '1px solid var(--green-border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--green)',
                lineHeight: 1.6,
              }}>
                {item.correct_fact}
              </div>
            </Section>
          )}

          {/* context */}
          {item.context && (
            <Section label="Original Context">
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-dim)',
                lineHeight: 1.7,
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 6,
                borderLeft: '3px solid var(--border2)',
              }}>
                {item.context}
              </p>
            </Section>
          )}

          {/* sources */}
          {item.sources?.length > 0 && (
            <Section label="Sources">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {item.sources.filter(Boolean).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--accent2)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                    ↗ {url}
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--text-faint)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 8,
      }}>{label}</p>
      {children}
    </div>
  )
}

function SummaryCard({ label, count, color, bg, border }) {
  return (
    <div style={{
      flex: 1,
      padding: '20px 24px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 36,
        fontWeight: 800,
        color,
        lineHeight: 1,
        marginBottom: 6,
      }}>{count}</p>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>{label}</p>
    </div>
  )
}

export default function ResultsPanel({ results, summary, onReset }) {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All'
    ? results
    : results.filter(r => r.verdict === filter)

  const filters = ['All', 'Verified', 'Inaccurate', 'False']

  return (
    <div style={{ paddingTop: 40, animation: 'fadeUp 0.4s ease both' }}>

      {/* ── Summary row ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <SummaryCard
          label="Total Claims"
          count={summary?.total ?? results.length}
          color="var(--text)"
          bg="var(--surface)"
          border="var(--border2)"
        />
        <SummaryCard
          label="Verified"
          count={summary?.verified ?? 0}
          color="var(--green)"
          bg="var(--green-bg)"
          border="var(--green-border)"
        />
        <SummaryCard
          label="Inaccurate"
          count={summary?.inaccurate ?? 0}
          color="var(--amber)"
          bg="var(--amber-bg)"
          border="var(--amber-border)"
        />
        <SummaryCard
          label="False"
          count={summary?.false ?? 0}
          color="var(--red)"
          bg="var(--red-bg)"
          border="var(--red-border)"
        />
      </div>

      {/* integrity score */}
      {summary && summary.total > 0 && (() => {
        const score = Math.round((summary.verified / summary.total) * 100)
        const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)'
        const scoreLabel = score >= 70 ? 'High Integrity' : score >= 40 ? 'Questionable' : 'Low Credibility'
        return (
          <div style={{
            marginBottom: 32,
            padding: '20px 28px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}>Document Integrity Score</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                color: 'var(--text-dim)',
              }}>{scoreLabel} — {summary.verified} of {summary.total} claims check out</p>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              fontWeight: 800,
              color: scoreColor,
              lineHeight: 1,
            }}>{score}%</div>
          </div>
        )
      })()}

      {/* ── Filter tabs ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        padding: '4px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        width: 'fit-content',
      }}>
        {filters.map(f => {
          const active = filter === f
          const meta = VERDICT_META[f]
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 16px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.04em',
                background: active ? (meta?.bg || 'var(--surface2)') : 'transparent',
                color: active ? (meta?.color || 'var(--text)') : 'var(--text-dim)',
                transition: 'all 0.15s ease',
                fontWeight: active ? 600 : 400,
              }}
            >
              {f} {f !== 'All' && `(${results.filter(r => r.verdict === f).length})`}
            </button>
          )
        })}
      </div>

      {/* ── Claims list ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
        }}>
          No {filter.toLowerCase()} claims found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((item, i) => (
            <ClaimCard key={i} item={item} index={i} />
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{
        marginTop: 40,
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        <button onClick={onReset} style={{
          padding: '12px 28px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          fontWeight: 600,
          boxShadow: '0 0 20px rgba(108,99,255,0.35)',
          transition: 'opacity 0.15s',
        }}
          onMouseOver={e => e.target.style.opacity = '0.85'}
          onMouseOut={e => e.target.style.opacity = '1'}
        >
          ← Check Another PDF
        </button>

        <button
          onClick={() => {
            const data = JSON.stringify(results, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'factcheck-report.json'; a.click()
            URL.revokeObjectURL(url)
          }}
          style={{
            padding: '12px 28px',
            background: 'var(--surface)',
            color: 'var(--text-dim)',
            border: '1px solid var(--border2)',
            borderRadius: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseOver={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent2)' }}
          onMouseOut={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.color = 'var(--text-dim)' }}
        >
          ↓ Export JSON Report
        </button>
      </div>
    </div>
  )
}