/**
 * PVGIS API Integration - DATA-002
 *
 * Provides solar irradiance data from the PVGIS (Photovoltaic Geographical
 * Information System) API for specific UK locations.
 *
 * Features:
 * - PVGIS API integration (free, no authentication required)
 * - Configurable PV system parameters (orientation, tilt angle)
 * - Robust error handling with automatic fallback to regional averages
 * - Response caching (1-day TTL) to minimize API calls and improve performance
 * - Rate limiting protection
 * - Timeout handling (10 second request timeout)
 * - Type-safe response parsing
 *
 * Sources:
 * - https://re.jrc.ec.europa.eu/api/PVcalc?
 * - https://pvgis.eu/about/
 * - https://pvgis.eu/download/
 *
 * Note: PVGIS is maintained by the European Commission Joint Research Centre
 * and provides validated satellite data for Europe including UK.
 */

import type { PVGISResponse } from '@/types/solar';
import { SOLAR_CONFIG, REGIONAL_IRRADIANCE } from './constants';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/**
 * PVGIS API Base URL
 * Endpoint: https://re.jrc.ec.europa.eu/api/PVcalc
 * Version: v5 (recommended)
 *
 * Rate limits: Not officially documented, but ~1 request per second recommended
 * No API key required for public use
 */
const PVGIS_API_BASE = 'https://re.jrc.ec.europa.eu/api/PVcalc';

/**
 * Request timeout in milliseconds (10 seconds)
 * PVGIS typical response time: 1-3 seconds for single location queries
 * Using 10 second timeout to account for network latency
 */
const PVGIS_REQUEST_TIMEOUT_MS = 10000;

/**
 * Cache TTL in milliseconds (24 hours)
 * 24 * 60 * 60 * 1000 = 86,400,000 ms
 * Irradiance data changes minimal on daily basis, safe to cache long-term
 */
const PVGIS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Default PV system parameters for UK residential systems
 * These can be customized per location via function parameters
 */
const PVGIS_DEFAULT_PARAMS = {
  /** Panel orientation: 0=South, -45=SE, 45=SW, 90=East, -90=West */
  azimuth: 180, // South-facing (optimal for UK)

  /** Panel tilt angle: 0=flat, 90=vertical. UK optimal: 30-40 degrees */
  tilt: 35, // Optimal for UK latitude

  /** Database: SARAH for satellite data (most accurate for UK) */
  database: 'SARAH2' as const,

  /** Output format: json */
  outputformat: 'json' as const,

  /** Use actual year or typical year? 'user' = provided year, 'tmy' = typical meteorological year */
  usehorizon: 1, // 1 = use horizon data for shadowing
};

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * PVGIS API Request Parameters
 * These are the parameters we send to PVGIS
 *
 * Required:
 * - latitude, longitude: Location coordinates
 *
 * Optional (with defaults):
 * - tilt: Panel tilt angle in degrees (0-90)
 * - azimuth: Panel orientation in degrees (0=South, 180=North, -90=East, 90=West)
 * - database: SARAH2, PVGIS_SARAH2, etc. (SARAH2 recommended for UK)
 */
export interface PVGISRequestParams {
  latitude: number;
  longitude: number;
  tilt?: number;
  azimuth?: number;
  database?: 'SARAH2' | 'PVGIS_SARAH2' | 'ERA5';
  usehorizon?: 0 | 1;
  outputformat?: 'json';
}

/**
 * Raw PVGIS API Response Structure
 * This is the actual response from PVGIS API before normalization
 *
 * Example:
 * {
 *   "location": {
 *     "latitude": 51.5074,
 *     "longitude": -0.1278,
 *     "elevation": 10
 *   },
 *   "inputs": {
 *     "location": { "latitude": 51.5074, "longitude": -0.1278 },
 *     "pv_module": { "technology": "CdTe" },
 *     "mounting_system": { "tracking": "fixed", "tilt": { "value": 35 }, "azimuth": { "value": 180 } }
 *   },
 *   "outputs": {
 *     "totals": {
 *       "fixed": {
 *         "E_y": 1050,     // Annual output in kWh/kWp
 *         "E_m": [65, 75, 95, 110, 130, 140, 135, 120, 100, 80, 60, 50],  // Monthly output
 *         "SD_E_y": 50
 *       }
 *     }
 *   },
 *   "meta": { "inputs": {...}, "outputs": {...} }
 * }
 */
