# Lead Capture - Quick Reference Guide

## Files Created

### 1. Validation Library

**File:** `/src/lib/validation/lead-validation.ts`

Key exports:

- `EMAIL_REGEX` - Practical RFC 5322 pattern
- `EMAIL_REGEX_STRICT` - Comprehensive RFC 5322 pattern
- `UK_PHONE_REGEX` - UK phone number validation
- `validateEmail()` - Email validation function
- `validateUKPhone()` - UK phone validation function
- `validateLeadForm()` - Complete form validation
- `sanitizePhone()` - Remove formatting
- `formatPhoneForDisplay()` - Format for display

### 2. Modal Component

**File:** `/src/components/modals/LeadCaptureModal.tsx`

Props:

```typescript
interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: LeadContact, consent: LeadConsent) => Promise<void>;
  calculationId: string;
}
```

Features:

- RFC 5322 email validation
- UK phone validation
- GDPR-compliant consent checkboxes
- Real-time error display
- Mobile responsive

### 3. API Endpoint

**File:** `/src/app/api/leads/route.ts`

Handles:

- Lead submission with validation
- Consent recording
- Rate limiting (5 per hour per IP)
- Email confirmation (template included)
- Error handling

### 4. Integration Example

**File:** `/src/components/examples/LeadCaptureIntegration.tsx`

Shows how to:

- Display modal on results page
- Handle submission
- Show success/error states
- Track analytics
- Pass data to API

### 5. Complete Guides

- `/docs/UK_GDPR_LEAD_CAPTURE.md` - Full compliance guide
- `/docs/LEAD_CAPTURE_QUICK_REFERENCE.md` - This file

---

## Quick Setup

### 1. Add Modal to Results Page

```tsx
// src/app/results/page.tsx
'use client';

import { LeadCaptureIntegrationExample } from '@/components/examples/LeadCaptureIntegration';

export default function ResultsPage() {
  return (
    <main>
      <ResultsContent />
      <LeadCaptureIntegrationExample
        calculationId={sessionStorage.getItem('calculationId') || ''}
      />
    </main>
  );
}
```

### 2. Configure API Endpoint

Update `/src/app/api/leads/route.ts`:

- Replace console.log calls with actual database calls
- Integrate with your email service (SendGrid, Mailgun, etc.)
- Connect to your CRM system

### 3. Create Privacy Policy Page

```tsx
// src/app/privacy-policy/page.tsx
export default function PrivacyPolicy() {
  return (
    <main>
      <h1>Privacy Policy</h1>
      {/* Include the content from section 7 of UK_GDPR_LEAD_CAPTURE.md */}
    </main>
  );
}
```

---

## Validation Patterns

### Email

```typescript
// Practical (99.99% of emails)
/^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Strict RFC 5322 (use if needed)
/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
```

### UK Phone

```typescript
/^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$/;

// Accepts:
// 020 1234 5678, 02012345678, +44 20 1234 5678, +442012345678

// Optional: Remove separators before validating
phone.replace(/[\s\-()]/g, '');
```

### Name

```typescript
/^[a-zA-Z\s\-']{2,100}$/;
```

---

## GDPR Compliance Checkboxes

### Marketing Consent (Required)

```
Send me solar savings information and quotes

We'll contact you with personalised solar quotes, installation options, and savings
estimates. You can unsubscribe at any time using links in our emails or by contacting
us directly.
```

### Privacy Acceptance (Required)

```
I accept the Privacy Policy

I understand my personal data will be processed as described in the Privacy Policy.
We collect and use your data in accordance with UK GDPR and Data Protection Act 2018
to provide quotes and follow up on interest.
```

---

## Consent Record Structure

What to save in database:

```typescript
{
  leadId: string;           // Unique identifier
  email: string;            // Lowercased
  marketingConsent: boolean;
  privacyAcceptance: boolean;
  consentTimestamp: string; // ISO 8601: "2026-01-08T14:32:00Z"
  ipAddress: string;        // For audit trail
  userAgent: string;        // Browser info
  consentVersion: string;   // "1.0"
  consentMethod: string;    // "web_form"
  withdrawalTimestamp?: string; // If withdrawn
}
```

---

## Usage Examples

### Basic Form Validation

```typescript
import { validateLeadForm } from '@/lib/validation/lead-validation';

const result = validateLeadForm({
  email: 'user@example.com',
  phone: '020 1234 5678',
  name: 'John Smith',
});

if (result.isValid) {
  // Submit
} else {
  console.error(result.errors);
  // { email: "...", phone: "...", name: "..." }
}
```

