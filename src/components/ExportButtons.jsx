import { useState } from 'react';
import { saveAs } from 'file-saver';

export default function ExportButtons({ ccn, apiData, manualInputs }) {
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePDF() {
    setPdfLoading(true);
    setError('');
    try {
      const { generatePDF } = await import('../lib/pdf.jsx');
      const blob = await generatePDF(ccn, apiData, manualInputs);
      const name = (manualInputs.nameOverride || apiData.facility.facilityName || ccn)
        .replace(/[^a-z0-9]/gi, '-').toLowerCase();
      saveAs(blob, `facility-assessment-${name}.pdf`);
    } catch (e) {
      setError('PDF generation failed. Please try again.');
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleDocx() {
    setDocxLoading(true);
    setError('');
    try {
      const { generateDocx } = await import('../lib/docxExport.js');
      await generateDocx(ccn, apiData, manualInputs);
    } catch (e) {
      setError('Word export failed. Please try again.');
      console.error(e);
    } finally {
      setDocxLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          className="flex items-center gap-2 rounded-xl bg-brand-purple text-white font-bold px-6 py-3 shadow-lg hover:bg-purple-800 active:scale-95 transition-all disabled:opacity-50"
        >
          {pdfLoading ? (
            <Spinner />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          )}
          Download PDF
        </button>

        <button
          onClick={handleDocx}
          disabled={docxLoading}
          className="flex items-center gap-2 rounded-xl bg-slate-700 text-white font-bold px-6 py-3 shadow-lg hover:bg-slate-600 active:scale-95 transition-all disabled:opacity-50"
        >
          {docxLoading ? <Spinner /> : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          )}
          Download Word
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}
