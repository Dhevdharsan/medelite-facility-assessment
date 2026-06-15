function ratingColor(raw) {
  const n = parseFloat(raw);
  if (isNaN(n)) return 'text-slate-400';
  if (n >= 4.5) return 'text-emerald-600';
  if (n >= 3.5) return 'text-green-500';
  if (n >= 2.5) return 'text-yellow-500';
  if (n >= 1.5) return 'text-orange-500';
  return 'text-red-500';
}

export default function StarDisplay({ label, value }) {
  const raw = parseFloat(value);
  const stars = isNaN(raw) ? 0 : Math.round(raw);
  const color = ratingColor(value);

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${color}`}>
          {isNaN(raw) ? 'Not Available' : `${raw} / 5`}
        </span>
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => (
            <svg
              key={i}
              className={`w-4 h-4 ${i <= stars ? color : 'text-slate-200'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}
