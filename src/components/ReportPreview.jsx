import { BANNER_LINE1, BANNER_LINE2, CARE_COMPARE } from '../constants/branding.js';
import { safe, formatAddress } from '../lib/fieldMapper.js';
import StarDisplay from './StarDisplay.jsx';
import MetricCard from './MetricCard.jsx';

function Row({ label, value, highlight }) {
  return (
    <tr className={highlight ? 'bg-yellow-50' : ''}>
      <td className={`py-2 px-4 text-sm font-semibold border border-slate-200 w-1/2 ${highlight ? 'text-yellow-800' : 'text-slate-700'}`}>
        {label}
      </td>
      <td className={`py-2 px-4 text-sm border border-slate-200 ${highlight ? 'text-yellow-900 font-medium' : 'text-slate-600'}`}>
        {value || 'Not Available'}
      </td>
    </tr>
  );
}

export default function ReportPreview({ ccn, apiData, manualInputs }) {
  const { facility, stateAverages, nationalAverages, claimsMetrics } = apiData;

  const displayName = manualInputs.nameOverride || safe(facility.facilityName);
  const careCompareUrl = CARE_COMPARE(ccn, facility.state);

  const hasClaims = claimsMetrics && (nationalAverages || stateAverages);

  return (
    <div id="report-preview" className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

      {/* ── INFINITE Header Banner ── */}
      <div className="bg-brand-navy text-white text-center py-6 px-4">
        <div className="flex items-center justify-center gap-3 mb-1">
          <InfiniteLogoSVG />
        </div>
        <p className="text-xs text-slate-400 mt-1 tracking-widest uppercase">
          Managed by MEDELITE
        </p>
      </div>

      <div className="bg-slate-50 border-b border-slate-200 text-center py-3 px-4">
        <h2 className="text-base font-bold text-slate-800 tracking-wider uppercase">{BANNER_LINE2}</h2>
        <p className="text-2xl font-black text-brand-purple mt-0.5">{safe(facility.state)}</p>
      </div>

      {/* ── Main Table ── */}
      <div className="p-6">
        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            <Row label="Name of Facility" value={displayName} />
            <Row label="Location" value={formatAddress(facility)} />
            <Row label="EMR" value={manualInputs.emr} />
            <Row label="Census Capacity" value={safe(facility.certifiedBeds)} />
            <Row label="Current Census" value={manualInputs.currentCensus || safe(facility.avgResidentsPerDay)} />
            <Row label="Type of Patient" value={manualInputs.patientType} />
            <Row label="Previous Coverage from Medelite" value={manualInputs.previousCoverage} />
            <Row
              label="Previous Provider Performance from Medelite"
              value={manualInputs.previousProviderPerformance
                ? `${manualInputs.previousProviderPerformance} Patients per day`
                : ''}
            />
            <Row label="Medical Coverage" value={manualInputs.medicalCoverage} />
          </tbody>
        </table>

        {/* ── Star Ratings ── */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">CMS Star Ratings</h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {[
              ['Overall Star Rating',       facility.overallRating],
              ['Health Inspection',         facility.healthInspection],
              ['Staffing',                  facility.staffing],
              ['Quality of Resident Care',  facility.qualityOfCare],
            ].map(([label, val]) => (
              <div key={label} className="px-4">
                <StarDisplay label={label} value={val} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Claims Metrics (Bonus) ── */}
        {hasClaims && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Claims Quality Metrics
            </h3>

            {/* Table version matching the template */}
            <table className="w-full border-collapse text-sm mb-4">
              <tbody>
                <Row label="Short Term Hospitalization"            value={fmt(claimsMetrics.shortTermHosp, false)} highlight />
                <Row label="STR National Avg. for Hospitalization" value={fmt(nationalAverages?.shortTermHosp, false)} highlight />
                <Row label="STR State Avg. for Hospitalization"    value={fmt(stateAverages?.shortTermHosp, false)}    highlight />
                <Row label="STR ED Visit"                          value={fmt(claimsMetrics.shortTermEd, false)}     highlight />
                <Row label="STR ED Visits National Avg."           value={fmt(nationalAverages?.shortTermEd, false)}  highlight />
                <Row label="STR ED Visits State Avg."              value={fmt(stateAverages?.shortTermEd, false)}    highlight />
                <Row label="LT Hospitalization"                    value={fmt(claimsMetrics.ltHosp, true)}          highlight />
                <Row label="LT National Avg. for Hospitalization"  value={fmt(nationalAverages?.ltHosp, true)}       highlight />
                <Row label="LT State Avg. for Hospitalization"     value={fmt(stateAverages?.ltHosp, true)}         highlight />
                <Row label="ED Visit"                              value={fmt(claimsMetrics.ltEd, true)}            highlight />
                <Row label="LT ED Visits National Avg."            value={fmt(nationalAverages?.ltEd, true)}         highlight />
                <Row label="LT ED Visits State Avg."               value={fmt(stateAverages?.ltEd, true)}           highlight />
              </tbody>
            </table>

            {/* Comparison Cards */}
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 mt-6">
              Metric Comparisons
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCard
                title="Short-Stay Rehospitalization (%)"
                facility={claimsMetrics.shortTermHosp}
                national={nationalAverages?.shortTermHosp}
                state={stateAverages?.shortTermHosp}
              />
              <MetricCard
                title="Short-Stay ED Visit (%)"
                facility={claimsMetrics.shortTermEd}
                national={nationalAverages?.shortTermEd}
                state={stateAverages?.shortTermEd}
              />
              <MetricCard
                title="LT Hospitalization (per 1,000 days)"
                facility={claimsMetrics.ltHosp}
                national={nationalAverages?.ltHosp}
                state={stateAverages?.ltHosp}
                isRate
              />
              <MetricCard
                title="LT ED Visit (per 1,000 days)"
                facility={claimsMetrics.ltEd}
                national={nationalAverages?.ltEd}
                state={stateAverages?.ltEd}
                isRate
              />
            </div>
          </div>
        )}

        {/* ── Medicare Link ── */}
        <div className="mt-6 rounded-xl bg-brand-light border border-purple-200 px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-brand-purple uppercase tracking-wide">Medicare Care Compare</p>
            <p className="text-xs text-slate-500 mt-0.5 break-all">{careCompareUrl}</p>
          </div>
          <a
            href={careCompareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-brand-purple text-white text-xs font-bold px-4 py-2 hover:bg-purple-800 transition-colors"
          >
            View Profile →
          </a>
        </div>
      </div>
    </div>
  );
}

function fmt(v, isRate) {
  if (v === null || v === undefined) return 'Not Available';
  return isRate ? parseFloat(v).toFixed(2) : `${parseFloat(v).toFixed(1)}%`;
}

function InfiniteLogoSVG() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <svg width="36" height="24" viewBox="0 0 48 32" fill="none">
          <path
            d="M24 16C20 8 10 2 6 8C2 14 8 22 16 20C20 19 22 17 24 16C26 15 28 13 32 12C40 10 46 18 42 24C38 30 28 26 24 16Z"
            fill="#E91E8C"
          />
          <circle cx="8" cy="14" r="4" fill="#E91E8C" opacity="0.6"/>
          <circle cx="40" cy="18" r="4" fill="#E91E8C" opacity="0.6"/>
        </svg>
        <span className="text-2xl font-black tracking-tight text-white">INFINITE</span>
      </div>
      <span className="text-xs text-slate-400 tracking-[0.3em] uppercase">Managed by MEDELITE.</span>
    </div>
  );
}
