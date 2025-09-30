/**
 * Environment-aware logger utility for client
 * Prevents console logging in production environment and masks PII
 */

const isDev = process.env.NODE_ENV !== 'production';

export const log = (...args) => isDev && console.log(...args);
export const warn = (...args) => isDev && console.warn(...args);
export const error = (...args) => console.error(...args); // keep errors in prod

/**
 * Helper to mask email addresses for logging
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
export const maskEmail = (e) => (typeof e === 'string' ? e.replace(/(^.).*(@.*$)/, '$1***$2') : e);

/**
 * Helper to mask IDs for logging (shows only last 6 characters)
 * @param {string} id - ID to mask
 * @returns {string} Masked ID
 */
export const maskId = (id) => (typeof id === 'string' ? String(id).slice(-6) : id);

export default {
  log,
  error,
  warn,
  maskEmail,
  maskId
};