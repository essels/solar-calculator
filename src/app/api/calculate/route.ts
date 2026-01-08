/**
 * Calculate API Endpoint
 * Provides server-side solar calculation for API consumers
 */

import { type NextRequest, NextResponse } from 'next/server';
import { calculateSolarEstimate } from '@/lib/solar/calculations';
import type { CalculateAPIRequest, CalculateAPIResponse, CalculatorInputs } from '@/types/solar';

/**
 * Validate calculator inputs
 */
function validateInputs(inputs: CalculatorInputs): { valid: boolean; error?: string } {
  // Postcode validation
  if (!inputs.postcode || typeof inputs.postcode !== 'string') {
    return { valid: false, error: 'Postcode is required' };
  }

  // Latitude/longitude validation
  if (typeof inputs.latitude !== 'number' || inputs.latitude < 49 || inputs.latitude > 61) {
    return { valid: false, error: 'Invalid latitude for UK location' };
  }

  if (typeof inputs.longitude !== 'number' || inputs.longitude < -8 || inputs.longitude > 2) {
    return { valid: false, error: 'Invalid longitude for UK location' };
  }

  // Roof orientation validation
  const validOrientations = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'flat'];
  if (!validOrientations.includes(inputs.roofOrientation)) {
    return { valid: false, error: 'Invalid roof orientation' };
  }

  // Roof pitch validation (0-90 degrees)
  if (typeof inputs.roofPitch !== 'number' || inputs.roofPitch < 0 || inputs.roofPitch > 90) {
    return { valid: false, error: 'Roof pitch must be between 0 and 90 degrees' };
  }

  // Roof area validation (5-500 m²)
  if (typeof inputs.roofArea !== 'number' || inputs.roofArea < 5 || inputs.roofArea > 500) {
    return { valid: false, error: 'Roof area must be between 5 and 500 m²' };
  }

  // Shading factor validation
  const validShading = [0, 0.5, 0.75, 0.9, 1.0];
  if (!validShading.includes(inputs.shadingFactor)) {
    return { valid: false, error: 'Invalid shading factor' };
  }

  // Annual usage validation (500-50000 kWh)
  if (
    typeof inputs.annualElectricityUsage !== 'number' ||
    inputs.annualElectricityUsage < 500 ||
    inputs.annualElectricityUsage > 50000
  ) {
    return { valid: false, error: 'Annual electricity usage must be between 500 and 50,000 kWh' };
  }

  // Home occupancy validation
  const validOccupancy = ['always', 'daytime', 'evening', 'variable'];
  if (!validOccupancy.includes(inputs.homeOccupancy)) {
    return { valid: false, error: 'Invalid home occupancy type' };
  }

  return { valid: true };
}

/**
 * POST /api/calculate
 * Calculate solar estimate from inputs
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { inputs } = body as CalculateAPIRequest;

    if (!inputs) {
      return NextResponse.json(
        { success: false, error: 'Missing inputs in request body' } as CalculateAPIResponse,
        { status: 400 }
      );
    }

    // Validate inputs
    const validation = validateInputs(inputs);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error } as CalculateAPIResponse,
        { status: 400 }
      );
    }

    // Calculate solar estimate
    const results = calculateSolarEstimate(inputs);

    // Return success response
    return NextResponse.json({ success: true, results } as CalculateAPIResponse, { status: 200 });
  } catch (error) {
    console.error('[Calculate API Error]', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate estimate. Please try again.',
      } as CalculateAPIResponse,
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/calculate
 * CORS preflight handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
