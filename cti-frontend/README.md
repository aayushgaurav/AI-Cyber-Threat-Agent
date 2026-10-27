# AI Cyber Threat Intelligence Agent: Frontend

React + Vite frontend for the existing FastAPI backend (CISA KEV catalog, SQLite, Groq-powered answers).
This project is frontend only. It never touches the database or the Groq API, and it contains no secrets.

## Run it

```bash
npm install
cp .env.example .env     # optional; the fallback is already http://127.0.0.1:8000
npm run dev              # http://localhost:5173
npm run build            # production build in dist/
```

Start the backend separately (for example `uvicorn main:app --reload --port 8000`).

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the FastAPI backend | `http://127.0.0.1:8000` |

Vite inlines `VITE_*` variables into the browser bundle, so never put secrets in them.

## CORS: required FastAPI change

The browser blocks calls from `http://localhost:5173` to port 8000 unless the backend allows that origin.
If you see "Cannot reach the backend" while `/health` works in the browser address bar, add this to your FastAPI app
(this README does not change your backend; apply it yourself):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)
```

Add your production frontend origin to `allow_origins` when you deploy. Avoid `"*"` outside local development.

## Structure

```
src/
  lib/api.js          all backend requests (fetch), base URL, error handling
  lib/utils.js        response normalisation, field lookup, hooks
  lib/routes.js       navigation entries
  components/         Header, StatusIndicator, VulnerabilityTable, Feedback, Icons, Footer
  pages/              Dashboard, ThreatAnalyst, VulnerabilityExplorer
  styles.css          plain CSS, palette defined as CSS variables
```

## Notes on backend response shapes

- `/vulnerabilities` may return a plain array or an object wrapping one (`items`, `results`, `vulnerabilities`, `data`).
  If the object includes `total`/`count`, the explorer shows "Showing X–Y of N"; otherwise pagination relies on whether a
  full page came back.
- Field names are matched flexibly (for example `cve_id`/`cveID`, `vendor`/`vendor_project`, `required_action`/`requiredAction`).
  Anything missing is displayed as "Not provided" rather than guessed.
- The Dashboard's record table shows the first records the backend returns, in API order. It is not labelled "latest" or
  sorted client-side, because the frontend cannot know the backend's ordering.
- Navigation uses hash routes (`#/analyst`), so no server-side routing configuration is needed.
