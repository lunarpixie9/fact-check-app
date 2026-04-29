export default function Header() {
  return (
    <header style={{
      padding: '32px 24px 0',
      maxWidth: 900,
      width: '100%',
      margin: '0 auto',
      animation: 'fadeUp 0.6s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        {/* logo mark */}
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
          boxShadow: '0 0 24px rgba(108,99,255,0.35)',
        }}>⚡</div>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            lineHeight: 1,
          }}>
            FactCheck Agent
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--accent2)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: 3,
          }}>
            Truth Layer · Powered by Claude + Tavily
          </p>
        </div>
      </div>

      {/* thin rule */}
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg, var(--accent) 0%, transparent 70%)',
        marginTop: 24,
        opacity: 0.3,
        animation: 'drawLine 0.8s ease 0.3s both',
      }} />
    </header>
  )
}