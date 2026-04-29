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
    <>
      <section className="hero">
        <div>
          <h1>Verify marketing claims before they spread.</h1>
          <p>
            Upload a PDF and get a structured fact-check report with claim-level verdicts,
            reasoning, and source links from live web evidence.
          </p>
        </div>
        <div className="hero-side">
          <strong className="hero-side-title">What this checks</strong>
          <p className="muted" style={{ marginTop: 16 }}>
            Statistics, financial numbers, dates, product assertions, and technical claims.
          </p>
          <p className="muted" style={{ marginTop: 12 }}>
            Verdicts: Verified, Inaccurate, or False.
          </p>
        </div>
      </section>

      <section className="section-card">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Upload PDF</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
          Drag and drop your file or choose from disk. Maximum size: {MAX_MB}MB.
        </p>

        <div
          className={`upload-dropzone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            {dragging ? 'Drop file to start analysis' : 'Drag and drop PDF here'}
          </p>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            or click to browse files
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
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--false)',
            color: 'var(--false)',
            background: 'var(--false-bg)',
            fontSize: 13,
          }}>
            {localError}
          </div>
        )}

        <div className="feature-grid">
          <div className="feature-item">Market and usage statistics</div>
          <div className="feature-item">Dates and historical references</div>
          <div className="feature-item">Revenue and valuation claims</div>
          <div className="feature-item">Technical and product statements</div>
        </div>
      </section>
    </>
  )
}