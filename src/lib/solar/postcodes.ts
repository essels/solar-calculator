/**
 * Postcode Lookup Integration - DATA-001
 *
 * Provides UK postcode validation and lookup via postcodes.io API
 * with localStorage caching (7-day TTL).
 *
 * Features:
 * - Format validation using official GOV.UK regex
 * - postcodes.io API integration (no auth required)
 * - 7-day localStorage caching with lazy expiry
 * - Graceful error handling for private mode, quota exceeded, etc.
 * - Postcode normalization (uppercase, spacing)
 *
 * Sources:
 * - https://postcodes.io/docs/api/
 * - https://github.com/stemount/gov-uk-official-postcode-regex-helper
 * - https://ideal-postcodes.co.uk/guides/uk-postcode-format
 */

import type { PostcodeResponse } from '@/types/solar';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Official GOV.UK postcode regex (British Standards BS 7666)
 * Case-insensitive version with optional space between outcode and incode
 *
 * Validates format but NOT existence - use API for existence check
 *
 * Rules:
 * - Supports GIR 0AA special case (Santander)
 * - Outcode: 2-4 characters (area + district)
 * - Incode: 3 characters (1 digit + 2 letters)
 * - Space between outcode and incode
 * - Never: I, J, Z (position 2); C, I, K, M, O, V (incode)
 */
export const POSTCODE_REGEX =
  /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/;

/**
 * 7-day cache TTL in milliseconds
 * 7 * 24 * 60 * 60 * 1000 = 604,800,000 ms
 */
export const POSTCODE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * postcodes.io API base URL
 * Free, no authentication required
 */
const POSTCODES_IO_API = 'https://api.postcodes.io/postcodes';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Internal cache entry structure
 * Stored as JSON in localStorage
 */
interface PostcodeCacheEntry {
  /** Full PostcodeResponse from API */
  data: PostcodeResponse;

  /** Timestamp when cached (Date.now()) */
  timestamp: number;

  /** Expiry time in milliseconds since epoch */
  expiry: number;
}

/**
 * postcodes.io raw API response structure
 * (before we normalize to PostcodeResponse)
 */
interface PostcodesIOResponse {
  status: number;
  result?: {
    postcode: string;
    quality: number;
    eastings: number;
    northings: number;
    country: string;
    nhs_ha: string;
    longitude: number;
    latitude: number;
    region: string;
    admin_district: string;
    parish: string;
    admin_county: string | null;
    admin_ward: string;
    ccg: string;
    nuts: string;
    incode: string;
    outcode: string;
    parliamentary_constituency: string | null;
    lsoa: string | null;
    msoa: string | null;
    european_electoral_region: string | null;
    [key: string]: string | number | boolean | null; // API may return additional fields
  };
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════
// NORMALIZATION & VALIDATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Normalize postcode to standard format
 *
 * @param postcode - Input postcode (any case, with/without space)
 * @returns Normalized postcode with space: "SW1A 1AA"
 *
 * @example
 * normalizePostcode("sw1a1aa") // "SW1A 1AA"
 * normalizePostcode("SW1A1AA") // "SW1A 1AA"
 * normalizePostcode("SW1A 1AA") // "SW1A 1AA"
 */
export function normalizePostcode(postcode: string): string {
  // Remove all whitespace and convert to uppercase
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '');

  // Insert space before last 3 characters (incode)
  // For postcodes shorter than 3 chars, return as-is
  if (cleaned.length < 3) {
    return cleaned;
  }

  return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
}

/**
 * Validate postcode format using official GOV.UK regex
 *
 * NOTE: This only checks format validity, NOT if postcode exists.
 * For existence validation, use the API (fetchPostcodeData).
 *
 * @param postcode - Postcode to validate
 * @returns true if format is valid
 *
 * @example
 * validatePostcodeFormat("SW1A 1AA") // true
 * validatePostcodeFormat("INVALID") // false
 * validatePostcodeFormat("sw1a 1aa") // true (case-insensitive)
 */
export function validatePostcodeFormat(postcode: string): boolean {
  const normalized = normalizePostcode(postcode);
  return POSTCODE_REGEX.test(normalized);
}

// ═══════════════════════════════════════════════════════════════════
// CACHING UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Get cache key for a postcode
 *
 * @param postcode - Normalized or unnormalized postcode
 * @returns Cache key string
 */
function getCacheKey(postcode: string): string {
  const normalized = normalizePostcode(postcode);
  const noSpace = normalized.replace(/\s/g, '');
  return `postcode_lookup_${noSpace}`;
}