### Email Validation Only

```typescript
import { validateEmail } from '@/lib/validation/lead-validation';

if (validateEmail('user@example.com')) {
  // Valid
}
```

### Phone Validation Only

```typescript
import { validateUKPhone } from '@/lib/validation/lead-validation';

if (validateUKPhone('020 1234 5678')) {
  // Valid
}
```

### Format Phone for Display

```typescript
import { formatPhoneForDisplay } from '@/lib/validation/lead-validation';

const formatted = formatPhoneForDisplay('02012345678');
// Returns: "+44 2012 345 678"
```

---

## API Endpoint

### POST /api/leads

**Request:**

```json
{
  "contact": {
    "email": "user@example.com",
    "phone": "020 1234 5678",
    "name": "John Smith"
  },
  "consent": {
    "marketingConsent": true,
    "privacyAcceptance": true,
    "consentTimestamp": "2026-01-08T14:32:00Z"
  },
  "calculationId": "calc_123456"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "leadId": "lead_1234567890_abc123def",
  "message": "Thank you! Your quote request has been received."
}
```

**Error Response (400/429/500):**

```json
{
  "success": false,
  "error": "Invalid email address"
}
```

**Rate Limiting:**

- 5 submissions per hour per IP
- Returns 429 if exceeded

---

## Modal Integration

### Show Modal After 3 Seconds

```tsx
<LeadCaptureIntegrationExample
  calculationId={id}
  showImmediately={false}
  onLeadSubmitted={(leadId) => {
    console.log('Lead:', leadId);
  }}
/>
```

### Show Modal Immediately

```tsx
<LeadCaptureIntegrationExample calculationId={id} showImmediately={true} />
```

---

## Database Schema (Example)

### Leads Table

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  name VARCHAR(100),
  calculation_id VARCHAR(255),
  source_ip INET,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(email),
  INDEX(created_at)
);
```

### Consent Records Table

```sql
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  marketing_consent BOOLEAN NOT NULL,
  privacy_acceptance BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(10),
  consent_method VARCHAR(50),
  withdrawal_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  INDEX(email),
  INDEX(consent_timestamp)
);
```

---

## Testing

### Valid Inputs

```typescript
const validData = {
  email: 'test@example.com',
  phone: '020 1234 5678',
  name: 'John Smith',
};
```

### Invalid Inputs

```typescript
const invalidData = [
  { email: 'invalid@', phone: '', name: '' }, // Bad email
  { email: 'user@test.com', phone: '123', name: '' }, // Bad phone
  { email: 'user@test.com', phone: '', name: '123' }, // Bad name
];
```

---

## Regulatory Resources

- **UK Information Commissioner's Office (ICO)**
  - Website: https://ico.org.uk
  - Guidance: https://ico.org.uk/for-organisations/guide-to-the-general-data-protection-regulation-gdpr/

- **UK GDPR Articles**
  - Article 6: Lawfulness of Processing
  - Article 7: Conditions for Consent
  - Article 15: Right of Access

- **UK Data Protection Act 2018**
  - Schedule 1: Lawfulness of Processing

---

## Troubleshooting

### Phone validation failing for valid numbers

- Remove spaces and hyphens: `phone.replace(/[\s\-()]/g, '')`
- Check for +44 prefix vs 0 prefix
- Ensure 10-13 digits after country code

### Email validation too strict

- Use practical pattern instead of strict RFC 5322
- Consider email verification via confirmation link

### Modal not showing on mobile

- Check z-index (set to 50 in code)
- Ensure viewport meta tag is set
- Test modal.scrollable class

### Rate limiting too strict

- Adjust limit in `/src/app/api/leads/route.ts`
- Current: 5 submissions per hour per IP
- Implement with Redis in production

---

## Next Steps

1. Integrate with your email service
2. Connect API to database
3. Create email confirmation template
4. Set up CRM integration
5. Add unsubscribe management
6. Implement data deletion requests
7. Regular privacy policy reviews
8. Monitor ICO updates

---

## Support

For UK GDPR compliance questions:

- Contact: ICO@ico.org.uk
- Phone: 0303 123 1113

For implementation help:

- Check the full guide: `docs/UK_GDPR_LEAD_CAPTURE.md`
- Review example: `src/components/examples/LeadCaptureIntegration.tsx`
