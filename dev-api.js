// Simple local dev server that wraps the Vercel API function
// Usage: node dev-api.js (runs on port 3001)
import http from 'http';
import { URL } from 'url';

const CMS_BASE = 'https://data.cms.gov/provider-data/api/1/datastore/query';
const DS_PROVIDER = '4pq5-n9py';
const DS_AVERAGES = 'xcdc-v8bm';
const DS_CLAIMS   = 'ijh5-nb2v';

function cmsQuery(datasetId, conditions, limit = 500) {
  const params = new URLSearchParams({ limit: String(limit) });
  conditions.forEach((c, i) => {
    params.append(`conditions[${i}][property]`, c.property);
    params.append(`conditions[${i}][value]`,    c.value);
    params.append(`conditions[${i}][operator]`, c.operator || '=');
  });
  return `${CMS_BASE}/${datasetId}/0?${params.toString()}`;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CMS ${res.status}`);
  return res.json();
}

function safe(v)    { return (v ?? '') === '' ? null : String(v).trim() || null; }
function safeNum(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

function normaliseRating(v) {
  const n = safeNum(v);
  return n === null ? null : `${n} / 5`;
}

function normaliseProvider(r) {
  return {
    facilityName:       safe(r.provider_name),
    address:            safe(r.provider_address),
    city:               safe(r.citytown),
    state:              safe(r.state),
    zipCode:            safe(r.zip_code),
    certifiedBeds:      safe(r.number_of_certified_beds),
    avgResidentsPerDay: safe(r.average_number_of_residents_per_day),
    overallRating:      normaliseRating(r.overall_rating),
    healthInspection:   normaliseRating(r.health_inspection_rating),
    staffing:           normaliseRating(r.staffing_rating),
    qualityOfCare:      normaliseRating(r.qm_rating),
  };
}

function extractAverages(rows) {
  if (!rows?.length) return null;
  const r = rows[0];
  return {
    shortTermHosp: safeNum(r['percentage_of_short_stay_residents_who_were_rehospitalized__1d02']),
    shortTermEd:   safeNum(r['percentage_of_short_stay_residents_who_had_an_outpatient_em_d911']),
    ltHosp:        safeNum(r['number_of_hospitalizations_per_1000_longstay_resident_days']),
    ltEd:          safeNum(r['number_of_outpatient_emergency_department_visits_per_1000_l_de9d']),
  };
}

const PATTERNS = {
  shortTermHosp: /rehospitalized.*nursing home/i,
  shortTermEd:   /short.stay.*outpatient.*emergency/i,
  ltHosp:        /hospitalizations per 1.?000 long.stay/i,
  ltEd:          /outpatient.*emergency department visits per 1.?000 long.stay/i,
};

function extractClaims(rows) {
  if (!rows?.length) return null;
  const out = {};
  for (const row of rows) {
    const desc = (row.measure_description || '').trim();
    for (const [key, pat] of Object.entries(PATTERNS)) {
      if (pat.test(desc)) out[key] = safeNum(row.adjusted_score ?? row.observed_score);
    }
  }
  return Object.keys(out).length ? out : null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url, `http://localhost:3001`);
  if (!url.pathname.startsWith('/api/facility')) {
    res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); return;
  }

  const ccn = (url.searchParams.get('ccn') || '').trim().padStart(6, '0');
  if (!ccn) { res.writeHead(400); res.end(JSON.stringify({ error: 'CCN is required' })); return; }

  try {
    const providerUrl = cmsQuery(DS_PROVIDER, [{ property: 'cms_certification_number_ccn', value: ccn }], 1);
    const providerData = await fetchJSON(providerUrl);
    if (!providerData.results?.length) {
      res.writeHead(404); res.end(JSON.stringify({ error: `No facility found for CCN ${ccn}` })); return;
    }

    const providerRow = providerData.results[0];
    const facility = normaliseProvider(providerRow);
    const state = facility.state;

    const [stateRes, nationalRes, claimsRes] = await Promise.allSettled([
      fetchJSON(cmsQuery(DS_AVERAGES, [{ property: 'state_or_nation', value: state }], 1)),
      fetchJSON(cmsQuery(DS_AVERAGES, [{ property: 'state_or_nation', value: 'NATION' }], 1)),
      fetchJSON(cmsQuery(DS_CLAIMS,   [{ property: 'cms_certification_number_ccn', value: ccn }], 50)),
    ]);

    const result = {
      facility,
      stateAverages:    stateRes.status    === 'fulfilled' ? extractAverages(stateRes.value.results)    : null,
      nationalAverages: nationalRes.status === 'fulfilled' ? extractAverages(nationalRes.value.results) : null,
      claimsMetrics:    claimsRes.status   === 'fulfilled' ? extractClaims(claimsRes.value.results)     : null,
    };

    res.writeHead(200);
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(502);
    res.end(JSON.stringify({ error: `API error: ${err.message}` }));
  }
});

server.listen(3001, () => console.log('Dev API running on http://localhost:3001'));