/**
 * Store postcode lookup in localStorage with 7-day TTL
 *
 * Gracefully handles:
 * - Private/incognito mode (localStorage not available)
 * - Storage quota exceeded
 * - Corrupted cache entries
 *
 * @param postcode - The postcode being cached
 * @param response - PostcodeResponse to cache
 *
 * @example
 * const response = { valid: true, postcode: "SW1A 1AA", latitude: 51.5, longitude: -0.1, region: "London" };
 * setPostcodeCache("SW1A 1AA", response);
 */
export function setPostcodeCache(postcode: string, response: PostcodeResponse): void {
  try {
    const cacheEntry: PostcodeCacheEntry = {
      data: response,
      timestamp: Date.now(),
      expiry: Date.now() + POSTCODE_CACHE_TTL_MS,
    };

    const key = getCacheKey(postcode);
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    // Silently fail - localStorage unavailable or quota exceeded
    // App will simply re-fetch from API next time
    console.debug('Failed to cache postcode (localStorage unavailable or quota exceeded):', error);
  }
}

/**
 * Retrieve postcode from cache if not expired
 *
 * Performs lazy expiry check - only checks expiry when retrieving.
 * Expired entries are automatically deleted from cache.
 *
 * @param postcode - Postcode to look up in cache
 * @returns PostcodeResponse if found and valid, null if not found or expired
 *
 * @example
 * const cached = getPostcodeCache("SW1A 1AA");
 * if (cached) {
 *   console.log("Using cached data:", cached);
 * }
 */
export function getPostcodeCache(postcode: string): PostcodeResponse | null {
  try {
    const key = getCacheKey(postcode);
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null; // Not in cache
    }

    const entry: PostcodeCacheEntry = JSON.parse(cached);

    // Check if expired (lazy expiry)
    if (Date.now() > entry.expiry) {
      // Delete expired entry
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    // localStorage unavailable or JSON parse error - silently fail
    console.debug('Failed to retrieve postcode from cache:', error);
    return null;
  }
}

/**
 * Clear postcode cache
 *
 * @param postcode - Specific postcode to clear, or undefined to clear all
 *
 * @example
 * clearPostcodeCache("SW1A 1AA");        // Clear one entry
 * clearPostcodeCache();                   // Clear all postcode_lookup_* entries
 */
