const INPUT = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/30 text-sm';
const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

export default function ManualInputsForm({ inputs, onChange }) {
  const set = (field) => (e) => onChange({ ...inputs, [field]: e.target.value });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={LABEL}>Facility Name Override</label>
        <input
          className={INPUT}
          placeholder="Leave blank to use CMS name"
          value={inputs.nameOverride}
          onChange={set('nameOverride')}
        />
        <p className="text-xs text-slate-400 mt-1">Overrides CMS legal name on the report</p>
      </div>

      <div>
        <label className={LABEL}>EMR</label>
        <input className={INPUT} placeholder="e.g. PointClickCare" value={inputs.emr} onChange={set('emr')} />
      </div>

      <div>
        <label className={LABEL}>Current Census</label>
        <input
          className={INPUT}
          type="number"
          min="0"
          placeholder="Auto-filled from CMS avg"
          value={inputs.currentCensus}
          onChange={set('currentCensus')}
        />
        <p className="text-xs text-slate-400 mt-1">Pre-filled from CMS avg residents/day — editable</p>
      </div>

      <div>
        <label className={LABEL}>Type of Patient</label>
        <input className={INPUT} placeholder="e.g. Short-Term Rehab, Long-Term" value={inputs.patientType} onChange={set('patientType')} />
      </div>

      <div>
        <label className={LABEL}>Previous Coverage from Medelite</label>
        <select className={INPUT} value={inputs.previousCoverage} onChange={set('previousCoverage')}>
          <option value="">Select…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <div>
        <label className={LABEL}>Previous Provider Performance (patients/day)</label>
        <input
          className={INPUT}
          type="number"
          min="0"
          placeholder="e.g. 25"
          value={inputs.previousProviderPerformance}
          onChange={set('previousProviderPerformance')}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={LABEL}>Medical Coverage</label>
        <input className={INPUT} placeholder="e.g. Medicare, Medicaid, Private Pay" value={inputs.medicalCoverage} onChange={set('medicalCoverage')} />
      </div>
    </div>
  );
}
