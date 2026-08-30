/**
 * Phone number validation & formatting helper based on ITU-T / E.164 international standards
 */

export interface PhoneRule {
  countryCode: string;
  dialCode: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
  telephonePlaceholder: string;
}

export const PHONE_RULES: Record<string, PhoneRule> = {
  IN: {
    countryCode: 'IN',
    dialCode: '+91',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '98765 43210',
    telephonePlaceholder: 'e.g. 080 2345 6789 (Optional)',
  },
  US: {
    countryCode: 'US',
    dialCode: '+1',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '202 555 0123',
    telephonePlaceholder: 'e.g. 202 555 0199 (Optional)',
  },
  CA: {
    countryCode: 'CA',
    dialCode: '+1',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '416 555 0123',
    telephonePlaceholder: 'e.g. 416 555 0199 (Optional)',
  },
  GB: {
    countryCode: 'GB',
    dialCode: '+44',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '7911 123456',
    telephonePlaceholder: 'e.g. 020 7946 0912 (Optional)',
  },
  DE: {
    countryCode: 'DE',
    dialCode: '+49',
    minDigits: 10,
    maxDigits: 11,
    placeholder: '151 12345678',
    telephonePlaceholder: 'e.g. 030 123456 (Optional)',
  },
  FR: {
    countryCode: 'FR',
    dialCode: '+33',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '6 12 34 56 78',
    telephonePlaceholder: 'e.g. 01 23 45 67 89 (Optional)',
  },
  ES: {
    countryCode: 'ES',
    dialCode: '+34',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '612 34 56 78',
    telephonePlaceholder: 'e.g. 912 34 56 78 (Optional)',
  },
  IT: {
    countryCode: 'IT',
    dialCode: '+39',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '312 345 6789',
    telephonePlaceholder: 'e.g. 06 1234567 (Optional)',
  },
  AE: {
    countryCode: 'AE',
    dialCode: '+971',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '50 123 4567',
    telephonePlaceholder: 'e.g. 04 123 4567 (Optional)',
  },
  SA: {
    countryCode: 'SA',
    dialCode: '+966',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '51 234 5678',
    telephonePlaceholder: 'e.g. 011 123 4567 (Optional)',
  },
  AU: {
    countryCode: 'AU',
    dialCode: '+61',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '412 345 678',
    telephonePlaceholder: 'e.g. 02 1234 5678 (Optional)',
  },
  JP: {
    countryCode: 'JP',
    dialCode: '+81',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '90 1234 5678',
    telephonePlaceholder: 'e.g. 03 1234 5678 (Optional)',
  },
  SG: {
    countryCode: 'SG',
    dialCode: '+65',
    minDigits: 8,
    maxDigits: 8,
    placeholder: '8123 4567',
    telephonePlaceholder: 'e.g. 6123 4567 (Optional)',
  },
};

/**
 * Get phone rule for country code
 */
export function getPhoneRule(countryCode: string): PhoneRule {
  return (
    PHONE_RULES[countryCode] || {
      countryCode,
      dialCode: '+',
      minDigits: 7,
      maxDigits: 15,
      placeholder: 'Mobile phone number',
      telephonePlaceholder: 'Landline / Secondary telephone (Optional)',
    }
  );
}

/**
 * Strip non-digit characters
 */
export function sanitizePhoneDigits(val: string): string {
  return val.replace(/\D/g, '');
}

/**
 * Validate phone number against country digit requirements
 */
export function validatePhoneNumber(
  val: string,
  countryCode: string
): { isValid: boolean; error?: string } {
  const digits = sanitizePhoneDigits(val);
  const rule = getPhoneRule(countryCode);
  const countryName = countryCode === 'IN' ? 'India' : countryCode;

  if (!digits) {
    return { isValid: false, error: 'Mobile phone number is required.' };
  }

  if (rule.minDigits === rule.maxDigits) {
    if (digits.length !== rule.minDigits) {
      return {
        isValid: false,
        error: `Mobile number for ${countryName} must be exactly ${rule.minDigits} digits (currently ${digits.length}).`,
      };
    }
  } else {
    if (digits.length < rule.minDigits || digits.length > rule.maxDigits) {
      return {
        isValid: false,
        error: `Mobile number for ${countryName} must be between ${rule.minDigits} and ${rule.maxDigits} digits (currently ${digits.length}).`,
      };
    }
  }

  return { isValid: true };
}
