# UK GDPR Compliant Lead Capture Implementation Guide

## Overview

This guide covers UK GDPR compliance requirements for lead capture forms, explicit consent mechanisms, and data handling best practices for solar quote calculators.

---

## 1. UK GDPR Compliance Requirements

### Legal Basis for Processing

Under UK GDPR (Articles 6 & 7), you need:

- **Explicit Consent** for marketing communications
- **Legitimate Interest** for initial quote provision (if applicable)
- **Data Processing Agreement** (DPA) with any third-party processors

### Key Requirements

1. **Lawful Basis**: Marketing requires explicit opt-in consent (not pre-ticked)
2. **Transparency**: Clear information about what data you collect and why
3. **Granularity**: Separate consents for different purposes (marketing vs. quote)
4. **Record-Keeping**: Document when and how consent was obtained
5. **User Rights**: Provide easy unsubscribe/data deletion options
6. **Data Security**: Encrypt data in transit and at rest

---

## 2. Checkbox Text - GDPR Compliant

### Marketing Consent Checkbox (Recommended)

```
Send me solar savings information and quotes

We'll contact you with personalised solar quotes, installation options, and savings
estimates. You can unsubscribe at any time using links in our emails or by contacting
us directly.
```

**Why This Works:**

- Uses active voice ("Send me")
- Clearly describes what will happen
- Explicitly mentions unsubscribe options
- Not pre-ticked (explicit opt-in)
- Granular (separate from privacy acceptance)

### Privacy Acceptance Checkbox (Required)

```
I accept the Privacy Policy

I understand my personal data will be processed as described in the Privacy Policy.
We collect and use your data in accordance with UK GDPR and Data Protection Act 2018
to provide quotes and follow up on interest.
```

**Why This Works:**

- Clear reference to privacy policy
- Mentions specific legal basis (UK GDPR, DPA 2018)
- Explains purpose of processing
- Checkbox is not pre-selected
- Links to full privacy policy

### Alternative Compliant Marketing Text

```
I consent to receive marketing communications

I would like to receive marketing emails about solar products and services, including
quotes, product updates, and promotional offers. I understand I can withdraw this
consent at any time by clicking "unsubscribe" in emails or contacting our team.
```

---

## 3. What Must Be Recorded for Consent

### Consent Record Structure (Implement in Backend)

```typescript
interface ConsentRecord {
  // User identification
  leadId: string;
  email: string;

  // Consent details
  marketingConsent: boolean;
  privacyAcceptance: boolean;

  // Compliance audit trail
  consentTimestamp: string; // ISO 8601: "2026-01-08T14:32:00Z"
  ipAddress: string; // For audit trail
  userAgent: string; // Browser info
  consentVersion: string; // "1.0" - allows versioning changes

  // How consent was obtained
  consentMethod: 'web_form' | 'email' | 'phone';
  formUrl?: string; // Page URL where consent given

  // Withdrawal tracking (optional)
  withdrawalTimestamp?: string;
}
```

### Database Schema

```sql
CREATE TABLE consent_records (
  id UUID PRIMARY KEY,
  lead_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  marketing_consent BOOLEAN NOT NULL,
  privacy_acceptance BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(10),
  consent_method VARCHAR(50),
  form_url TEXT,
  withdrawal_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX idx_email_consent ON consent_records(email);
CREATE INDEX idx_consent_timestamp ON consent_records(consent_timestamp);
```

### What NOT to Record

- ❌ Consent should NOT be pre-ticked in the form
- ❌ Don't hide consent checkboxes in T&Cs
- ❌ Don't mix consent types in a single checkbox
- ❌ Don't make consent mandatory for quote calculation

---

## 4. Email Validation - RFC 5322

### Recommended Pattern (Practical)

```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Validates:**

- ✓ user@example.com
- ✓ john.smith+solar@company.co.uk
- ✓ lead-123@test-domain.com

**Rejects:**

- ❌ invalid@
- ❌ @example.com
- ❌ user@.com
- ❌ user name@example.com

### Strict RFC 5322 Pattern

Use if you need comprehensive validation:

```typescript
const EMAIL_REGEX_STRICT =
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
```

### Implementation

```typescript
function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

// For form submission - also validate server-side!
if (!validateEmail(formData.email)) {
  errors.email = 'Please enter a valid email address';
}
```

---

## 5. UK Phone Number Validation

### Regex Pattern (All Common Formats)

```typescript
const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$/;
```

**Accepts:**

- ✓ 020 1234 5678 (London with spaces)
- ✓ 02012345678 (London no spaces)
- ✓ +44 20 1234 5678 (International format with spaces)
- ✓ +442012345678 (International no spaces)
- ✓ (020) 1234 5678 (Brackets)
- ✓ 01632 960001 (Other areas)
- ✓ +44 7700 900000 (Mobile numbers)

**Rejects:**

- ❌ 020123 (Too short)
- ❌ 44201234567890 (Missing + prefix)
- ❌ 123 (Invalid format)

### Implementation

```typescript
function validateUKPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return true; // Phone is optional
  }

  // Remove common separators
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return UK_PHONE_REGEX.test(cleaned);
}

// Sanitize for storage
function sanitizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

