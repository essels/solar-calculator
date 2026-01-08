/**
 * Unit tests for lead validation functions
 */

import {
  validateEmail,
  validateUKPhone,
  validateName,
  sanitizePhone,
  EMAIL_REGEX,
  UK_PHONE_REGEX,
} from '../lead-validation';

describe('Email Validation', () => {
  describe('EMAIL_REGEX', () => {
    it('should match valid email formats', () => {
      expect('test@example.com').toMatch(EMAIL_REGEX);
      expect('user.name@domain.co.uk').toMatch(EMAIL_REGEX);
      expect('user+tag@example.org').toMatch(EMAIL_REGEX);
      expect('a@b.co').toMatch(EMAIL_REGEX);
    });

    it('should not match invalid email formats', () => {
      expect('invalid').not.toMatch(EMAIL_REGEX);
      expect('@example.com').not.toMatch(EMAIL_REGEX);
      expect('test@').not.toMatch(EMAIL_REGEX);
      expect('test@.com').not.toMatch(EMAIL_REGEX);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });
});

describe('UK Phone Validation', () => {
  describe('UK_PHONE_REGEX', () => {
    it('should match UK landline numbers', () => {
      expect('02071234567').toMatch(UK_PHONE_REGEX);
      expect('0207 123 4567').toMatch(UK_PHONE_REGEX);
      expect('020 7123 4567').toMatch(UK_PHONE_REGEX);
    });

    it('should match UK mobile numbers', () => {
      expect('07700900123').toMatch(UK_PHONE_REGEX);
      expect('07700 900 123').toMatch(UK_PHONE_REGEX);
      expect('0770 0900 123').toMatch(UK_PHONE_REGEX);
    });

    it('should match +44 format numbers', () => {
      expect('+447700900123').toMatch(UK_PHONE_REGEX);
      expect('+44 7700 900 123').toMatch(UK_PHONE_REGEX);
    });
  });

  describe('validateUKPhone', () => {
    it('should return true for valid UK phones', () => {
      expect(validateUKPhone('07700900123')).toBe(true);
      expect(validateUKPhone('+447700900123')).toBe(true);
      expect(validateUKPhone('020 7123 4567')).toBe(true);
    });

    it('should return false for invalid phones', () => {
      expect(validateUKPhone('123')).toBe(false);
      expect(validateUKPhone('invalid')).toBe(false);
    });

    it('should return true for empty phones (optional field)', () => {
      expect(validateUKPhone('')).toBe(true);
    });
  });
});

describe('Name Validation', () => {
  describe('validateName', () => {
    it('should return true for valid names', () => {
      expect(validateName('John Smith')).toBe(true);
      expect(validateName('Mary')).toBe(true);
      expect(validateName('Jean-Pierre')).toBe(true);
    });

    it('should return false for invalid names', () => {
      expect(validateName('A')).toBe(false); // Too short
      expect(validateName('123')).toBe(false); // Numbers not allowed
    });

    it('should return true for empty names (optional field)', () => {
      expect(validateName('')).toBe(true);
    });
  });
});

describe('Phone Sanitization', () => {
  describe('sanitizePhone', () => {
    it('should remove spaces', () => {
      expect(sanitizePhone('07700 900 123')).toBe('07700900123');
    });

    it('should remove dashes', () => {
      expect(sanitizePhone('07700-900-123')).toBe('07700900123');
    });

    it('should remove parentheses', () => {
      expect(sanitizePhone('(020) 7123 4567')).toBe('02071234567');
    });

    it('should handle empty input', () => {
      expect(sanitizePhone('')).toBe('');
    });
  });
});