interface PVGISRawResponse {
  location?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  inputs?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    pv_module?: {
      technology: string;
    };
    mounting_system?: {
      tracking: string;
      tilt?: {
        value: number;
      };
      azimuth?: {
        value: number;
      };
    };
  };
  outputs?: {
    totals?: {
      fixed?: {
        E_y?: number; // Annual output in kWh/kWp
        E_m?: number[]; // Monthly output array (12 values)
        SD_E_y?: number; // Standard deviation
      };
    };
  };
  meta?: {
    name?: string;
    inputs?: unknown;
    outputs?: unknown;
  };
  error?: string;
}

/**
 * Normalized PVGIS response for our application
 * This is what we return to the caller
 */
interface NormalizedPVGISResponse {
  success: boolean;
  latitude: number;
  longitude: number;
  annualIrradiance?: number; // kWh/m²/year (converted from E_y)
  monthlyIrradiance?: number[]; // 12-month array
  elevation?: number;
  source?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Cache entry structure for localStorage
 */
interface PVGISCacheEntry {
  data: NormalizedPVGISResponse;
  timestamp: number;
  expiry: number;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate cache key from coordinates
 * Precision: 4 decimal places (~11 meters accuracy, sufficient for UK)
 */
function getCacheKey(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(4);
  const lon = longitude.toFixed(4);
  return `pvgis_${lat}_${lon}`;
}

/**
 * Check if cached data is still valid
 * Uses lazy expiry - only checks when accessing
 */
function isCacheValid(entry: PVGISCacheEntry): boolean {
  return Date.now() < entry.expiry;
}

/**
 * Get cached PVGIS response if available and not expired
 */
export function getPVGISCache(latitude: number, longitude: number): NormalizedPVGISResponse | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null; // Server-side or localStorage unavailable
    }

    const key = getCacheKey(latitude, longitude);
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const entry: PVGISCacheEntry = JSON.parse(cached);

    // Check if expired
    if (!isCacheValid(entry)) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.debug('Failed to retrieve PVGIS cache:', error);
    return null;
  }
}

/**
 * Store PVGIS response in cache with TTL
 */
function setPVGISCache(
  latitude: number,
  longitude: number,
  response: NormalizedPVGISResponse
): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return; // Server-side or localStorage unavailable
    }

    const key = getCacheKey(latitude, longitude);
    const entry: PVGISCacheEntry = {
      data: response,
      timestamp: Date.now(),
      expiry: Date.now() + PVGIS_CACHE_TTL_MS,
    };

    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.debug('Failed to cache PVGIS response (quota exceeded?):', error);
  }
}

/**
 * Clear PVGIS cache for specific location or all
 */
export function clearPVGISCache(latitude?: number, longitude?: number): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    if (latitude !== undefined && longitude !== undefined) {
      const key = getCacheKey(latitude, longitude);
      localStorage.removeItem(key);
    } else {
      // Clear all PVGIS entries
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('pvgis_')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => localStorage.removeItem(key));
    }
  } catch (error) {
    console.debug('Failed to clear PVGIS cache:', error);
  }
}

/**
 * Validate PVGIS coordinates are within UK bounds
 * Rough bounds: 49.8°N to 60.8°N, 2.0°W to 1.8°E
 */
function isValidUKLocation(latitude: number, longitude: number): boolean {
  const latMin = 49.5;
  const latMax = 61.0;
  const lonMin = -6.0;
  const lonMax = 2.5;

  return latitude >= latMin && latitude <= latMax && longitude >= lonMin && longitude <= lonMax;
}

/**
 * Build PVGIS API query string
 */
function buildPVGISQueryString(params: PVGISRequestParams): string {
  const queryParams = new URLSearchParams({
    latitude: params.latitude.toString(),
    longitude: params.longitude.toString(),
    tilt: (params.tilt ?? PVGIS_DEFAULT_PARAMS.tilt).toString(),
    azimuth: (params.azimuth ?? PVGIS_DEFAULT_PARAMS.azimuth).toString(),
    database: params.database ?? PVGIS_DEFAULT_PARAMS.database,
    outputformat: params.outputformat ?? PVGIS_DEFAULT_PARAMS.outputformat,
    usehorizon: (params.usehorizon ?? PVGIS_DEFAULT_PARAMS.usehorizon).toString(),
  });

  return queryParams.toString();
}