// Format for display
function formatPhoneForDisplay(phone: string): string {
  const cleaned = sanitizePhone(phone);
  if (cleaned.startsWith('+44')) {
    return cleaned.replace(/(\+44)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  if (cleaned.startsWith('0')) {
    return cleaned.replace(/^0/, '+44 ').replace(/(\+44)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  return cleaned;
}
```

---

## 6. Best Practices for Lead Capture Modals

### UX Best Practices

1. **Timing**: Show modal after calculator completion, not on page load
2. **Clarity**: Use simple, jargon-free language
3. **Mobile**: Ensure modal is fully usable on mobile devices
4. **Escape Route**: Allow closing without capturing (but track abandonment)
5. **Progress Indication**: Show what happens next ("Quote within 24 hours")

### Implementation Example

```tsx
// Show modal after results calculated
function ResultsPage() {
  const [showLeadModal, setShowLeadModal] = useState(false);

  const handleCalculationComplete = async () => {
    // Allow user to view results for 3 seconds before showing modal
    setTimeout(() => setShowLeadModal(true), 3000);
  };

  return (
    <>
      <ResultsDisplay />
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSubmit={handleLeadSubmit}
        calculationId={calculationId}
      />
    </>
  );
}
```

### Validation Best Practices

1. **Client-side validation**: For UX (instant feedback)
2. **Server-side validation**: For security (always required)
3. **Email verification**: Send confirmation email before adding to mailing list
4. **Phone double-entry**: Optional, but improves data quality
5. **Rate limiting**: Prevent form abuse (5 submissions per IP/hour)

### Data Handling

```typescript
// Backend: Verify consent before processing
async function submitLead(contact: LeadContact, consent: LeadConsent) {
  // Validate consent was provided
  if (!consent.marketingConsent || !consent.privacyAcceptance) {
    throw new Error('All consents must be accepted');
  }

  // Store with audit trail
  const consentRecord = {
    leadId: generateId(),
    email: contact.email.toLowerCase(),
    marketingConsent: true,
    privacyAcceptance: true,
    consentTimestamp: new Date().toISOString(),
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };

  await database.consentRecords.insert(consentRecord);

  // Send confirmation email
  await sendConfirmationEmail(contact.email);

  // Add to CRM/marketing system
  await crm.addLead({
    email: contact.email,
    phone: contact.phone,
    name: contact.name,
    source: 'solar_calculator',
    timestamp: new Date(),
  });
}
```

### Privacy Policy Requirements

Your privacy policy must include:

1. **Data Controller**: Who collects the data
2. **Data Types**: What personal data is collected
3. **Legal Basis**: Why you process it (consent, legitimate interest)
4. **Recipients**: Who data is shared with (e.g., installers, CRM)
5. **Retention**: How long data is kept
6. **Rights**: User rights (access, deletion, export, withdraw consent)
7. **Contact**: How to exercise rights (email/phone)
8. **Complaints**: How to contact ICO if unhappy

### Compliance Checklist

- [ ] Privacy policy published and linked in modal
- [ ] Consent checkboxes not pre-ticked
- [ ] Separate checkboxes for marketing and privacy
- [ ] Clear, jargon-free consent text
- [ ] Consent timestamp recorded
- [ ] User IP and browser info logged
- [ ] Server-side validation of all fields
- [ ] Secure data transmission (HTTPS)
- [ ] Data encrypted at rest
- [ ] Easy unsubscribe mechanism
- [ ] Data deletion requests handled within 30 days
- [ ] No third-party cookies without consent

---

## 7. Sample Privacy Policy Section

```markdown
## Data Collection for Solar Quotes

**What data we collect:**

- Name (optional)
- Email address (required)
- Phone number (optional)
- Roof details and energy usage (for quote calculation)

**Why we collect it:**

- To provide you with a personalised solar quote
- To contact you with installation options and updates (with your consent)

**How long we keep it:**

- Quote calculation data: 12 months
- Contact details: Until you request deletion or 3 years of no contact
- Marketing records: Until you unsubscribe

**Your rights:**

- Access your data: email data@company.com
- Delete your data: reply "STOP" to marketing emails or contact us
- Export your data: We'll provide it within 30 days
- Withdraw consent: Unsubscribe link in every email

**Questions?**
Contact: privacy@company.com or call 0XXX XXX XXXX
```

---

## 8. Regulatory References

**UK GDPR Articles:**

- Article 6: Lawfulness of Processing (Consent)
- Article 7: Conditions for Consent
- Article 14: Information to be Provided Where Data Not Obtained From User
- Article 21: Right to Object
- Article 15: Right of Access by Data Subject

**UK Data Protection Act 2018:**

- Schedule 1: Lawfulness of Processing

**ICO Guidance:**

- https://ico.org.uk/about-the-ico/what-we-do/
- https://ico.org.uk/for-organisations/guidance-index/guide-to-the-general-data-protection-regulation-gdpr/

**Information Commissioner's Office Contact:**

- Website: ico.org.uk
- Phone: 0303 123 1113 (local rate)

---

## Integration with Solar Calculator

### Add Modal to Results Page

```tsx
// src/app/results/page.tsx
'use client';

import { useState } from 'react';
import { LeadCaptureModal } from '@/components/modals/LeadCaptureModal';
import type { LeadContact, LeadConsent } from '@/types/solar';

export default function ResultsPage() {
  const [showLeadModal, setShowLeadModal] = useState(true);

  const handleLeadSubmit = async (contact: LeadContact, consent: LeadConsent) => {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact,
        consent,
        calculationId: sessionStorage.getItem('calculationId'),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit lead');
    }

    // Show success message
    setShowLeadModal(false);
  };

  return (
    <>
      {/* Results content */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSubmit={handleLeadSubmit}
        calculationId={sessionStorage.getItem('calculationId') || ''}
      />
    </>
  );
}
```

---

## Support & Updates

This guide covers UK GDPR as of January 2026. UK GDPR regulations may change.

For the latest guidance:

- Visit: https://ico.org.uk
- Subscribe to ICO updates for regulatory changes
- Review your privacy policy annually
- Conduct regular data protection impact assessments (DPIA)
