from datetime import datetime, timezone
import json
import os
import sqlite3
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
OUTPUT_FILE = Path(
    os.getenv(
        "CATALOG_PATH",
        str(DATA_DIR / "vulnerabilities.json")
    )
)

DATA_FILE = Path(
    os.getenv(
        "CATALOG_PATH",
        str(PROJECT_DIR / "data" / "vulnerabilities.json")
    )
)
DB_FILE = Path(
    os.getenv(
        "DATABASE_PATH",
        str(PROJECT_DIR / "data" / "threats.db")
    )
)


def initialize_database():
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS vulnerabilities (
                cve_id TEXT PRIMARY KEY,
                vendor TEXT,
                product TEXT,
                vulnerability_name TEXT,
                description TEXT,
                date_added TEXT,
                due_date TEXT,
                known_ransomware_use TEXT,
                required_action TEXT,
                source_url TEXT,
                last_collected TEXT
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_vulnerability_date
            ON vulnerabilities(date_added)
        """)


def import_vulnerabilities():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Catalog not found: {DATA_FILE}. Run collector.py first."
        )

    with DATA_FILE.open(encoding="utf-8") as file:
        catalog = json.load(file)

    inserted_or_updated = 0

    with sqlite3.connect(DB_FILE) as conn:
        for item in catalog["vulnerabilities"]:
            cve_id = item.get("cveID")

            if not isinstance(cve_id, str) or not cve_id.startswith("CVE-"):
                continue

            conn.execute("""
                INSERT INTO vulnerabilities (
                    cve_id, vendor, product, vulnerability_name,
                    description, date_added, due_date,
                    known_ransomware_use, required_action,
                    source_url, last_collected
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(cve_id) DO UPDATE SET
                    vendor = excluded.vendor,
                    product = excluded.product,
                    vulnerability_name = excluded.vulnerability_name,
                    description = excluded.description,
                    date_added = excluded.date_added,
                    due_date = excluded.due_date,
                    known_ransomware_use = excluded.known_ransomware_use,
                    required_action = excluded.required_action,
                    source_url = excluded.source_url,
                    last_collected = excluded.last_collected
            """, (
                cve_id,
                item.get("vendorProject"),
                item.get("product"),
                item.get("vulnerabilityName"),
                item.get("shortDescription"),
                item.get("dateAdded"),
                item.get("dueDate"),
                item.get("knownRansomwareCampaignUse"),
                item.get("requiredAction"),
                item.get("notes"),
                catalog.get("fetched_at"),
            ))

            inserted_or_updated += 1

    print(f"Records processed: {inserted_or_updated}")
    print(f"Database location: {DB_FILE}")


def show_statistics():
    with sqlite3.connect(DB_FILE) as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM vulnerabilities"
        ).fetchone()[0]

        print(f"Unique vulnerabilities in database: {total}")


if __name__ == "__main__":
    initialize_database()
    import_vulnerabilities()
    show_statistics()
