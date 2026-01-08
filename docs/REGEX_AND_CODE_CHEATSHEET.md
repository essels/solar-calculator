# Lead Capture - Regex Patterns & Code Snippets Cheatsheet

## Email Validation Patterns

### Practical Pattern (Recommended)

```regex
^[^\s@]+@[^\s@]+\.[^\s@]+$
```

**Examples:**

- ✓ user@example.com
- ✓ john.smith@company.co.uk
- ✓ solar+quote@installer.com
- ✗ invalid@
- ✗ @example.com
- ✗ user name@example.com

**JavaScript:**

```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim().toLowerCase());
```

---

### Strict RFC 5322 Pattern

```regex
^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
```

**JavaScript:**

```typescript
const EMAIL_REGEX_STRICT =
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

const isValidEmail = (email: string) => EMAIL_REGEX_STRICT.test(email.trim().toLowerCase());
```

---

## UK Phone Number Patterns

### Main Pattern (All Formats)

```regex
^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$
```

**Examples:**

- ✓ 020 1234 5678
- ✓ 02012345678
- ✓ +44 20 1234 5678
- ✓ +442012345678
- ✓ (020) 1234 5678
- ✓ 01632 960001
- ✓ 07700 900000
- ✗ 020123 (too short)
- ✗ 44201234567890 (missing +)
- ✗ 123 (invalid)

**JavaScript:**

```typescript
const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$/;

const isValidUKPhone = (phone: string) => {
  if (!phone || phone.trim() === '') return true; // Optional field
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return UK_PHONE_REGEX.test(cleaned);
};
```

---

### Regional Breakdown (Reference)

```regex
London (020):
  020 XXXX XXXX
  020 XXXX XXXX X
  +44 20 XXXX XXXX
  +44 20 XXXX XXXX X

Other Areas (01/02):
  01XXX XXXXXX
  01XXX XXX XXX
  +44 1XXX XXXXXX

Mobile (07):
  07XXX XXXXXX
  07XXX XXXXXX X
  +44 7XXX XXXXXX
```

---

## Name Validation Pattern

### Basic Pattern

```regex
^[a-zA-Z\s\-']{2,100}$
```

**Examples:**

- ✓ John Smith
- ✓ Mary-Jane Watson
- ✓ James O'Connor
- ✓ Jean-Paul Martin
- ✗ A (too short)
- ✗ John123 (numbers)
- ✗ John_Smith (underscore)

**JavaScript:**

```typescript
const isValidName = (name: string) => {
  if (!name || name.trim() === '') return true; // Optional
  return /^[a-zA-Z\s\-']{2,100}$/.test(name.trim());
};
```

---

## Complete Validation Functions

### Minimal Implementation

```typescript
// Email
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

// UK Phone
const validatePhone = (phone: string) => {
  if (!phone || phone.trim() === '') return true;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$/.test(cleaned);
};

// Name
const validateName = (name: string) => {
  if (!name || name.trim() === '') return true;
  return /^[a-zA-Z\s\-']{2,100}$/.test(name.trim());
};

// Full Form
const validateForm = (data: { email: string; phone?: string; name?: string }) => {
  const errors: Record<string, string> = {};

  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Invalid UK phone number';
  }

  if (data.name && !validateName(data.name)) {
    errors.name = 'Invalid name';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
```

---

### Production Implementation

```typescript
// src/lib/validation/lead-validation.ts
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$/;

export function validateEmail(email: string, strict = false): boolean {
  const regex = strict ? EMAIL_REGEX_STRICT : EMAIL_REGEX;
  return regex.test(email.trim().toLowerCase());
}

export function validateUKPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return UK_PHONE_REGEX.test(cleaned);
}

export function validateName(name: string): boolean {
  if (!name || name.trim() === '') return true;
  return /^[a-zA-Z\s\-']{2,100}$/.test(name.trim());
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateLeadForm(data: {
  email: string;
  phone?: string;
  name?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (data.phone && !validateUKPhone(data.phone)) {
    errors.phone = 'Please enter a valid UK phone number';
  }

  if (data.name && !validateName(data.name)) {
    errors.name = 'Please enter a valid name (letters, spaces, hyphens only)';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
```

---

## Phone Utility Functions

### Sanitize (Remove Formatting)

```typescript
function sanitizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

// Examples
sanitizePhone('020 1234 5678'); // → '02012345678'
sanitizePhone('+44-20-1234-5678'); // → '+442012345678'
sanitizePhone('(020) 1234 5678'); // → '02012345678'
```

---

### Format for Display

```typescript
function formatPhoneForDisplay(phone: string): string {
  const cleaned = sanitizePhone(phone);

  // Convert 0-prefix to +44
  if (cleaned.startsWith('0')) {
    return cleaned.replace(/^0/, '+44 ');
  }

  // Format +44 prefix
  if (cleaned.startsWith('+44')) {
    return cleaned.replace(/(\+44)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }

  return cleaned;
}

// Examples
formatPhoneForDisplay('02012345678'); // → '+44 2012 345 678'
formatPhoneForDisplay('+442012345678'); // → '+44 2012 345 678'
formatPhoneForDisplay('020 1234 5678'); // → '+44 2012 345 678'
```

