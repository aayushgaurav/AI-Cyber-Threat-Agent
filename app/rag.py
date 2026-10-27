
import math
import re
import sqlite3
from collections import Counter
from pathlib import Path

import os

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_FILE = Path(
    os.getenv(
        "DATABASE_PATH",
        str(PROJECT_DIR / "data" / "threats.db")
    )
)

STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "which",
    "what", "who", "how", "with", "for", "and", "or", "to",
    "of", "in", "on", "by", "from", "about", "me", "show",
    "find", "list", "tell", "associated"
}


def tokenize(text):
    words = re.findall(r"[a-zA-Z0-9]+", (text or "").lower())
    return [word for word in words if word not in STOP_WORDS]


def retrieve_vulnerabilities(question: str, top_k: int = 5):
    """Rank local vulnerability records using a simple BM25-style score."""

    if not question or not question.strip():
        return []

    top_k = max(1, min(top_k, 10))

    
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT cve_id, vendor, product, vulnerability_name,
                   description, date_added, due_date,
                   known_ransomware_use, required_action, source_url
            FROM vulnerabilities
        """).fetchall()

    if not rows:
        return []

    # If the question explicitly mentions a vendor in the database,
    # restrict retrieval to that vendor's records.
    question_lower = question.lower()

    mentioned_vendors = {
        str(row["vendor"]).strip().lower()
        for row in rows
        if row["vendor"]
        and re.search(
            rf"\b{re.escape(str(row['vendor']).strip().lower())}\b",
            question_lower
        )
    }

    if mentioned_vendors:
        rows = [
            row for row in rows
            if row["vendor"]
            and str(row["vendor"]).strip().lower() in mentioned_vendors
        ]

    if not rows:
        return []


    fields = [
        "cve_id", "vendor", "product", "vulnerability_name",
        "description", "required_action", "known_ransomware_use"
    ]

    documents = [
        tokenize(" ".join(str(row[field] or "") for field in fields))
        for row in rows
    ]

    document_frequency = Counter()
    for document in documents:
        document_frequency.update(set(document))

    average_length = sum(map(len, documents)) / len(documents) or 1
    query_terms = set(tokenize(question))
    total_documents = len(documents)
    scored = []

    for row, document in zip(rows, documents):
        frequencies = Counter(document)
        length = len(document)
        score = 0.0

        for term in query_terms:
            frequency = frequencies[term]
            if not frequency:
                continue

            df = document_frequency[term]
            inverse_frequency = math.log(
                1 + (total_documents - df + 0.5) / (df + 0.5)
            )

            denominator = frequency + 1.2 * (
                1 - 0.75 + 0.75 * length / average_length
            )
            score += inverse_frequency * (
                frequency * 2.2 / denominator
            )

        if score > 0:
            result = dict(row)
            result["relevance_score"] = round(score, 4)
            scored.append(result)

    scored.sort(key=lambda item: item["relevance_score"], reverse=True)
    return scored[:top_k]
