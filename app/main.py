import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field
from app.answer import answer_question
from app.rag import retrieve_vulnerabilities
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_FILE = Path(
    os.getenv(
        "DATABASE_PATH",
        str(PROJECT_DIR / "data" / "threats.db"),
    )
)

def get_connection():
    if not DB_FILE.exists():
        raise RuntimeError(
            "Database missing. Run python app/database.py first."
        )

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not DB_FILE.exists():
        from app.collector import fetch_vulnerabilities
        from app.database import initialize_database, import_vulnerabilities

        fetch_vulnerabilities()
        initialize_database()
        import_vulnerabilities()

    yield


app = FastAPI(
    title="AI Cyber Threat Intelligence Agent",
    description="Search and inspect public CISA vulnerability records.",
    version="0.1.0",
    lifespan=lifespan,
)


FRONTEND_URL = os.getenv("FRONTEND_URL", "").rstrip("/")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "cyber-threat-intelligence"}


@app.get("/stats")
def stats():
    with get_connection() as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM vulnerabilities"
        ).fetchone()[0]

    return {"unique_vulnerabilities": total}


@app.get("/vulnerabilities")
def search_vulnerabilities(
    q: Optional[str] = Query(default=None, max_length=200),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    where = ""
    params: list = []

    if q and q.strip():
        where = """
            WHERE cve_id LIKE ?
               OR vendor LIKE ?
               OR product LIKE ?
               OR vulnerability_name LIKE ?
               OR description LIKE ?
        """
        pattern = f"%{q.strip()}%"
        params.extend([pattern] * 5)

    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM vulnerabilities {where}", params
        ).fetchone()[0]

        rows = conn.execute(
            f"""
            SELECT cve_id, vendor, product, vulnerability_name,
                   description, date_added, due_date,
                   known_ransomware_use, required_action,
                   source_url, last_collected
            FROM vulnerabilities {where}
            ORDER BY date_added DESC, cve_id LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        ).fetchall()

    return {
        "total": total,
        "count": len(rows),
        "limit": limit,
        "offset": offset,
        "results": [dict(row) for row in rows],
    }


@app.get("/vulnerabilities/{cve_id}")
def get_vulnerability(cve_id: str):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM vulnerabilities WHERE cve_id = ?",
            (cve_id.upper(),),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Vulnerability not found in the local database.",
        )

    return dict(row)


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)




@app.post("/ask")
def ask_agent(request: AskRequest):
    """Answer a defensive cyber threat intelligence question."""

    records = retrieve_vulnerabilities(request.question, top_k=5)
    answer = answer_question(request.question, records=records)

    return {
        "question": request.question,
        "answer": answer,
        "evidence": [
            {
                "cve_id": record.get("cve_id"),
                "vendor": record.get("vendor"),
                "product": record.get("product"),
                "known_ransomware_use": record.get("known_ransomware_use"),
                "required_action": record.get("required_action"),
                "relevance_score": record.get("relevance_score"),
            }
            for record in records
        ],
    }