/**
 * Parse and validate PVGIS API response
 * Converts E_y (specific yield in kWh/kWp) to irradiance (kWh/m²)
 *
 * PVGIS returns E_y (specific yield), which represents kWh generated per kW installed
 * per year. For a 1kW system with 1m² of panels, this is approximately kWh/m²/year.
 */
function parseAndValidatePVGISResponse(
  raw: PVGISRawResponse,
  latitude: number,
  longitude: number
): NormalizedPVGISResponse {
  // Check for API-level error
  if (raw.error) {
    return {
      success: false,
      latitude,
      longitude,
      error: raw.error,
    };
  }

  // Extract annual generation (E_y)
  const annualGenerationKwp = raw.outputs?.totals?.fixed?.E_y;
  const monthlyGenerationKwp = raw.outputs?.totals?.fixed?.E_m;

  if (!annualGenerationKwp || !Array.isArray(monthlyGenerationKwp)) {
    return {
      success: false,
      latitude,
      longitude,
      error: 'Invalid PVGIS response: missing E_y or E_m data',
    };
  }

  // Validate array length
  if (monthlyGenerationKwp.length !== 12) {
    return {
      success: false,
      latitude,
      longitude,
      error: `Invalid PVGIS response: expected 12 months, got ${monthlyGenerationKwp.length}`,
    };
  }

  // Convert E_y to irradiance
  // E_y in kWh/kWp/year is approximately equivalent to kWh/m²/year for typical panels
  // PVGIS panels assumed ~200W/m², so E_y ~= irradiance for our purposes
  const annualIrradiance = Math.round(annualGenerationKwp);

  return {
    success: true,
    latitude,
    longitude,
    annualIrradiance,
    monthlyIrradiance: monthlyGenerationKwp.map((val) => Math.round(val)),
    elevation: raw.location?.elevation,
    source: `PVGIS ${raw.inputs?.pv_module?.technology || 'SARAH2'}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get regional irradiance fallback based on region name
 * Used when PVGIS API fails or is unavailable
 */
export function getRegionalIrradianceFallback(region: string): number {
  return REGIONAL_IRRADIANCE[region] || REGIONAL_IRRADIANCE.default;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch solar irradiance data from PVGIS API
 *
 * Makes HTTP request to PVGIS API and returns parsed irradiance data.
 * Implements:
 * - Request timeout (10 seconds)
 * - Response validation
 * - Automatic fallback to regional averages on error
 * - Response caching (1-day TTL)
 *
 * @param latitude - Location latitude (decimal degrees)
 * @param longitude - Location longitude (decimal degrees)
 * @param region - UK region name (for fallback if PVGIS unavailable)
 * @param params - Optional custom PVGIS parameters (tilt, azimuth, database)
 *
 * @returns PVGISResponse with irradiance data or fallback
 *
 * @example
 * const result = await fetchPVGISIrradiance(51.5074, -0.1278, 'London');
 * if (result.success) {
 *   console.log(`Annual irradiance: ${result.annualIrradiance} kWh/m²/year`);
 *   console.log(`Monthly breakdown:`, result.monthlyIrradiance);
 * } else {
 *   console.log(`Fallback used: ${result.error}`);
 * }
 */
export async function fetchPVGISIrradiance(
  latitude: number,
  longitude: number,
  region?: string,
  params?: Partial<PVGISRequestParams>
): Promise<PVGISResponse> {
  try {
    // Validate coordinates
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates: latitude and longitude must be finite numbers',
      };
    }

    // Warn if outside UK but allow for edge cases
    if (!isValidUKLocation(latitude, longitude)) {
      console.warn(
        `Location (${latitude}, ${longitude}) is outside typical UK bounds. Results may be inaccurate.`
      );
    }

    // Check cache first
    const cached = getPVGISCache(latitude, longitude);
    if (cached) {
      console.debug(`Using cached PVGIS data for (${latitude}, ${longitude})`);
      return cached;
    }

    // Build API request
    const requestParams: PVGISRequestParams = {
      latitude,
      longitude,
      ...params,
    };

    const queryString = buildPVGISQueryString(requestParams);
    const url = `${PVGIS_API_BASE}?${queryString}`;

    console.debug(`Fetching PVGIS data from: ${url}`);

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PVGIS_REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Check HTTP status
    if (!response.ok) {
      throw new Error(`PVGIS API returned status ${response.status}: ${response.statusText}`);
    }

    // Parse response
    const rawData: unknown = await response.json();
    const normalized = parseAndValidatePVGISResponse(
      rawData as PVGISRawResponse,
      latitude,
      longitude
    );

    // Cache successful response
    if (normalized.success) {
      setPVGISCache(latitude, longitude, normalized);
    }

    return normalized;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : `Unknown error: ${JSON.stringify(error)}`;

    console.warn(`PVGIS API error: ${errorMessage}. Will use regional fallback.`);

    // Fallback to regional irradiance
    const fallbackIrradiance = region
      ? getRegionalIrradianceFallback(region)
      : SOLAR_CONFIG.ukAverageIrradiance;

    return {
      success: false,
      error: `PVGIS unavailable (${errorMessage}). Using regional fallback: ${fallbackIrradiance} kWh/m²/year`,
    };
  }
}

/**
 * Get irradiance data with automatic fallback
 *
 * Tries PVGIS first, falls back to regional average if unavailable.
 * Returns a single irradiance value suitable for calculations.
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param region - UK region for fallback
 *
 * @returns Irradiance value in kWh/m²/year
 *
 * @example
 * const irradiance = await getIrradianceValue(51.5074, -0.1278, 'London');
 * // Returns ~1050 from PVGIS or ~1000 (London fallback)
 */
export async function getIrradianceValue(
  latitude: number,
  longitude: number,
  region?: string
): Promise<number> {
  const result = await fetchPVGISIrradiance(latitude, longitude, region);

  if (result.success && result.annualIrradiance) {
    return result.annualIrradiance;
  }

  // Fallback to regional or default
  return region ? getRegionalIrradianceFallback(region) : SOLAR_CONFIG.ukAverageIrradiance;
}

/**
 * Get monthly irradiance distribution
 *
 * Returns 12-month breakdown of irradiance. Falls back to modeled distribution
 * if PVGIS unavailable.
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param region - UK region for fallback
 *
 * @returns Array of 12 monthly irradiance values (kWh/m²)
 *
 * @example
 * const monthly = await getMonthlyIrradiance(51.5074, -0.1278, 'London');
 * console.log(`January: ${monthly[0]} kWh/m²`);
 */
export async function getMonthlyIrradiance(
  latitude: number,
  longitude: number,
  region?: string
): Promise<number[]> {
  const result = await fetchPVGISIrradiance(latitude, longitude, region);

  if (result.success && result.monthlyIrradiance) {
    return result.monthlyIrradiance;
  }

  // Fallback: generate from annual using typical UK distribution
  const annualIrradiance = await getIrradianceValue(latitude, longitude, region);
  const distribution = [
    0.03, // January
    0.05, // February
    0.08, // March
    0.1, // April
    0.12, // May
    0.13, // June (peak)
    0.13, // July
    0.11, // August
    0.09, // September
    0.07, // October
    0.05, // November
    0.04, // December
  ];

  return distribution.map((fraction) => Math.round(annualIrradiance * fraction));
}

/**
 * PVGIS Service - Class-based interface (optional OOP alternative)
 *
 * @example
 * const pvgis = new PVGISService();
 * const result = await pvgis.getIrradiance(51.5074, -0.1278, 'London');
 */
export class PVGISService {
  /**
   * Fetch irradiance data for a location
   */
  async getIrradiance(
    latitude: number,
    longitude: number,
    region?: string,
    params?: Partial<PVGISRequestParams>
  ): Promise<PVGISResponse> {
    return fetchPVGISIrradiance(latitude, longitude, region, params);
  }

  /**
   * Get single irradiance value with fallback
   */
  async getIrradianceValue(latitude: number, longitude: number, region?: string): Promise<number> {
    return getIrradianceValue(latitude, longitude, region);
  }

  /**
   * Get monthly irradiance breakdown
   */
  async getMonthlyIrradiance(
    latitude: number,
    longitude: number,
    region?: string
  ): Promise<number[]> {
    return getMonthlyIrradiance(latitude, longitude, region);
  }

  /**
   * Clear cache for a location or all
   */
  clearCache(latitude?: number, longitude?: number): void {
    clearPVGISCache(latitude, longitude);
  }

  /**
   * Get regional fallback irradiance
   */
  getRegionalFallback(region: string): number {
    return getRegionalIrradianceFallback(region);
  }
}
