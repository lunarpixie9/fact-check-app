import { useState, useCallback, useRef } from 'react'
import UploadZone from './components/uploadzone.jsx'
import ProgressPanel from './components/progresspanel.jsx'
import ResultsPanel from './components/resultspanel.jsx'
import Header from './components/header.jsx'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [phase, setPhase] = useState('idle')         // idle | checking | done | error
  const [statusMsg, setStatusMsg] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState([])
  const [summary, setSummary] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [currentClaim, setCurrentClaim] = useState('')
  const abortRef = useRef(null)

  const reset = () => {
    abortRef.current?.abort()
    setPhase('idle')
    setStatusMsg('')
    setProgress({ current: 0, total: 0 })
    setResults([])
    setSummary(null)
    setErrorMsg('')
    setCurrentClaim('')
  }

  const handleFile = useCallback(async (file) => {
    reset()
    setPhase('checking')
    setStatusMsg('Uploading PDF…')

    const controller = new AbortController()
    abortRef.current = controller

    const form = new FormData()
    form.append('file', file)

    let response
    try {
      response = await fetch(`${API_URL}/api/factcheck`, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      })
    } catch (err) {
      if (err.name === 'AbortError') return
      setPhase('error')
      setErrorMsg('Could not reach the server. Please try again.')
      return
    }

    if (!response.ok) {
      let detail = 'Upload failed.'
      try { detail = (await response.json()).detail } catch {}
      setPhase('error')
      setErrorMsg(detail)
      return
    }

    // consume SSE stream
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const processChunk = (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        let evt
        try { evt = JSON.parse(line.slice(6)) } catch { continue }

        switch (evt.event) {
          case 'status':
            setStatusMsg(evt.message)
            break
          case 'claims_found':
            setStatusMsg(evt.message)
            setProgress({ current: 0, total: evt.total })
            break
          case 'verifying':
            setStatusMsg(evt.message)
            setCurrentClaim(evt.claim)
            setProgress({ current: evt.current, total: evt.total })
            break
          case 'result':
            setResults(prev => [...prev, evt.item])
            break
          case 'done':
            setSummary(evt.summary)
            setPhase('done')
            break
          case 'error':
            setPhase('error')
            setErrorMsg(evt.message)
            break
        }
      }
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        processChunk(decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setPhase('error')
        setErrorMsg('Stream interrupted. Please retry.')
      }
    }
  }, [])

  return (
    <div className="app-shell">
      <Header />

      <main className="container" style={{ paddingTop: 0, paddingBottom: 40 }}>
        {phase === 'idle' && <UploadZone onFile={handleFile} />}

        {(phase === 'checking' || phase === 'error') && (
          <ProgressPanel
            statusMsg={statusMsg}
            progress={progress}
            results={results}
            currentClaim={currentClaim}
            isError={phase === 'error'}
            errorMsg={errorMsg}
            onReset={reset}
          />
        )}

        {phase === 'done' && (
          <ResultsPanel
            results={results}
            summary={summary}
            onReset={reset}
          />
        )}
      </main>
    </div>
  )
}