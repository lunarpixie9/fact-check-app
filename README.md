# ⚡ FactCheck Agent — Truth Layer

> Automated PDF fact-checking powered by **Claude (Anthropic)** + **Tavily Search**  
> Built for CogCulture Product Management Intern Assessment

---

##  Live Demo

| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://fact-check-application.vercel.app/` |
| Backend (Render)  | `https://fact-check-app-xwxl.onrender.com` |

---

##  How It Works

```
PDF Upload
    │
    ▼
PyMuPDF — Extract text
    │
    ▼
Claude (claude-opus-4-5)
— Identify all verifiable claims
  (stats, dates, figures, assertions)
    │
    ▼
For each claim:
  Tavily Search — live web evidence
    │
    ▼
  Claude — verdict:
    ✓  Verified   (matches web evidence)
    ~  Inaccurate (outdated / wrong numbers)
    ✗  False      (contradicted / no evidence)
    │
    ▼
SSE stream → React frontend
— Live results as they arrive
— Summary + export to JSON
```

---

##  Project Structure

```
factcheck-app/
├── backend/
│   ├── main.py           # FastAPI app — extraction, verification, SSE streaming
│   ├── requirements.txt
│   ├── render.yaml       # Render deployment config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx               # Main app shell + SSE consumer
    │   ├── index.css             # Design system + animations
    │   ├── main.jsx
    │   └── components/
    │       ├── Header.jsx        # Top nav
    │       ├── UploadZone.jsx    # Drag-and-drop PDF upload
    │       ├── ProgressPanel.jsx # Live streaming progress view
    │       └── ResultsPanel.jsx  # Final report with filters + export
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json
    └── .env.example
```

---

##  Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React + Vite | Fast, modern, Vercel-native |
| Backend | FastAPI (Python) | Async, streaming, AI-friendly |
| PDF Parsing | PyMuPDF | Fastest Python PDF extractor |
| Claim Extraction | Claude claude-opus-4-5 | Best structured reasoning |
| Web Search | Tavily Search API | Purpose-built for LLM agents |
| Streaming | Server-Sent Events (SSE) | Real-time results without websockets |
| Frontend Deploy | Vercel | Zero-config React deployment |
| Backend Deploy | Render | Free Python hosting with env vars |

---

##  Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Anthropic API key → https://console.anthropic.com
- Tavily API key → https://app.tavily.com (free tier: 1000 searches/month)

### 1. Clone
```bash
git clone https://github.com/lunarpixie9/fact-check-app.git
cd factcheck-app
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# create .env
cp .env.example .env
# → fill in ANTHROPIC_API_KEY and TAVILY_API_KEY

uvicorn main:app --reload --port 8000
```
Backend runs at → http://localhost:8000  
Health check → http://localhost:8000/api/health

### 3. Frontend
```bash
cd frontend
npm install

# create .env.local
echo "VITE_API_URL=" > .env.local   # empty = uses Vite proxy to localhost:8000

npm run dev
```
Frontend runs at → http://localhost:5173

---

##  Deployment

### Backend → Render

1. Push code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo, set **Root Directory** to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add env vars: `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`
7. (Recommended) Add `CORS_ORIGINS=https://fact-check-application.vercel.app/`
8. Deploy — note the URL (e.g. `https://factcheck-backend.onrender.com`)

### Frontend → Vercel

1. Go to https://vercel.com → New Project
2. Import your GitHub repo, set **Root Directory** to `frontend`
3. Add env var: `VITE_API_URL=https://fact-check-app-xwxl.onrender.com`
4. Deploy

>  After deploying the backend, update frontend env var `VITE_API_URL` to your real Render URL and re-deploy the frontend.

---

##  Security Features

- **File validation**: PDF-only, max 10MB, minimum size check, encryption detection
- **Text capping**: Only first 15,000 characters sent to Claude (prevents prompt injection via giant PDFs)
- **Claim capping**: Max 20 claims per document (controls API costs + abuse)
- **CORS**: Locked to your Vercel domain in production
- **No data persistence**: PDFs are never written to disk — processed in-memory only
- **Abort controller**: Frontend cancels the request if user navigates away

---

##  Evaluation Criteria (Trap Document)

The system is specifically designed to catch:
- ✗ **Outdated statistics** (e.g. old market size figures)
- ✗ **Hallucinated numbers** (e.g. fake adoption rates)
- ✗ **Wrong dates** (e.g. incorrect founding years)
- ✗ **Inflated financial claims** (e.g. revenue figures that don't match public data)
- ✓ **Correct facts are verified** and sourced

Each result includes:
- Verdict (Verified / Inaccurate / False)
- Reasoning from Claude
- The correct fact with evidence
- Live source URLs from Tavily

---

##  API Reference

### `POST /api/factcheck`
Upload a PDF for fact-checking.

**Request:** `multipart/form-data` with field `file` (PDF)

**Response:** `text/event-stream` — SSE events:

```json
{ "event": "status",       "message": "..." }
{ "event": "claims_found", "total": 12, "message": "..." }
{ "event": "verifying",    "current": 3, "total": 12, "claim": "..." }
{ "event": "result",       "item": { "claim": "...", "verdict": "...", ... } }
{ "event": "done",         "summary": { "total": 12, "verified": 5, ... } }
{ "event": "error",        "message": "..." }
```

### `GET /api/health`
Returns `{"status": "ok"}` — use for uptime monitoring.

---

##  License

MIT — built for CogCulture assessment purposes.