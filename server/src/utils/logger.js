/**
 * Environment-aware logger utility for server
 * Prevents console logging in production environment and masks PII
 */

const isDev = process.env.NODE_ENV !== 'production';
const logHttp = process.env.LOG_HTTP === 'true';

export const log = (...args) => isDev && console.log(...args);
export const warn = (...args) => isDev && console.warn(...args);
export const error = (...args) => console.error(...args); // keep errors in prod
export const httpLog = (...args) => logHttp && isDev && console.log(...args);

/**
 * Helper to mask email addresses for logging
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
export const maskEmail = (e) => (typeof e === 'string' ? e.replace(/(^.).*(@.*$)/, '$1***$2') : e);

/**
 * Helper to mask IDs for logging (first 2 + '***' + last 4 characters)
 * @param {string} id - ID to mask
 * @returns {string} Masked ID
 */
export const maskId = (id) => (id ? String(id).slice(0,2) + '***' + String(id).slice(-4) : id);

export default {
  log,
  error,
  warn,
  httpLog,
  maskEmail,
  maskId
};