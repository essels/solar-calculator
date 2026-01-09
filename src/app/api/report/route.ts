/**
 * PDF Report Generation API Endpoint
 * Generates a branded solar quote PDF report
 */

import { type NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import type { CalculatorResults } from '@/types/solar';

/**
 * Generate PDF report from calculation results
 */
function generatePdfReport(results: CalculatorResults, postcode: string): ArrayBuffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(34, 139, 34); // Forest green
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('SolarQuote UK', 20, 20);

  doc.setFontSize(12);
  doc.text('Your Personalised Solar Estimate', 20, 32);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Location info
  doc.setFontSize(10);
  doc.text(`Location: ${postcode}`, 20, 55);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 20, 62);

  // Key Metrics Section
  doc.setFontSize(16);
  doc.setTextColor(34, 139, 34);
  doc.text('Key Metrics', 20, 80);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const metrics = [
    ['Recommended System Size', `${results.recommendedSystemSize} kWp`],
    ['Number of Panels', `${results.numberOfPanels} panels`],
    ['Annual Generation', `${results.estimatedAnnualGeneration.toLocaleString()} kWh`],
    ['Annual Savings', `£${Math.round(results.totalAnnualBenefit)}`],
    ['Payback Period', `${results.paybackPeriod.toFixed(1)} years`],
    ['Estimated System Cost', `£${results.estimatedSystemCost.toLocaleString()}`],
  ];

  let yPos = 95;
  metrics.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPos);
    doc.text(value, 120, yPos);
    yPos += 10;
  });

  // Financial Summary
  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(34, 139, 34);
  doc.text('Financial Summary', 20, yPos);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  const financials = [
    ['Savings from Self-Consumption', `£${Math.round(results.annualSavings)}/year`],
    ['SEG Export Earnings', `£${Math.round(results.annualExportEarnings)}/year`],
    ['Total Annual Benefit', `£${Math.round(results.totalAnnualBenefit)}/year`],
    ['25-Year Return', `£${Math.round(results.roi25Years).toLocaleString()}`],
  ];

  financials.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPos);
    doc.text(value, 120, yPos);
    yPos += 10;
  });

  // Environmental Impact
  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(34, 139, 34);
  doc.text('Environmental Impact', 20, yPos);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  const environmental = [
    ['CO2 Saved Annually', `${Math.round(results.co2SavedAnnually)} kg`],
    ['CO2 Saved Over 25 Years', `${(results.co2Saved25Years / 1000).toFixed(1)} tonnes`],
    ['Equivalent Trees Planted', `${Math.round(results.co2Saved25Years / 21)} trees`],
  ];

  environmental.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPos);
    doc.text(value, 120, yPos);
    yPos += 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Estimates based on MCS methodology and Ofgem Q1 2026 energy prices.', 20, 270);
  doc.text(
    'Actual results may vary based on installation, local conditions, and usage patterns.',
    20,
    276
  );
  doc.text('SolarQuote UK - www.solarquote.co.uk', 20, 285);

  return doc.output('arraybuffer');
}

/**
 * POST /api/report
 * Generate PDF report from calculation results
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { results, postcode } = body as {
      results: CalculatorResults;
      postcode: string;
    };

    if (!results || !postcode) {
      return NextResponse.json(
        { success: false, error: 'Missing results or postcode' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = generatePdfReport(results, postcode);

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="solar-quote-${postcode.replace(/\s/g, '-')}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('[PDF Generation Error]', error);

    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/report
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
