import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://go-upc.com/api/v1';

/**
 * Build an Axios instance configured with the stored API key.
 * @returns {import('axios').AxiosInstance}
 */
function buildClient() {
  const apiKey = getConfig('apiKey');
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

/**
 * Look up a product by its barcode (UPC / EAN / ISBN).
 * @param {string} code - The barcode string.
 * @returns {Promise<object>} The raw API response data.
 */
export async function lookupBarcode(code) {
  const client = buildClient();
  try {
    const response = await client.get(`/code/${encodeURIComponent(code)}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const msg =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message;

      if (status === 401) {
        throw new Error('Unauthorized: invalid or missing API key. Run: goupc config set --api-key <KEY>');
      } else if (status === 404) {
        throw new Error(`Product not found for barcode: ${code}`);
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      } else {
        throw new Error(`API error (${status}): ${msg}`);
      }
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Look up multiple barcodes and return an array of results.
 * Each result includes the original code plus either the API data or an error.
 * @param {string[]} codes - Array of barcode strings.
 * @returns {Promise<Array<{code: string, data?: object, error?: string}>>}
 */
export async function lookupBatch(codes) {
  const results = [];
  for (const code of codes) {
    try {
      const data = await lookupBarcode(code);
      results.push({ code, data });
    } catch (err) {
      results.push({ code, error: err.message });
    }
  }
  return results;
}

/**
 * Extract key display fields from a raw API product response.
 * @param {object} data - Raw response from the Go-UPC API.
 * @returns {object} Normalised product object.
 */
export function formatProduct(data) {
  const product = data.product || data;

  return {
    name: product.name || 'N/A',
    description: product.description || 'N/A',
    brand: product.brand || 'N/A',
    category: product.category || 'N/A',
    imageUrl: product.imageUrl || product.image_url || product.images?.[0] || 'N/A',
    specs: product.specs || product.attributes || product.specifications || [],
    barcode: data.barcode || data.code || 'N/A',
    barcodeType: data.barcodeType || data.type || 'N/A',
  };
}
