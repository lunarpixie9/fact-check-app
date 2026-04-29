import os
import json
import asyncio
import re
import fitz  # PyMuPDF
import anthropic
from tavily import TavilyClient
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import AsyncGenerator
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FactCheck Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lock this to your Vercel domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── clients ────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
TAVILY_API_KEY    = os.environ.get("TAVILY_API_KEY", "")

if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY env var is missing")
if not TAVILY_API_KEY:
    raise RuntimeError("TAVILY_API_KEY env var is missing")

claude  = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
tavily  = TavilyClient(api_key=TAVILY_API_KEY)

# ── constants ─────────────────────────────────────────────────────────────────
MAX_PDF_SIZE_MB   = 10
MAX_TEXT_CHARS    = 15_000   # send first 15k chars to Claude for extraction
MAX_CLAIMS        = 20       # cap to avoid runaway API costs
TAVILY_MAX_RESULTS = 5


# ── helpers ───────────────────────────────────────────────────────────────────
def extract_text_from_pdf(data: bytes) -> str:
    """Extract text using PyMuPDF. Raises on corrupt / password-protected PDF."""
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not open PDF: {e}")

    if doc.is_encrypted:
        raise HTTPException(status_code=400, detail="Password-protected PDFs are not supported.")

    pages = []
    for page in doc:
        pages.append(page.get_text())
    text = "\n".join(pages).strip()

    if len(text) < 50:
        raise HTTPException(status_code=400, detail="PDF appears to be image-only or empty — no extractable text found.")

    return text[:MAX_TEXT_CHARS]


def safe_json_parse(raw: str) -> list[dict]:
    """Strip markdown fences and parse JSON safely."""
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        if isinstance(result, dict) and "claims" in result:
            return result["claims"]
        return []
    except json.JSONDecodeError:
        logger.warning("JSON parse failed on: %s", cleaned[:300])
        return []


