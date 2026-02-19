import Conf from 'conf';

const store = new Conf({
  projectName: 'ktmcp-goupc',
  schema: {
    apiKey: {
      type: 'string',
      default: '',
    },
  },
});

/**
 * Get a single config value by key.
 * @param {string} key
 * @returns {*}
 */
export function getConfig(key) {
  return store.get(key);
}

/**
 * Set a config value.
 * @param {string} key
 * @param {*} value
 */
export function setConfig(key, value) {
  store.set(key, value);
}

/**
 * Get all config values as a plain object.
 * @returns {object}
 */
export function getAllConfig() {
  return store.store;
}

/**
 * Clear all config values.
 */
export function clearConfig() {
  store.clear();
}

/**
 * Check whether the CLI has been configured with an API key.
 * @returns {boolean}
 */
export function isConfigured() {
  const key = store.get('apiKey');
  return typeof key === 'string' && key.trim().length > 0;
}
