import crypto from 'crypto';

/**
 * Generate a random token for email verification
 * @returns Random string token
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
