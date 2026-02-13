function parseDateParam(value, { endOfDay = false } = {}) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Support YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const dt = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime())) return null;
    if (endOfDay) {
      return new Date(`${raw}T23:59:59.999Z`);
    }
    return dt;
  }

  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function getDateRange(query, { defaultDays = 7 } = {}) {
  const to = parseDateParam(query.to, { endOfDay: true }) || new Date();
  const from = parseDateParam(query.from) || new Date(to.getTime() - defaultDays * 24 * 60 * 60 * 1000);

  // Normalize if swapped
  if (from > to) {
    return { from: to, to: from };
  }
  return { from, to };
}

function toUtcDayString(date) {
  const dt = new Date(date);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function enumerateUtcDays(from, to) {
  const out = [];
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 0, 0, 0, 0));
  for (let d = start; d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    out.push(toUtcDayString(d));
  }
  return out;
}

module.exports = {
  getDateRange,
  parseDateParam,
  enumerateUtcDays,
  toUtcDayString,
};