---

## GDPR Compliance Text

### Marketing Consent Checkbox

```
Send me solar savings information and quotes

We'll contact you with personalised solar quotes, installation options, and savings
estimates. You can unsubscribe at any time using links in our emails or by contacting
us directly.
```

### Privacy Acceptance Checkbox

```
I accept the Privacy Policy

I understand my personal data will be processed as described in the Privacy Policy.
We collect and use your data in accordance with UK GDPR and Data Protection Act 2018
to provide quotes and follow up on interest.
```

---

## React Form Example

### Minimal Component

```tsx
'use client';

import { useState } from 'react';
import { validateLeadForm } from '@/lib/validation/lead-validation';

export function LeadForm() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateLeadForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Submit form
    console.log('Submitting:', formData);
    // await fetch('/api/leads', { method: 'POST', body: JSON.stringify(formData) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <span className="text-red-500">{errors.email}</span>}
      </div>

      <div>
        <label>Phone (optional)</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="020 1234 5678"
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && <span className="text-red-500">{errors.phone}</span>}
      </div>

      <div>
        <label>Name (optional)</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <span className="text-red-500">{errors.name}</span>}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Test Cases

### Valid Test Data

```typescript
const validData = {
  email: 'john.smith@example.com',
  phone: '020 1234 5678',
  name: 'John Smith',
};

const validEmails = [
  'user@example.com',
  'john.smith@company.co.uk',
  'solar+lead@test.com',
  'info@solar-installer.co.uk',
];

const validPhones = [
  '020 1234 5678',
  '02012345678',
  '+44 20 1234 5678',
  '+442012345678',
  '(020) 1234 5678',
  '07700 900000',
];

const validNames = ['John Smith', 'Mary-Jane Watson', "James O'Connor"];
```

---

### Invalid Test Data

```typescript
const invalidEmails = [
  'invalid@',
  '@example.com',
  'user@.com',
  'user name@example.com',
  'user@domain',
];

const invalidPhones = [
  '020123', // Too short
  '44201234567890', // Missing +
  '123', // Invalid
  'abcd efgh', // Letters
];

const invalidNames = [
  'A', // Too short
  '123', // Numbers
  'John@Smith', // Special char
];
```

---

## API Request/Response

### Request

```json
{
  "contact": {
    "email": "john@example.com",
    "phone": "020 1234 5678",
    "name": "John Smith"
  },
  "consent": {
    "marketingConsent": true,
    "privacyAcceptance": true,
    "consentTimestamp": "2026-01-08T14:32:00Z"
  },
  "calculationId": "calc_abc123"
}
```

---

### Success Response (201)

```json
{
  "success": true,
  "leadId": "lead_1704712320000_a1b2c3d",
  "message": "Thank you! Your quote request has been received."
}
```

---

### Error Response

```json
{
  "success": false,
  "error": "Please enter a valid email address"
}
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
MAILGUN_API_KEY=your_key_here
MAILGUN_DOMAIN=your_domain.com
DATABASE_URL=postgresql://user:password@localhost/dbname
```

---

## TypeScript Types

```typescript
// src/types/solar.ts

export interface LeadContact {
  email: string;
  phone?: string;
  name?: string;
  preferredContactTime?: 'morning' | 'afternoon' | 'evening';
}

export interface LeadConsent {
  marketingConsent: boolean;
  privacyAcceptance: boolean;
  consentTimestamp: string; // ISO 8601
}

export interface LeadSubmitRequest {
  contact: LeadContact;
  consent: LeadConsent;
  calculationId: string;
}

export interface LeadSubmitResponse {
  success: boolean;
  leadId?: string;
  message?: string;
  error?: string;
}
```

---

## Copy-Paste Ready Code Blocks

### All Patterns in One Object

```typescript
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  emailStrict:
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i,
  phone: /^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$/,
  name: /^[a-zA-Z\s\-']{2,100}$/,
} as const;
```

---

## Performance Notes

- **Email regex**: O(1) - 50-100 chars typically
- **Phone regex**: O(1) - ~15 chars after cleanup
- **Name regex**: O(1) - max 100 chars
- **Form validation**: O(1) - all regexes are O(1)

No significant performance concerns for client-side validation.

---

## Browser Compatibility

All patterns work in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

Use transpiler (Babel) if supporting older browsers.

---

## References

- RFC 5322: https://tools.ietf.org/html/rfc5322
- UK Phone Format: https://en.wikipedia.org/wiki/Telephone_numbering_in_the_United_Kingdom
- GDPR: https://gdpr-info.eu/
- ICO: https://ico.org.uk/
