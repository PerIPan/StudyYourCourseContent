import { createHmac } from 'crypto';

const SECRET = process.env.COOKIE_SECRET || process.env.ADMIN_PASSWORD || 'cla-default-secret';

/** Sign a value with HMAC-SHA256 */
export function signCookie(value: string): string {
  const sig = createHmac('sha256', SECRET).update(value).digest('base64url');
  return `${value}.${sig}`;
}

/** Verify and extract value from signed cookie. Returns null if invalid. */
export function verifyCookie(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.');
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = createHmac('sha256', SECRET).update(value).digest('base64url');
  if (sig !== expected) return null;
  return value;
}
