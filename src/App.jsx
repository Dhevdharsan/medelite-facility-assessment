import { useState } from 'react';
import SearchBar from './components/SearchBar.jsx';
import ManualInputsForm from './components/ManualInputsForm.jsx';
import ReportPreview from './components/ReportPreview.jsx';
import ExportButtons from './components/ExportButtons.jsx';

const EMPTY_INPUTS = {
  nameOverride: '',
  emr: '',
  currentCensus: '',
  patientType: '',
  previousCoverage: '',
  previousProviderPerformance: '',
  medicalCoverage: '',
};

export default function App() {
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [apiData,      setApiData]      = useState(null);
  const [activeCcn,    setActiveCcn]    = useState('');
  const [manualInputs, setManualInputs] = useState(EMPTY_INPUTS);

  async function handleSearch(ccn) {
    setLoading(true);
    setError('');
    setApiData(null);

    try {
      const res = await fetch(`/api/facility?ccn=${encodeURIComponent(ccn)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Error ${res.status} — please try again.`);
        return;
      }

      setApiData(data);
      setActiveCcn(ccn.padStart(6, '0'));
      // Pre-fill Current Census from CMS average, but keep it editable
      setManualInputs(prev => ({
        ...EMPTY_INPUTS,
        currentCensus: data.facility.avgResidentsPerDay || '',
      }));
    } catch (e) {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Navigation ── */}
      <nav className="bg-brand-navy shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-pink flex items-center justify-center">
              <span className="text-white font-black text-sm">∞</span>
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tight">INFINITE</span>
              <span className="text-slate-400 text-xs block leading-none">Managed by MEDELITE.</span>
            </div>
          </div>
          <span className="text-slate-400 text-sm hidden sm:block font-medium">
            Facility Assessment Tool
          </span>
        </div>
      </nav>

      {/* ── Hero / Search ── */}
      <div className="bg-gradient-to-br from-brand-navy via-brand-purple to-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
              Facility Assessment
              <span className="block text-brand-pink">Snapshot Generator</span>
            </h1>
            <p className="text-slate-300 mb-8 text-sm leading-relaxed">
              Enter any CMS Certification Number to pull live facility data, complete the
              operational fields, then download a branded PDF report in seconds.
            </p>
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <SearchBar onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Error State ── */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="text-red-700 font-semibold text-sm">Lookup Failed</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3"/>
            <div className="h-64 bg-slate-200 rounded-2xl"/>
          </div>
        )}

        {/* ── Main Content ── */}
        {apiData && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Left: Manual Inputs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-brand-purple text-white text-xs flex items-center justify-center font-bold">1</span>
                  Operational Details
                </h2>
                <ManualInputsForm inputs={manualInputs} onChange={setManualInputs} />
              </div>

              {/* Export Buttons — sticky on desktop */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-brand-magenta text-white text-xs flex items-center justify-center font-bold">2</span>
                  Export Report
                </h2>
                <ExportButtons ccn={activeCcn} apiData={apiData} manualInputs={manualInputs} />
                <p className="text-xs text-slate-400 mt-3">
                  PDF contains a clickable Medicare Care Compare link.
                </p>
              </div>
            </div>

            {/* Right: Report Preview */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-200 text-slate-500 text-xs flex items-center justify-center font-bold">3</span>
                  Report Preview
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-mono">
                  CCN: {activeCcn}
                </span>
              </div>
              <ReportPreview ccn={activeCcn} apiData={apiData} manualInputs={manualInputs} />
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!apiData && !loading && !error && (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-brand-purple font-black">∞</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Ready to generate a report</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Enter a 5–6 digit CMS Certification Number above to pull live facility data
              from the CMS Provider Data Catalog.
            </p>
            <div className="mt-6 inline-flex gap-2 bg-slate-100 rounded-full px-4 py-2 text-xs text-slate-500">
              <span>Try CCN:</span>
              <button
                className="font-mono font-bold text-brand-purple hover:underline"
                onClick={() => handleSearch('686123')}
              >
                686123
              </button>
              <span>(Kendall Lakes, FL)</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-brand-navy mt-16 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-brand-pink font-black">∞ INFINITE</span>
            <span className="text-slate-500 text-sm">— Managed by MEDELITE.</span>
          </div>
          <p className="text-slate-500 text-xs">
            Data sourced from CMS Provider Data Catalog. Not for clinical use.
          </p>
        </div>
      </footer>
    </div>
  );
}
