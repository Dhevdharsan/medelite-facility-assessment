const CMS_BASE = 'https://data.cms.gov/provider-data/api/1/datastore/query';
const DS_PROVIDER  = '4pq5-n9py';
const DS_AVERAGES  = 'xcdc-v8bm';
const DS_CLAIMS    = 'ijh5-nb2v';

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
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`CMS API ${res.status} for ${url}`);
  return res.json();
}

function safe(val) {
  if (val === null || val === undefined || val === '') return null;
  return String(val).trim() || null;
}

function safeNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function normaliseRating(val) {
  const n = safeNum(val);
  if (n === null) return null;
  return `${n} / 5`;
}

function normaliseProvider(row) {
  return {
    facilityName:        safe(row.provider_name),
    address:             safe(row.provider_address),
    city:                safe(row.citytown),
    state:               safe(row.state),
    zipCode:             safe(row.zip_code),
    certifiedBeds:       safe(row.number_of_certified_beds),
    avgResidentsPerDay:  safe(row.average_number_of_residents_per_day),
    overallRating:       normaliseRating(row.overall_rating),
    healthInspection:    normaliseRating(row.health_inspection_rating),
    staffing:            normaliseRating(row.staffing_rating),
    qualityOfCare:       normaliseRating(row.qm_rating),
  };
}

function extractAverages(rows) {
  if (!rows || !rows.length) return null;
  const row = rows[0];
  return {
    shortTermHosp: safeNum(row['percentage_of_short_stay_residents_who_were_rehospitalized__1d02']),
    shortTermEd:   safeNum(row['percentage_of_short_stay_residents_who_had_an_outpatient_em_d911']),
    ltHosp:        safeNum(row['number_of_hospitalizations_per_1000_longstay_resident_days']),
    ltEd:          safeNum(row['number_of_outpatient_emergency_department_visits_per_1000_l_de9d']),
  };
}

const CLAIM_PATTERNS = {
  shortTermHosp: /rehospitalized.*nursing home/i,
  shortTermEd:   /short.stay.*outpatient.*emergency/i,
  ltHosp:        /hospitalizations per 1.?000 long.stay/i,
  ltEd:          /outpatient.*emergency department visits per 1.?000 long.stay/i,
};

function extractClaims(rows) {
  if (!rows || !rows.length) return null;
  const out = {};
  for (const row of rows) {
    const desc = (row.measure_description || '').trim();
    for (const [key, pattern] of Object.entries(CLAIM_PATTERNS)) {
      if (pattern.test(desc)) {
        out[key] = safeNum(row.adjusted_score ?? row.observed_score);
      }
    }
  }
  return Object.keys(out).length ? out : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ccn = (req.query.ccn || '').trim().padStart(6, '0');
  if (!ccn) return res.status(400).json({ error: 'CCN is required' });

  // 1 — Provider Information (required)
  let providerRow;
  try {
    const url = cmsQuery(DS_PROVIDER, [
      { property: 'cms_certification_number_ccn', value: ccn }
    ], 1);
    const data = await fetchJSON(url);
    if (!data.results || !data.results.length) {
      return res.status(404).json({ error: `No facility found for CCN ${ccn}` });
    }
    providerRow = data.results[0];
  } catch (err) {
    return res.status(502).json({ error: `CMS API error: ${err.message}` });
  }

  const facility = normaliseProvider(providerRow);
  const state    = facility.state;

  // 2 — State averages, national averages, claims — parallel, best-effort
  const [stateRes, nationalRes, claimsRes] = await Promise.allSettled([
    fetchJSON(cmsQuery(DS_AVERAGES, [{ property: 'state_or_nation', value: state }], 1)),
    fetchJSON(cmsQuery(DS_AVERAGES, [{ property: 'state_or_nation', value: 'NATION' }], 1)),
    fetchJSON(cmsQuery(DS_CLAIMS,   [{ property: 'cms_certification_number_ccn', value: ccn }], 50)),
  ]);

  const stateAverages    = stateRes.status    === 'fulfilled' ? extractAverages(stateRes.value.results)    : null;
  const nationalAverages = nationalRes.status === 'fulfilled' ? extractAverages(nationalRes.value.results) : null;
  const claimsMetrics    = claimsRes.status   === 'fulfilled' ? extractClaims(claimsRes.value.results)     : null;

  return res.status(200).json({ facility, stateAverages, nationalAverages, claimsMetrics });
}