export function clearPostcodeCache(postcode?: string): void {
  try {
    if (postcode) {
      // Clear specific postcode
      const key = getCacheKey(postcode);
      localStorage.removeItem(key);
    } else {
      // Clear all postcode lookups
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('postcode_lookup_')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => localStorage.removeItem(key));
    }
  } catch (error) {
    console.debug('Failed to clear postcode cache:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// API INTEGRATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch postcode data from postcodes.io API
 *
 * Makes HTTP request to postcodes.io (no authentication required).
 * Returns normalized PostcodeResponse with latitude, longitude, region, etc.
 *
 * Error handling:
 * - Network errors thrown as exceptions
 * - Invalid postcode returns { valid: false, error: "..." }
 * - API errors returned with error message
 *
 * @param postcode - Postcode to look up (any format, will be normalized)
 * @returns PostcodeResponse with data or error information
 * @throws Error if network request fails
 *
 * @example
 * try {
 *   const response = await fetchPostcodeFromAPI("SW1A 1AA");
 *   if (response.valid) {
 *     console.log("Latitude:", response.latitude);
 *   }
 * } catch (error) {
 *   console.error("Network error:", error);
 * }
 */
async function fetchPostcodeFromAPI(postcode: string): Promise<PostcodeResponse> {
  const normalized = normalizePostcode(postcode);
  const noSpace = normalized.replace(/\s/g, '');

  const response = await fetch(`${POSTCODES_IO_API}/${noSpace}`);

  if (!response.ok) {
    if (response.status === 404) {
      return {
        valid: false,
        postcode: normalized,
        error: 'Postcode not found',
      };
    }

    throw new Error(
      `Postcode lookup failed with status ${response.status}: ${response.statusText}`
    );
  }

  const json: PostcodesIOResponse = await response.json();

  if (json.status !== 200 || !json.result) {
    return {
      valid: false,
      postcode: normalized,
      error: json.error || 'Invalid postcode',
    };
  }

  // Normalize to our PostcodeResponse type
  const postcodeResponse: PostcodeResponse = {
    valid: true,
    postcode: json.result.postcode,
    latitude: json.result.latitude,
    longitude: json.result.longitude,
    region: json.result.region,
  };

  return postcodeResponse;
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API - MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Look up a postcode with validation and caching
 *
 * Flow:
 * 1. Validate format with regex
 * 2. Check cache (7-day TTL with lazy expiry)
 * 3. Fetch from postcodes.io API if not cached
 * 4. Cache successful result
 * 5. Return result
 *
 * @param postcode - UK postcode to look up (any format)
 * @returns PostcodeResponse with data or error
 * @throws Error if network request fails
 *
 * @example
 * // Success case
 * const result = await lookupPostcode("SW1A 1AA");
 * if (result.valid) {
 *   console.log(`${result.postcode} is at ${result.latitude}, ${result.longitude}`);
 *   console.log(`Region: ${result.region}`);
 * }
 *
 * // Error case
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export async function lookupPostcode(postcode: string): Promise<PostcodeResponse> {
  // Step 1: Format validation
  if (!validatePostcodeFormat(postcode)) {
    return {
      valid: false,
      postcode: normalizePostcode(postcode),
      error: 'Invalid postcode format',
    };
  }

  // Step 2: Check cache
  const cached = getPostcodeCache(postcode);
  if (cached) {
    console.debug('Postcode found in cache:', postcode);
    return cached;
  }

  // Step 3: Fetch from API
  console.debug('Fetching postcode from API:', postcode);
  const result = await fetchPostcodeFromAPI(postcode);

  // Step 4: Cache successful results
  if (result.valid) {
    setPostcodeCache(postcode, result);
  }

  return result;
}

/**
 * Validate postcode without caching
 *
 * Useful for quick format checks before making full API calls.
 * Does NOT check if postcode actually exists.
 *
 * For full validation including existence, use lookupPostcode().
 *
 * @param postcode - Postcode to validate
 * @returns true if format is valid, false otherwise
 *
 * @example
 * if (validatePostcodeFormat("SW1A 1AA")) {
 *   // Format is valid, safe to look up
 * }
 */
export function validatePostcode(postcode: string): boolean {
  return validatePostcodeFormat(postcode);
}

/**
 * Get postcode from cache without API call
 *
 * Useful for checking if a postcode was previously looked up
 * without making a new API request.
 *
 * @param postcode - Postcode to look up in cache
 * @returns PostcodeResponse if found and valid, null if not found or expired
 *
 * @example
 * const cached = getCachedPostcode("SW1A 1AA");
 * if (cached) {
 *   // Use cached data
 * } else {
 *   // Need to look up with lookupPostcode()
 * }
 */
export function getCachedPostcode(postcode: string): PostcodeResponse | null {
  return getPostcodeCache(postcode);
}

/**
 * Preload postcodes into cache
 *
 * Useful for bulk loading common postcodes to reduce latency.
 *
 * @param postcodes - Array of postcodes to preload
 * @returns Promise that resolves when all lookups complete
 *
 * @example
 * await preloadPostcodes(["SW1A 1AA", "M1 1AA", "B33 8TH"]);
 * // All three are now cached
 */
export async function preloadPostcodes(postcodes: string[]): Promise<void> {
  await Promise.all(postcodes.map((postcode) => lookupPostcode(postcode)));
}

/**
 * Validate multiple postcodes in parallel
 *
 * @param postcodes - Array of postcodes to validate
 * @returns Promise resolving to array of PostcodeResponse objects
 *
 * @example
 * const results = await lookupMultiplePostcodes(["SW1A 1AA", "M1 1AA"]);
 * const validPostcodes = results.filter(r => r.valid);
 */
export async function lookupMultiplePostcodes(postcodes: string[]): Promise<PostcodeResponse[]> {
  return Promise.all(postcodes.map((postcode) => lookupPostcode(postcode)));
}

// ═══════════════════════════════════════════════════════════════════
// POSTCODE CLASS (Optional OOP Alternative)
// ═══════════════════════════════════════════════════════════════════

/**
 * Postcode validator and lookup class
 *
 * Object-oriented alternative to functional API.
 * Useful for integration with frameworks that use classes.
 *
 * @example
 * const validator = new PostcodeValidator();
 * const result = await validator.lookup("SW1A 1AA");
 */
export class PostcodeValidator {
  /**
   * Validate postcode format
   */
  public isValidFormat(postcode: string): boolean {
    return validatePostcodeFormat(postcode);
  }

  /**
   * Look up postcode with caching
   */
  public async lookup(postcode: string): Promise<PostcodeResponse> {
    return lookupPostcode(postcode);
  }

  /**
   * Get cached postcode without API call
   */
  public getCached(postcode: string): PostcodeResponse | null {
    return getPostcodeCache(postcode);
  }

  /**
   * Clear cache for postcode(s)
   */
  public clearCache(postcode?: string): void {
    clearPostcodeCache(postcode);
  }

  /**
   * Normalize postcode format
   */
  public normalize(postcode: string): string {
    return normalizePostcode(postcode);
  }
}
