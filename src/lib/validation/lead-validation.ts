/**
 * Lead Capture Validation Utilities
 * RFC 5322 compliant email validation and UK phone number validation
 */

/**
 * RFC 5322 Email Validation
 * Simplified pattern that covers 99.99% of valid email addresses
 * while remaining practical for web forms
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RFC 5322 Email Validation (Strict)
 * More comprehensive pattern - use if you need stricter validation
 */
export const EMAIL_REGEX_STRICT =
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

/**
 * UK Phone Number Validation
 * Accepts all common UK formats:
 * - Standard: 020 1234 5678, 02012345678
 * - With +44: +44 20 1234 5678, +441234567890
 * - Alternative: (020) 1234 5678
 */
export const UK_PHONE_REGEX = /^(?:(?:\+44\s?|0)(?:[\d\s]{9,13})|0\d{10}|\+44\d{10,13})$/;

/**
 * Validate email address
 * @param email Email address to validate
 * @param strict Use strict RFC 5322 validation (default: false)
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string, strict = false): boolean {
  const regex = strict ? EMAIL_REGEX_STRICT : EMAIL_REGEX;
  return regex.test(email.trim().toLowerCase());
}

/**
 * Validate UK phone number
 * @param phone Phone number to validate (can be empty/optional)
 * @returns true if valid or empty, false if present but invalid
 */
export function validateUKPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return true; // Phone is optional
  }

  // Remove common separators for validation
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return UK_PHONE_REGEX.test(cleaned);
}

/**
 * Validate name field
 * @param name Name to validate (optional field)
 * @returns true if valid or empty
 */
export function validateName(name: string): boolean {
  if (!name || name.trim() === '') {
    return true; // Name is optional
  }

  // Name should be 2-100 characters, letters/spaces/hyphens only
  return /^[a-zA-Z\s\-']{2,100}$/.test(name.trim());
}

/**
 * Sanitize phone number for storage
 * Removes formatting and normalizes to standard format
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

/**
 * Format phone number for display
 * Converts to UK standard format: +44 XXXX XXX XXXX
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = sanitizePhone(phone);

  if (cleaned.startsWith('+44')) {
    return cleaned.replace(/(\+44)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }

  if (cleaned.startsWith('0')) {
    return cleaned.replace(/^0/, '+44 ').replace(/(\+44)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }

  return cleaned;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate complete lead form
 */
export function validateLeadForm(data: {
  email: string;
  phone?: string;
  name?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Email validation (required)
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation (optional)
  if (data.phone && !validateUKPhone(data.phone)) {
    errors.phone = 'Please enter a valid UK phone number';
  }

  // Name validation (optional)
  if (data.name && !validateName(data.name)) {
    errors.name = 'Please enter a valid name (letters, spaces, hyphens only)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
