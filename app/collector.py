
import json
from datetime import datetime, timezone
from pathlib import Path

import requests

CISA_URL = (
    "https://www.cisa.gov/sites/default/files/feeds/"
    "known_exploited_vulnerabilities.json"
)

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
OUTPUT_FILE = DATA_DIR / "vulnerabilities.json"


def fetch_vulnerabilities():
    print("Connecting to the official CISA catalog...")

    response = requests.get(
        CISA_URL,
        timeout=30,
        headers={"User-Agent": "AI-Cyber-Threat-Intelligence-Agent/1.0"},
    )
    response.raise_for_status()

    catalog = response.json()

    vulnerabilities = catalog.get("vulnerabilities")
    if not isinstance(vulnerabilities, list):
        raise ValueError("Invalid catalog: vulnerabilities list missing.")

    validated = []

    for item in vulnerabilities:
        if not isinstance(item, dict):
            continue

        cve_id = item.get("cveID", "")
        if not isinstance(cve_id, str) or not cve_id.startswith("CVE-"):
            continue

        validated.append(item)

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    output = {
        "source": CISA_URL,
        "catalog_version": catalog.get("catalogVersion"),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "count": len(validated),
        "vulnerabilities": validated,
    }

    OUTPUT_FILE.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("\nCollection successful!")
    print(f"Catalog version: {output['catalog_version']}")
    print(f"Records saved: {len(validated)}")
    print(f"Output file: {OUTPUT_FILE}")


if __name__ == "__main__":
    try:
        fetch_vulnerabilities()
    except (requests.RequestException, ValueError, OSError) as error:
        print(f"\nCollection failed: {error}")
        raise SystemExit(1)
