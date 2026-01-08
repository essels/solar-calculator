'use client';

import { useState } from 'react';
import { validateLeadForm, sanitizePhone } from '@/lib/validation/lead-validation';
import type { LeadContact, LeadConsent } from '@/types/solar';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: LeadContact, consent: LeadConsent) => Promise<void>;
}

export function LeadCaptureModal({ isOpen, onClose, onSubmit }: LeadCaptureModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
  });

  const [consent, setConsent] = useState<{
    marketingConsent: boolean;
    privacyAcceptance: boolean;
  }>({
    marketingConsent: false,
    privacyAcceptance: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleConsentChange = (field: 'marketingConsent' | 'privacyAcceptance') => {
    setConsent((prev) => ({ ...prev, [field]: !prev[field] }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form
    const validation = validateLeadForm({
      email: formData.email,
      phone: formData.phone,
      name: formData.name,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Validate consent checkboxes
    const consentErrors: Record<string, string> = {};

    if (!consent.privacyAcceptance) {
      consentErrors.privacyAcceptance = 'You must accept the privacy policy';
    }

    if (!consent.marketingConsent) {
      consentErrors.marketingConsent = 'You must consent to marketing communications to proceed';
    }

    if (Object.keys(consentErrors).length > 0) {
      setErrors(consentErrors);
      return;
    }

    // Prepare data for submission
    setIsSubmitting(true);

    try {
      const contact: LeadContact = {
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone ? sanitizePhone(formData.phone) : undefined,
        name: formData.name ? formData.name.trim() : undefined,
      };

      const consentData: LeadConsent = {
        marketingConsent: consent.marketingConsent,
        privacyAcceptance: consent.privacyAcceptance,
        consentTimestamp: new Date().toISOString(),
      };

      await onSubmit(contact, consentData);

      // Reset form on success
      setFormData({ email: '', phone: '', name: '' });
      setConsent({ marketingConsent: false, privacyAcceptance: false });
      setErrors({});
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit lead. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Get Your Free Quote</h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-foreground/60 transition-colors hover:text-foreground disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-foreground/60">
            Share your details to receive a personalised solar quote
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Error Banner */}
          {submitError && (
            <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
              {submitError}
            </div>
          )}

          {/* Email Input (Required) */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
              Email Address<span className="text-error">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:outline-none focus:ring-1 disabled:bg-muted disabled:opacity-50 ${
                errors.email
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-border focus:border-primary focus:ring-primary'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
          </div>

          {/* Phone Input (Optional) */}
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground">
              Phone Number<span className="text-foreground/40"> (optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="020 1234 5678 or +44 201 234 5678"
              disabled={isSubmitting}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:outline-none focus:ring-1 disabled:bg-muted disabled:opacity-50 ${
                errors.phone
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-border focus:border-primary focus:ring-primary'
              }`}
            />
            {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone}</p>}
            {!errors.phone && (
              <p className="mt-1 text-xs text-foreground/50">
                UK format: 020 XXXX XXXX or +44 20 XXXX XXXX
              </p>
            )}
          </div>

          {/* Name Input (Optional) */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
              Full Name<span className="text-foreground/40"> (optional)</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Smith"
              disabled={isSubmitting}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:outline-none focus:ring-1 disabled:bg-muted disabled:opacity-50 ${
                errors.name
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-border focus:border-primary focus:ring-primary'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* UK GDPR Compliance Checkboxes */}

          {/* Marketing Consent Checkbox (Required) */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="marketingConsent"
                checked={consent.marketingConsent}
                onChange={() => handleConsentChange('marketingConsent')}
                disabled={isSubmitting}
                className={`mt-1 h-4 w-4 shrink-0 rounded border transition-colors accent-primary disabled:opacity-50 ${
                  errors.marketingConsent ? 'border-error' : 'border-border'
                }`}
              />
              <div className="flex-1">
                <label htmlFor="marketingConsent" className="text-sm text-foreground">
                  Send me solar savings information and quotes<span className="text-error">*</span>
                </label>
                <p className="mt-1 text-xs text-foreground/60">
                  We&apos;ll contact you with personalised solar quotes, installation options, and
                  savings estimates. You can unsubscribe at any time using links in our emails or by
                  contacting us directly.
                </p>
              </div>
            </div>
            {errors.marketingConsent && (
              <p className="text-xs text-error">{errors.marketingConsent}</p>
            )}
          </div>

          {/* Privacy Acceptance Checkbox (Required) */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="privacyAcceptance"
                checked={consent.privacyAcceptance}
                onChange={() => handleConsentChange('privacyAcceptance')}
                disabled={isSubmitting}
                className={`mt-1 h-4 w-4 shrink-0 rounded border transition-colors accent-primary disabled:opacity-50 ${
                  errors.privacyAcceptance ? 'border-error' : 'border-border'
                }`}
              />
              <div className="flex-1">
                <label htmlFor="privacyAcceptance" className="text-sm text-foreground">
                  I accept the Privacy Policy<span className="text-error">*</span>
                </label>
                <p className="mt-1 text-xs text-foreground/60">
                  I understand my personal data will be processed as described in the{' '}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:text-primary-dark underline"
                  >
                    Privacy Policy
                  </a>
                  . We collect and use your data in accordance with UK GDPR and Data Protection Act
                  2018 to provide quotes and follow up on interest.
                </p>
              </div>
            </div>
            {errors.privacyAcceptance && (
              <p className="text-xs text-error">{errors.privacyAcceptance}</p>
            )}
          </div>

          {/* Legal Notice */}
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-foreground/60">
            <p className="font-medium text-foreground/80 mb-1">Your data is safe</p>
            <p>
              Your information is stored securely and only used to send quotes and relevant
              information. We comply with UK GDPR requirements. Consent recorded at{' '}
              {new Date().toLocaleDateString('en-GB')}.
            </p>
          </div>
        </form>

        {/* Footer / Submit Button */}
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.email}
            className="w-full rounded-lg bg-primary py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Get Free Quote'}
          </button>
          <p className="mt-3 text-center text-xs text-foreground/60">
            We&apos;ll review your details and send a quote within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
