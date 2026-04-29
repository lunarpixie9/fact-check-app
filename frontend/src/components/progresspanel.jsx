const verdictStyle = (verdict) => {
  switch (verdict) {
    case 'Verified':   return { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)', icon: '✓' }
    case 'Inaccurate': return { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)', icon: '~' }
    case 'False':      return { color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)',   icon: '✗' }
    default:           return { color: 'var(--text-dim)', bg: 'transparent',  border: 'var(--border)',       icon: '?' }
  }
}

export default function ProgressPanel({
  statusMsg, progress, results, currentClaim, isError, errorMsg, onReset
}) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div style={{ paddingTop: 40, animation: 'fadeUp 0.4s ease both' }}>

      {/* ── Status bar ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isError ? (
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--accent)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: -4,
                  borderRadius: '50%',
                  border: '2px solid var(--accent)',
                  animation: 'pulse-ring 1.2s ease-out infinite',
                }} />
              </div>
            ) : (
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)' }} />
            )}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: isError ? 'var(--red)' : 'var(--accent2)',
              letterSpacing: '0.04em',
            }}>
              {isError ? 'ERROR' : 'RUNNING'}
            </span>
          </div>

          {progress.total > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--text-dim)',
            }}>
              {progress.current} / {progress.total} claims
            </span>
          )}
        </div>

        {/* progress bar */}
        {progress.total > 0 && (
          <div style={{
            height: 4,
            background: 'var(--surface2)',
            borderRadius: 2,
            marginBottom: 20,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 2,
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              transition: 'width 0.4s ease',
              boxShadow: '0 0 12px rgba(108,99,255,0.5)',
            }} />
          </div>
        )}

        {/* status message */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: isError ? 'var(--red)' : 'var(--text-dim)',
          lineHeight: 1.5,
        }}>
          {isError ? `⚠ ${errorMsg}` : `› ${statusMsg}`}
          {!isError && <span style={{ animation: 'blink 1s infinite', display: 'inline-block', marginLeft: 2 }}>_</span>}
        </p>

        {/* current claim being checked */}
        {currentClaim && !isError && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'var(--surface2)',
            borderRadius: 8,
            borderLeft: '3px solid var(--accent)',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}>Checking claim</p>
            <p style={{
              fontSize: 13,
              color: 'var(--text)',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}>"{currentClaim}"</p>
          </div>
        )}

        {isError && (
          <button onClick={onReset} style={btnStyle('#6c63ff')}>
            ← Try Again
          </button>
        )}
      </div>

      {/* ── Live results as they stream in ── */}
      {results.length > 0 && (
        <div>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            Live results ({results.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((r, i) => {
              const s = verdictStyle(r.verdict)
              return (
                <div key={i} style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  animation: 'fadeUp 0.3s ease both',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 16,
                    color: s.color,
                    flexShrink: 0,
                    width: 20,
                    textAlign: 'center',
                    marginTop: 1,
                  }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text)',
                      lineHeight: 1.5,
                      marginBottom: 2,
                      fontStyle: 'italic',
                    }}>"{r.claim}"</p>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: s.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>{r.verdict}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle = (bg) => ({
  marginTop: 20,
  padding: '10px 22px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  cursor: 'pointer',
  letterSpacing: '0.04em',
})