# Medelite Facility Assessment Snapshot Generator

**Live Demo:** _[Add Vercel URL after deploy]_

> Enter any CMS Certification Number → pulls live facility data → fill operational fields → download a branded, print-ready PDF with a clickable Medicare Care Compare link.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| API proxy | Vercel Serverless Function (Node 20) |
| PDF export | `@react-pdf/renderer` (vector — clickable links) |
| Word export | `docx` library |
| Charts | Recharts |
| Data source | CMS Provider Data Catalog (no API key required) |

---

## Quick Start (Local)

```bash
# Clone and install
npm install

# Terminal 1 — API proxy (proxies CMS calls, fixes CORS)
npm run dev:api

# Terminal 2 — Frontend
npm run dev
```

Open `http://localhost:5173`. The Vite server proxies `/api/*` to the local dev API on port 3001.

**Test CCN:** `686123` → Kendall Lakes Healthcare and Rehab Center, Miami FL

---

## Architecture

```
Browser (React + Vite + Tailwind)
   │  user types CCN + manual inputs
   ▼
/api/facility?ccn=…   ──►  Vercel Serverless Function (Node)
   │                          ├─ Provider Info  (dataset 4pq5-n9py)
   │                          ├─ State Averages (dataset xcdc-v8bm)
   │                          └─ Claims Metrics (dataset ijh5-nb2v)
   │                          returns clean normalized JSON
   ◄──────────────────────────────
   │
   ├─ ReportPreview  (on-screen, matches template)
   ├─ Download PDF   → @react-pdf/renderer → vector PDF (clickable link)
   └─ Download Word  → docx library → editable .docx
```

**Why a serverless proxy?**
The CMS Provider Data Catalog API does not guarantee permissive CORS headers for browser requests. Routing through a serverless function makes the live demo deterministic regardless of CMS CORS policy — and gives a single place to normalize the government field names. This is the CORS decision the spec names explicitly.

---

## CMS API Endpoints

| Dataset | ID | Used for |
|---|---|---|
| Provider Information | `4pq5-n9py` | Name, address, beds, avg census, all 4 star ratings |
| State/US Averages | `xcdc-v8bm` | State & national averages for the 4 claims metrics |
| Medicare Claims Quality Measures | `ijh5-nb2v` | Facility-level short/long-stay hospitalization & ED rates |

**API operator:** `=` (not `==`) — the PDC query API uses single-equals.

**Actual field names** (truncated by the database, confirmed from live responses):
- Short-stay rehospitalization avg: `percentage_of_short_stay_residents_who_were_rehospitalized__1d02`
- Short-stay ED avg: `percentage_of_short_stay_residents_who_had_an_outpatient_em_d911`
- LT hospitalization avg: `number_of_hospitalizations_per_1000_longstay_resident_days`
- LT ED avg: `number_of_outpatient_emergency_department_visits_per_1000_l_de9d`
- City field: `citytown` (not `city_town`)

---

## Assumptions (Documented)

### 1 — Current Census conflict (deliberate resolution)
The case study's data-mapping table says _Current Census = Manual Input_. The Snapshot template shows _Current Census = {Average Number of Residents per Day}_ (a CMS field). These two reference documents disagree.

**Resolution:** Current Census is a **manual field** (explicit mapping table wins) that is **pre-filled with the CMS `average_number_of_residents_per_day` value as an editable default**. This honours both documents and avoids either losing the CMS data or overriding the user's intent.

### 2 — INFINITE branding guardrail
`INFINITE — Managed by MEDELITE` is a **static string** stored in `src/constants/branding.js`. It is never interpolated with facility data. The facility name lives only in the report body under "Name of Facility."

### 3 — Star ratings displayed as `N / 5`
CMS returns integers 1–5 or null. Ratings render as `N / 5` with colour coding (green 4–5, yellow 3, orange 2, red 1). Null renders as `Not Available`.

### 4 — Medicare Care Compare URL format
```
https://www.medicare.gov/care-compare/details/nursing-home/{CCN}/view-all?state={STATE}
```
State abbreviation is **derived from the CMS API payload**, not typed by the user.

### 5 — CCN as string
CCN is treated as a string throughout. Never parsed to integer — preserves leading zeros and alphanumeric CCNs.

### 6 — PDF generation (client-side)
PDF is generated in the browser via `@react-pdf/renderer` (vector, not rasterized). The Care Compare link is a real `<Link>` annotation — clickable in any PDF reader. The library is **lazy-loaded** on the first Download click to keep the initial bundle lean.

### 7 — Claims metrics: adjusted vs observed score
The Claims dataset provides both `adjusted_score` (risk-adjusted) and `observed_score`. The report uses `adjusted_score` with fallback to `observed_score`, which is the clinically meaningful value for comparison.

---

## Report Fields & Data Sources

| Report Field | Source |
|---|---|
| Name of Facility | CMS `provider_name` (overridable) |
| Location | CMS `provider_address`, `citytown`, `state`, `zip_code` |
| EMR | Manual input |
| Census Capacity | CMS `number_of_certified_beds` |
| Current Census | Manual (pre-filled from CMS `average_number_of_residents_per_day`) |
| Type of Patient | Manual input |
| Previous Coverage from Medelite | Manual dropdown (Yes/No) |
| Previous Provider Performance | Manual number (patients/day) |
| Medical Coverage | Manual input |
| Overall Star Rating | CMS `overall_rating` |
| Health Inspection | CMS `health_inspection_rating` |
| Staffing | CMS `staffing_rating` |
| Quality of Resident Care | CMS `qm_rating` |
| Short Term Hospitalization | CMS Claims dataset (facility) |
| STR National/State Avg Hospitalization | CMS State/US Averages dataset |
| STR ED Visit & Averages | CMS Claims + Averages datasets |
| LT Hospitalization & Averages | CMS Claims + Averages datasets |
| LT ED Visit & Averages | CMS Claims + Averages datasets |

---

## Bonus Features

- **All 12 claims metrics** (4 measures × facility/state/national)
- **Recharts comparison cards** with red flagging when facility value exceeds national average
- **.docx Word export** (editable, same layout)
- **Graceful degradation** — any missing CMS field shows `Not Available`, never `null`/`undefined`
- **Dynamic state abbreviation** derived from CMS payload, never typed by user

---

## Deployment (Vercel)

```bash
npx vercel --prod
```

The `api/facility.js` serverless function is automatically picked up by Vercel. No environment variables required (CMS PDC is public, no API key).

**After deploying:** update the live URL at the top of this README and re-test in an incognito window.

---

## Test Matrix

| Test | Expected |
|---|---|
| CCN `686123` | Kendall Lakes, FL, 5/5 Overall, all metrics |
| Different valid CCN | Dynamic — different facility data |
| Invalid CCN format (`AB!@`) | Client-side validation error |
| Not-found CCN (`123456`) | "No facility found" error message |
| Null-rating facility | Shows "Not Available", no crash |
| Download PDF | Instant download, clickable Medicare link |
| Download Word | Instant `.docx` download |
| Name override | Report shows override name, not CMS legal name |

---

## Scalability Notes

- CMS has no rate limit, but the proxy can add response caching (e.g., `Cache-Control: max-age=3600`) to cut latency for repeated lookups.
- Field normalization is centralized in `api/facility.js` — a CMS schema change is a one-file fix.
- The report layout is data-driven (array of fields) — adding/removing rows is config, not surgery.
- For very large PDFs or low-end devices, generation can be moved server-side (Puppeteer/pdfmake) and streamed down. At one page, client-side generation is milliseconds.
