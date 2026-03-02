/**
 * JWT Utility — Access token generation & verification.
 *
 * Refresh tokens are NOT JWTs; they are opaque crypto.randomBytes strings
 * stored hashed (bcrypt) in user_sessions. Only access tokens use JWT.
 */
import jwt from 'jsonwebtoken';

// ─── Configuration ──────────────────────────────────────────────────────────────
// Evaluated lazily via functions so that process.env is read AFTER dotenv.config()

const ACCESS_TOKEN_EXPIRY = '15m';

function getAccessTokenSecret() {
  return process.env.JWT_SECRET || 'your_jwt_secret_key';
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function getAuthCookieBaseOptions() {
  const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
  const configuredSameSite = process.env.COOKIE_SAMESITE?.trim().toLowerCase();
  const configuredSecure = process.env.COOKIE_SECURE?.trim().toLowerCase();

  const validSameSite = ['lax', 'strict', 'none'];
  let sameSite = validSameSite.includes(configuredSameSite)
    ? configuredSameSite
    : (isProduction() ? 'none' : 'lax');

  let secure;
  if (configuredSecure === 'true') {
    secure = true;
  } else if (configuredSecure === 'false') {
    secure = false;
  } else {
    secure = isProduction();
  }

  // Browsers reject SameSite=None cookies unless Secure is also true.
  if (sameSite === 'none' && !secure) {
    secure = true;
  }

  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };

  if (cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }

  return cookieOptions;
}

// ─── Access Token ───────────────────────────────────────────────────────────────

/**
 * Generate a signed JWT access token.
 * Payload must contain: user_id, role_id, session_id, token_version
 */
export function generateAccessToken({ user_id, role_id, role_name, session_id, token_version }) {
  return jwt.sign(
    { user_id, role_id, role_name, session_id, token_version },
    getAccessTokenSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode an access token.
 * Throws on invalid / expired token — callers should catch.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessTokenSecret());
}

// ─── Cookie Helpers ─────────────────────────────────────────────────────────────

/** Standard options for the access-token cookie. */
export function getAccessTokenCookieOptions() {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge: 15 * 60 * 1000, // 15 minutes
  };
}

/** Standard options for the refresh-token cookie. */
export function getRefreshTokenCookieOptions() {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Set both accessToken and refreshToken cookies on a response object.
 */
export function setAuthCookies(res, accessToken, rawRefreshToken) {
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', rawRefreshToken, getRefreshTokenCookieOptions());
}

/**
 * Clear both auth cookies.
 */
export function clearAuthCookies(res) {
  const clearOptions = getAuthCookieBaseOptions();
  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
}
