export function safe(v) {
  if (v === null || v === undefined || v === '') return 'Not Available';
  return String(v).trim() || 'Not Available';
}

export function safeNum(v, decimals = 2) {
  const n = parseFloat(v);
  if (isNaN(n)) return 'Not Available';
  return n.toFixed(decimals);
}

export function safeRating(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return 'Not Available';
  return `${n} / 5`;
}

export function formatAddress(facility) {
  const { address, city, state, zipCode } = facility;
  const parts = [address, city, state, zipCode].filter(p => p && p !== 'Not Available');
  return parts.length ? parts.join(', ') : 'Not Available';
}

export function claimsLabel(key) {
  const map = {
    shortTermHosp: 'Short Term Hospitalization',
    shortTermEd:   'STR ED Visit',
    ltHosp:        'LT Hospitalization',
    ltEd:          'ED Visit',
  };
  return map[key] || key;
}

export function claimsPct(v) {
  if (v === null || v === undefined) return 'Not Available';
  return `${parseFloat(v).toFixed(1)}%`;
}

export function claimsRate(v) {
  if (v === null || v === undefined) return 'Not Available';
  return parseFloat(v).toFixed(2);
}
