const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

function cleanString(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function requireString(value, field, max = 500) {
  const cleaned = cleanString(value, max);
  if (!cleaned) throw validationError(`${field} is required`);
  return cleaned;
}

function optionalString(value, max = 500) {
  const cleaned = cleanString(value, max);
  return cleaned || null;
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateEmail(email) {
  const cleaned = requireString(email, 'Email', 254).toLowerCase();
  if (!EMAIL_RE.test(cleaned)) throw validationError('Valid email is required');
  return cleaned;
}

function validateOptionalUrl(value, field) {
  const cleaned = optionalString(value, 2000);
  if (cleaned && !URL_RE.test(cleaned)) throw validationError(`${field} must be a valid http(s) URL`);
  return cleaned;
}

function validateJsonObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError(`${field} must be an object`);
  }
  return value;
}

function validateVariant(value) {
  if (!value) return 'A';
  if (!['A', 'B'].includes(value)) throw validationError('Variant must be A or B');
  return value;
}

function validateStatus(status) {
  if (!['ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED'].includes(status)) {
    throw validationError('Invalid status');
  }
  return status;
}

function validatePopupType(type) {
  if (!['EMAIL_CAPTURE', 'ANNOUNCEMENT', 'EXIT_INTENT', 'COUPON'].includes(type)) {
    throw validationError('Invalid popup type');
  }
  return type;
}

function validateAnalyticsEvent(event) {
  if (!['VIEW', 'SUBMIT', 'CLOSE'].includes(event)) {
    throw validationError('Invalid analytics event');
  }
  return event;
}

function parsePagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 100, 1), 500);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

module.exports = {
  cleanString,
  requireString,
  optionalString,
  validationError,
  validateEmail,
  validateOptionalUrl,
  validateJsonObject,
  validateVariant,
  validateStatus,
  validatePopupType,
  validateAnalyticsEvent,
  parsePagination,
};
