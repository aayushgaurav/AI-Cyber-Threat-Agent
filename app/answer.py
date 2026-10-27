
import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

from app.rag import retrieve_vulnerabilities

PROJECT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_DIR / ".env")


def answer_question(question: str, records: list | None = None) -> str:
    """Answer a CTI question using retrieved vulnerability evidence."""

    if not question or not question.strip():
        return "Please enter a question."

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is missing. Check your project's .env file."
        )

    if records is None:
        records = retrieve_vulnerabilities(question, top_k=5)

    if not records:
        return (
            "No matching vulnerability records were found in the local "
            "database. Try a CVE ID, vendor, product, or vulnerability name."
        )

    evidence = []

    for record in records:
        evidence.append({
            "cve_id": record.get("cve_id"),
            "vendor": record.get("vendor"),
            "product": record.get("product"),
            "vulnerability_name": record.get("vulnerability_name"),
            "description": record.get("description"),
            "date_added": record.get("date_added"),
            "due_date": record.get("due_date"),
            "known_ransomware_use": record.get("known_ransomware_use"),
            "required_action": record.get("required_action"),
            "source_url": record.get("source_url"),
        })

    # Summarize ransomware status from the retrieved database records.
    ransomware_summary = None

    if "ransomware" in question.lower():
        known_records = [
            item for item in evidence
            if str(item.get("known_ransomware_use", "")).strip().lower()
            == "known"
        ]

        unknown_records = [
            item for item in evidence
            if str(item.get("known_ransomware_use", "")).strip().lower()
            == "unknown"
        ]

        other_records = [
            item for item in evidence
            if str(item.get("known_ransomware_use", "")).strip().lower()
            not in {"known", "unknown"}
        ]

        summary = [
            f"Retrieved records examined: {len(evidence)}.",
            f"Records marked Known for ransomware use: {len(known_records)}.",
            f"Records marked Unknown for ransomware use: {len(unknown_records)}.",
        ]

        if other_records:
            summary.append(
                f"Records with other or missing status values: {len(other_records)}."
            )

        if known_records:
            cve_ids = [
                str(item["cve_id"])
                for item in known_records
                if item.get("cve_id")
            ]
            summary.append("CVE IDs marked Known: " + ", ".join(cve_ids) + ".")

        summary.append(
            "Counts cover retrieved records only, not the entire database. "
            "Unknown does not mean No."
        )

        ransomware_summary = "\n".join(summary)

    client = Groq(api_key=api_key)

    system_prompt = (
        "You are a defensive Cyber Threat Intelligence analyst. "
        "Your knowledge is strictly limited to the vulnerability records supplied below. "
        "Those records come from the CISA Known Exploited Vulnerabilities (KEV) catalog "
        "and contain fields such as CVE ID, vendor, product, description, date added, "
        "due date, known ransomware use status, and required action. "
        "They do not contain general cybersecurity definitions, threat-actor profiles, "
        "geopolitical context, weather, or any information outside individual CVE entries."
        "\n\n"
        "Rules you must follow without exception:"
        "\n1. Answer only from the supplied records. Do not use your training knowledge "
        "to fill gaps, expand definitions, or add context not present in the records."
        "\n2. If the question asks for a general concept (e.g. 'What is ransomware?', "
        "'What is a zero-day?') that the records do not define, respond: "
        "'The retrieved records do not contain a definition for that term. "
        "This database holds CISA KEV vulnerability entries, not general cybersecurity "
        "reference material. I can only report what the records state about specific CVEs.'"
        "\n3. If the question is entirely outside the scope of vulnerability intelligence "
        "(e.g. weather, sports, general knowledge), respond: "
        "'That question is outside the scope of this vulnerability intelligence database.'"
        "\n4. Do not invent facts, CVE IDs, URLs, source names, or remediation steps."
        "\n5. Only mention CVE IDs present in the supplied records."
        "\n6. Quote a URL only if its exact value appears in the supplied evidence."
        "\n7. Unknown ransomware status does not mean ransomware use is absent."
        "\n8. Relevance scores are ranking metrics, not probabilities."
        "\n9. Retrieved records may be a subset of the database; do not make "
        "database-wide claims from a subset."
        "\n10. Cite CVE IDs in plain text."
    )

    user_content = (
        f"Question: {question}\n\n"
        "Retrieved vulnerability records:\n"
        + json.dumps(evidence, indent=2, ensure_ascii=False)
    )

    if ransomware_summary:
        user_content += (
            "\n\nDatabase-derived ransomware status summary:\n"
            + ransomware_summary
            + "\nUse these exact counts and do not make broader claims."
        )

    # Handle failures from the external AI service.
    try:
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
            max_tokens=900,
        )
    except Exception:
        return (
            "The AI service is temporarily unavailable. "
            "Please try again later."
        )

    answer = response.choices[0].message.content or (
        "The model returned an empty answer."
    )

    # Reject CVE IDs not present in the supplied evidence.
    valid_cves = {
        str(record.get("cve_id", "")).upper()
        for record in evidence
        if record.get("cve_id")
    }

    mentioned_cves = set(
        re.findall(r"\bCVE-\d{4}-\d{4,7}\b", answer.upper())
    )

    unsupported_cves = mentioned_cves - valid_cves

    if unsupported_cves:
        return (
            "The generated answer mentioned CVE IDs not present in the "
            "retrieved evidence: "
            + ", ".join(sorted(unsupported_cves))
            + ". Please retry with a more specific question."
        )

    return answer
