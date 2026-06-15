import { useState } from 'react';

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('');
  const [localErr, setLocalErr] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const ccn = value.trim();
    if (!ccn) { setLocalErr('Please enter a CCN.'); return; }
    if (!/^[A-Za-z0-9]{5,6}$/.test(ccn)) {
      setLocalErr('CCN must be 5–6 alphanumeric characters.');
      return;
    }
    setLocalErr('');
    onSearch(ccn);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
        CMS Certification Number (CCN)
      </label>
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="e.g. 686123"
          maxLength={6}
          className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/40 text-base font-mono tracking-wider"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-pink px-6 py-3 font-bold text-white shadow-lg hover:bg-pink-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Looking up…
            </>
          ) : 'Look Up'}
        </button>
      </div>
      {localErr && <p className="text-red-400 text-sm mt-1">{localErr}</p>}
    </form>
  );
}
