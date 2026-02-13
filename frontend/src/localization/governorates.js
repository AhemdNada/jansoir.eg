import GOV_AR from './governorates.ar-EG.json';

export const LOCALES = {
  AR_EG: 'ar-EG',
};

const normalizeKey = (nameKeyOrName) => String(nameKeyOrName || '').replace(/\s+/g, ' ').trim().toLowerCase();

export const getGovernorateLabel = ({ nameKey, name, locale = LOCALES.AR_EG } = {}) => {
  const key = normalizeKey(nameKey || name);
  if (!key) return '';
  if (locale === LOCALES.AR_EG) {
    return GOV_AR[key] || String(name || '').trim() || '';
  }
  return String(name || '').trim() || '';
};

