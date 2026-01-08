/**
 * Lead Submission API Endpoint
 * Handles UK GDPR compliant lead capture with consent recording
 */

import { type NextRequest, NextResponse } from 'next/server';
import { validateEmail, validateUKPhone } from '@/lib/validation/lead-validation';
import type { LeadContact, LeadConsent, LeadSubmitRequest } from '@/types/solar';

/**
 * Rate limiting helper
 * In production, use a proper rate limiter like Redis
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }

  if (record.count >= 5) {
    return false; // 5 submissions per hour limit
  }

  record.count++;
  return true;
}

/**
 * Validate lead submission
 */
function validateLeadSubmission(
  contact: LeadContact,
  consent: LeadConsent,
  calculationId: string
): { valid: boolean; error?: string } {
  // Email validation (required)
  if (!contact.email || !validateEmail(contact.email)) {
    return { valid: false, error: 'Invalid email address' };
  }

  // Phone validation (optional but must be valid if provided)
  if (contact.phone && !validateUKPhone(contact.phone)) {
    return { valid: false, error: 'Invalid UK phone number' };
  }

  // Consent validation
  if (!consent.privacyAcceptance) {
    return { valid: false, error: 'Privacy policy acceptance is required' };
  }

  if (!consent.marketingConsent) {
    return { valid: false, error: 'Marketing consent is required' };
  }

  // Calculation ID validation
  if (!calculationId || typeof calculationId !== 'string') {
    return { valid: false, error: 'Invalid calculation ID' };
  }

  // Name validation (optional)
  if (contact.name && !/^[a-zA-Z\s\-']{2,100}$/.test(contact.name.trim())) {
    return { valid: false, error: 'Invalid name format' };
  }

  return { valid: true };
}

/**
 * Store consent record (example implementation)
 * In production, use your database
 */
async function storeConsentRecord(
  leadId: string,
  email: string,
  consentData: LeadConsent,
  ip: string | null,
  ua: string | null
) {
  // Example: Store in database
  // In production, use a proper database
  console.log('[Consent Record]', {
    leadId,
    email,
    marketingConsent: consentData.marketingConsent,
    privacyAcceptance: consentData.privacyAcceptance,
    consentTimestamp: consentData.consentTimestamp,
    ipAddress: ip,
    userAgent: ua,
  });

  return true;
}

/**
 * Send confirmation email
 */
async function sendConfirmationEmail(contact: LeadContact): Promise<boolean> {
  // Example: Integrate with email service (SendGrid, Mailgun, etc.)
  // const mailgun = mg({...});
  // await mailgun.messages.create('yourdomain.com', {
  //   from: 'noreply@yourdomain.com',
  //   to: contact.email,
  //   subject: 'Your Solar Quote Request',
  //   html: `...`,
  // });

  console.log('[Email Sent]', {
    to: contact.email,
    subject: 'Your Solar Quote Request',
    timestamp: new Date().toISOString(),
  });

  return true;
}

/**
 * Create lead in CRM/database
 */
async function createLead(
  contact: LeadContact,
  _consent: LeadConsent,
  calculationId: string,
  _ipAddress: string | null
): Promise<string> {
  // Generate lead ID
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  // Example: Store in database
  // const result = await db.leads.insert({
  //   id: leadId,
  //   email: contact.email.toLowerCase(),
  //   phone: contact.phone,
  //   name: contact.name,
  //   calculationId,
  //   sourceIp: ipAddress,
  //   createdAt: new Date(),
  //   status: 'new',
  // });

  console.log('[Lead Created]', {
    leadId,
    email: contact.email,
    phone: contact.phone,
    calculationId,
    createdAt: new Date().toISOString(),
  });

  return leadId;
}

/**
 * POST /api/leads
 * Submit a new lead with consent
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    const { contact, consent, calculationId } = body as LeadSubmitRequest;

    // Validate input
    const validation = validateLeadSubmission(contact, consent, calculationId);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Create lead
    const leadId = await createLead(contact, consent, calculationId, ip !== 'unknown' ? ip : null);

    // Store consent record (audit trail)
    await storeConsentRecord(
      leadId,
      contact.email,
      consent,
      ip !== 'unknown' ? ip : null,
      request.headers.get('user-agent')
    );

    // Send confirmation email
    try {
      await sendConfirmationEmail(contact);
    } catch (error) {
      // Log email error but don't fail the request
      console.error('[Email Error]', error);
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        leadId,
        message: 'Thank you! Your quote request has been received.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Lead Submission Error]', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process your request. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/leads
 * CORS preflight request handler
 */
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
