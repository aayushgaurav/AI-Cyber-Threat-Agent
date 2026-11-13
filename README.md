# AI Cyber Threat Intelligence Agent

An AI-powered Cyber Threat Intelligence (CTI) application that retrieves, analyzes, and explains known exploited vulnerabilities using custom BM25 retrieval and Large Language Models (LLMs).

The system integrates the **CISA Known Exploited Vulnerabilities (KEV) Catalog** with a Groq-hosted LLM to provide context-grounded answers to cybersecurity questions.

## Overview

The AI Cyber Threat Intelligence Agent helps users explore known exploited vulnerabilities through keyword-based search and natural-language questions.

It combines automated vulnerability collection, structured data storage, custom information retrieval, and LLM-powered analysis in a full-stack application.

## Key Features

- **CISA KEV Data Collection:** Fetches vulnerability records from the official CISA KEV JSON catalog and validates CVE entries.
- **SQLite Database:** Stores structured vulnerability information, including CVE IDs, vendors, products, descriptions, remediation actions, and ransomware status.
- **Custom BM25 Retrieval:** Implements tokenization, stop-word removal, inverse document frequency, term-frequency saturation, and document-length normalization.
- **Vendor-Aware Search:** Filters vulnerability records by explicitly mentioned vendors before relevance ranking.
- **LLM-Powered Analysis:** Uses Groq-hosted LLMs to generate answers based on the top five retrieved vulnerability records.
- **Evidence-Grounded Responses:** Restricts model responses to supplied records and checks generated CVE IDs against retrieved evidence.
- **REST API:** Provides endpoints for vulnerability search, CVE details, statistics, and AI-powered questions.
- **Interactive Frontend:** React and Vite interface for exploring vulnerabilities and interacting with the AI assistant.

## Technology Stack

| Category | Technologies |
|---|---|
| Backend | Python, FastAPI |
| AI / LLM | Groq API |
| Retrieval | Custom BM25, NLP preprocessing |
| Database | SQLite |
| Data Source | CISA KEV Catalog |
| Frontend | React, Vite, JavaScript |
| API | REST API, JSON |
| Deployment | Render |

## System Architecture

1. **Data Collection:** Fetches vulnerability records from the official CISA KEV catalog.
2. **Data Processing:** Validates CVE identifiers and maps vulnerability metadata into structured records.
3. **Database Storage:** Stores and updates vulnerability information in SQLite.
4. **Information Retrieval:** Processes user queries and ranks relevant records using custom BM25 scoring and vendor-aware filtering.
5. **LLM Integration:** Sends the top five retrieved records to Groq with evidence-constrained instructions.
6. **Response Validation:** Checks generated CVE references against the retrieved records.
7. **API and Frontend:** Delivers results through FastAPI endpoints and a React-based interface.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Checks API health |
| GET | `/stats` | Returns vulnerability database statistics |
| GET | `/vulnerabilities` | Searches vulnerability records |
| GET | `/vulnerabilities/{cve_id}` | Retrieves details for a specific CVE |
| POST | `/ask` | Generates AI-powered threat intelligence answers |

### Example AI Query

**Endpoint:** `POST /ask`

Request:

```json
{
  "question": "Which Microsoft vulnerabilities are associated with ransomware?"
}
```

The API returns an AI-generated answer along with supporting vulnerability evidence.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aayushgaurav/AI-Cyber-Threat-Agent.git

cd AI-Cyber-Threat-Agent
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

Activate it:

**Windows**
```bash
venv\Scripts\activate
```

**Linux / macOS**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

### 5. Collect Vulnerability Data

```bash
python -m app.collector
```

This fetches and saves the CISA KEV vulnerability catalog.

### 6. Initialize the Database

```bash
python -m app.database
```

This creates the SQLite database and imports the collected vulnerability records.

### 7. Start the Backend

```bash
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 8. Start the Frontend

Open another terminal:

```bash
cd cti-frontend
npm install
npm run dev
```

The Vite development server will provide the frontend URL in the terminal.

## Testing

The repository includes test scripts for checking retrieval, Groq API configuration, and AI answer generation.

```bash
python test_rag.py
python test_groq.py
python test_answer.py
```

## Deployment

The backend is configured for deployment on Render using `render.yaml`.

Deployment configuration includes:

- Python runtime and dependency installation.
- Uvicorn application server.
- Health check endpoint.
- Persistent disk for SQLite database storage.
- Environment-based database configuration.

The frontend can be deployed separately using a static hosting provider, with the backend URL configured for API communication.

## Data Source

Vulnerability information is collected from the official CISA Known Exploited Vulnerabilities catalog:

https://www.cisa.gov/known-exploited-vulnerabilities-catalog

## Limitations

- The assistant is designed for defensive vulnerability intelligence, not general cybersecurity questions.
- Responses are limited to information available in retrieved CISA KEV records.
- BM25 uses lexical relevance rather than semantic vector similarity.
- AI-generated responses depend on the availability of the Groq API.

## Author

**Aayush Gaurav**

B.Tech, Computer Science Engineering (Cyber Security)

GitHub: https://github.com/aayushgaurav

LinkedIn: https://www.linkedin.com/in/aayush-gaurav/
