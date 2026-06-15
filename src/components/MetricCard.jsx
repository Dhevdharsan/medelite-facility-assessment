import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function fmt(v, isRate = false) {
  if (v === null || v === undefined) return 'N/A';
  return isRate ? `${parseFloat(v).toFixed(2)}` : `${parseFloat(v).toFixed(1)}%`;
}

export default function MetricCard({ title, facility, national, state, isRate = false }) {
  const facilityNum  = parseFloat(facility);
  const nationalNum  = parseFloat(national);
  const worse = !isNaN(facilityNum) && !isNaN(nationalNum) && facilityNum > nationalNum;

  const data = [
    { name: 'Facility',  value: isNaN(facilityNum) ? 0 : facilityNum,  color: worse ? '#DC2626' : '#7C3AED' },
    { name: 'National',  value: isNaN(nationalNum)  ? 0 : nationalNum,  color: '#94A3B8' },
    { name: 'State',     value: isNaN(parseFloat(state)) ? 0 : parseFloat(state), color: '#64748B' },
  ];

  return (
    <div className={`rounded-xl border p-4 bg-white shadow-sm ${worse ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 leading-tight">{title}</h4>
        {worse && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">
            Above Avg
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <div className={`text-lg font-bold ${worse ? 'text-red-600' : 'text-brand-violet'}`}>
            {fmt(facility, isRate)}
          </div>
          <div className="text-xs text-slate-400">Facility</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-500">{fmt(national, isRate)}</div>
          <div className="text-xs text-slate-400">National</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-500">{fmt(state, isRate)}</div>
          <div className="text-xs text-slate-400">State</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={data} barSize={24}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip formatter={(v) => fmt(v, isRate)} contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="value" radius={[4,4,0,0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