def extract_claims_from_text(text: str) -> list[dict]:
    """
    Ask Claude to pull out all verifiable factual claims:
    stats, dates, financial figures, named entities + assertions.
    Returns [{"claim": str, "context": str}, ...]
    """
    prompt = f"""You are a precise fact-extraction engine used inside a fact-checking tool.

From the document text below, extract ALL verifiable factual claims. Focus on:
- Statistics and percentages (e.g. "70% of users prefer X")
- Dates and historical events (e.g. "Company X was founded in 2005")
- Financial figures (e.g. "revenue of $2B", "valued at $50M")
- Named organizations, people, products with specific assertions
- Technical figures (e.g. "model achieves 95% accuracy")
- Market data, rankings, awards

Rules:
1. Extract ONLY checkable, specific claims — not vague opinions.
2. Include the verbatim claim text AND a short surrounding context sentence.
3. Return ONLY a JSON array. No preamble. No markdown fences.
4. Maximum {MAX_CLAIMS} claims. Prioritize the most specific/numeric ones.
5. Format exactly: [{{"claim": "...", "context": "..."}}]

Document text:
\"\"\"
{text}
\"\"\"

Return ONLY the JSON array:"""

    message = claude.messages.create(
        model="claude-opus-4-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = message.content[0].text
    return safe_json_parse(raw)


def verify_claim(claim: str, context: str) -> dict:
    """
    1. Search the web via Tavily for evidence about the claim.
    2. Ask Claude to verdict: Verified / Inaccurate / False + reasoning + correct fact.
    """
    # --- web search ---
    try:
        search_result = tavily.search(
            query=claim,
            search_depth="advanced",
            max_results=TAVILY_MAX_RESULTS,
            include_answer=True,
        )
        web_evidence = search_result.get("answer", "")
        sources = [r.get("url", "") for r in search_result.get("results", [])]
        raw_snippets = "\n\n".join(
            f"Source: {r.get('url','')}\n{r.get('content','')[:600]}"
            for r in search_result.get("results", [])
        )
    except Exception as e:
        logger.warning("Tavily search failed for claim '%s': %s", claim[:80], e)
        web_evidence = ""
        sources = []
        raw_snippets = "No web results available."

    # --- verdict from Claude ---
    verdict_prompt = f"""You are a rigorous fact-checking agent. Your job is to judge whether a claim from a document is accurate based on live web evidence.

CLAIM: "{claim}"
CONTEXT IN DOCUMENT: "{context}"

WEB SEARCH SUMMARY: {web_evidence}

WEB SOURCE SNIPPETS:
{raw_snippets}

Instructions:
- Verdict must be exactly ONE of: "Verified", "Inaccurate", or "False"
  * Verified   → claim matches current web evidence
  * Inaccurate → claim is partially right but contains wrong/outdated numbers or details
  * False      → claim is clearly contradicted by evidence, or no credible evidence exists
- Be strict. Marketing documents often contain outdated or inflated stats.
- "correct_fact" must state what the accurate information actually is (cite a number/date if available).
- "confidence" is a number 0–100 reflecting how certain you are.

Return ONLY this JSON (no markdown, no extra text):
{{
  "verdict": "Verified" | "Inaccurate" | "False",
  "reasoning": "one or two sentences explaining the verdict",
  "correct_fact": "what the accurate fact is, or 'Claim appears correct.' if verified",
  "confidence": 0-100,
  "sources": {json.dumps(sources[:3])}
}}"""

    try:
        msg = claude.messages.create(
            model="claude-opus-4-5",
            max_tokens=512,
            messages=[{"role": "user", "content": verdict_prompt}]
        )
        raw_verdict = msg.content[0].text
        parsed = safe_json_parse(raw_verdict)
        if isinstance(parsed, dict) and "verdict" in parsed:
            verdict_data = parsed
        else:
            # try direct parse (it's a dict, not list)
            cleaned = re.sub(r"```(?:json)?", "", raw_verdict).strip().rstrip("`").strip()
            verdict_data = json.loads(cleaned)
    except Exception as e:
        logger.warning("Verdict parse failed: %s", e)
        verdict_data = {
            "verdict": "False",
            "reasoning": "Could not verify — web search or parse error.",
            "correct_fact": "Unable to determine.",
            "confidence": 0,
            "sources": sources[:3],
        }

    return {
        "claim": claim,
        "context": context,
        "verdict": verdict_data.get("verdict", "False"),
        "reasoning": verdict_data.get("reasoning", ""),
        "correct_fact": verdict_data.get("correct_fact", ""),
        "confidence": verdict_data.get("confidence", 0),
        "sources": verdict_data.get("sources", sources[:3]),
    }


# ── SSE streaming endpoint ─────────────────────────────────────────────────────
async def fact_check_stream(pdf_data: bytes) -> AsyncGenerator[str, None]:
    """Generator that yields SSE-formatted JSON events."""

    def send(event: str, data: dict) -> str:
        return f"data: {json.dumps({'event': event, **data})}\n\n"

    # 1. Extract text
    yield send("status", {"message": "Extracting text from PDF…"})
    try:
        text = extract_text_from_pdf(pdf_data)
    except HTTPException as e:
        yield send("error", {"message": e.detail})
        return

    yield send("status", {"message": f"Extracted {len(text):,} characters. Identifying claims…"})

    # 2. Extract claims
    try:
        claims = await asyncio.to_thread(extract_claims_from_text, text)
    except Exception as e:
        yield send("error", {"message": f"Claim extraction failed: {e}"})
        return

    if not claims:
        yield send("error", {"message": "No verifiable claims found in this document."})
        return

    # Cap at MAX_CLAIMS
    claims = claims[:MAX_CLAIMS]
    yield send("claims_found", {"total": len(claims), "message": f"Found {len(claims)} verifiable claims. Starting verification…"})

    # 3. Verify each claim
    results = []
    for i, item in enumerate(claims):
        claim_text = item.get("claim", "").strip()
        context    = item.get("context", "").strip()
        if not claim_text:
            continue

        yield send("verifying", {
            "current": i + 1,
            "total": len(claims),
            "claim": claim_text,
            "message": f"Verifying claim {i+1}/{len(claims)}…",
        })

        try:
            result = await asyncio.to_thread(verify_claim, claim_text, context)
        except Exception as e:
            result = {
                "claim": claim_text,
                "context": context,
                "verdict": "False",
                "reasoning": f"Error during verification: {e}",
                "correct_fact": "Unable to determine.",
                "confidence": 0,
                "sources": [],
            }

        results.append(result)
        yield send("result", {"item": result})

    # 4. Summary
    verdicts = [r["verdict"] for r in results]
    summary = {
        "total": len(results),
        "verified":   verdicts.count("Verified"),
        "inaccurate": verdicts.count("Inaccurate"),
        "false":      verdicts.count("False"),
    }
    yield send("done", {"summary": summary, "message": "Fact-check complete."})


@app.post("/api/factcheck")
async def factcheck_endpoint(file: UploadFile = File(...)):
    # --- validation ---
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_data = await file.read()

    if len(pdf_data) > MAX_PDF_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_PDF_SIZE_MB}MB limit.")

    if len(pdf_data) < 100:
        raise HTTPException(status_code=400, detail="File is too small to be a valid PDF.")

    return StreamingResponse(
        fact_check_stream(pdf_data),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}