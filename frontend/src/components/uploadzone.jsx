import { useState, useRef } from 'react'

const MAX_MB = 10

export default function UploadZone({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState('')
  const inputRef = useRef(null)

  const validate = (file) => {
    if (!file) return 'No file selected.'
    if (!file.name.toLowerCase().endsWith('.pdf')) return 'Only PDF files are accepted.'
    if (file.size > MAX_MB * 1024 * 1024) return `File must be under ${MAX_MB}MB.`
    if (file.size < 100) return 'File is too small to be a valid PDF.'
    return null
  }

  const submit = (file) => {
    const err = validate(file)
    if (err) { setLocalError(err); return }
    setLocalError('')
    onFile(file)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    submit(e.dataTransfer.files[0])
  }

  return (
    <div style={{ paddingTop: 48, animation: 'fadeUp 0.5s ease 0.15s both', opacity: 0 }}>

      {/* hero text */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: 16,
          background: 'linear-gradient(135deg, var(--text) 40%, var(--accent2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Upload. Verify. Expose.
        </h2>
        <p style={{
          color: 'var(--text-dim)',
          maxWidth: 480,
          margin: '0 auto',
          fontSize: 16,
          lineHeight: 1.7,
        }}>
          Drop any PDF and our AI agent will extract every factual claim,
          cross-reference it against live web data, and flag what's wrong.
        </p>
      </div>

      {/* drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
          borderRadius: 20,
          padding: '64px 40px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging
            ? 'rgba(108,99,255,0.06)'
            : 'var(--surface)',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* glow when dragging */}
        {dragging && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(108,99,255,0.12), transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}

        <div style={{
          fontSize: 48,
          marginBottom: 16,
          filter: dragging ? 'none' : 'grayscale(0.3)',
          transition: 'filter 0.2s',
        }}>📄</div>

        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 700,
          color: dragging ? 'var(--accent2)' : 'var(--text)',
          marginBottom: 8,
          transition: 'color 0.2s',
        }}>
          {dragging ? 'Drop it!' : 'Drag & drop your PDF here'}
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          or <span style={{ color: 'var(--accent2)', textDecoration: 'underline' }}>browse files</span>
          &nbsp;· Max {MAX_MB}MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => submit(e.target.files[0])}
        />
      </div>

      {localError && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'var(--red-bg)',
          border: '1px solid var(--red-border)',
          color: 'var(--red)',
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          textAlign: 'center',
        }}>
          ⚠ {localError}
        </div>
      )}

      {/* what we check */}
      <div style={{
        marginTop: 48,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {[
          { icon: '📊', label: 'Statistics & Percentages' },
          { icon: '📅', label: 'Dates & Historical Events' },
          { icon: '💰', label: 'Financial Figures' },
          { icon: '🔬', label: 'Technical Claims' },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            padding: '16px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}