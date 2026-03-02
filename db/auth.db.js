import pool from './connection.js';
import logger from '../utils/logger.js';

// ─── USER LOOKUP ────────────────────────────────────────────────────────────────

/**
 * Find user by email with role info for authentication.
 * Returns all fields needed for login validation.
 */
export const findUserByEmail = async (email) => {
  const query = `
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.password_hash,
      u.role_id,
      r.role_name,
      u.is_active,
      u.is_locked,
      u.failed_attempts,
      u.lock_until,
      u.must_change_password,
      u.token_version
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.email = $1
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
};

/**
 * Get minimal user data for auth middleware verification.
 */
export const getUserForAuth = async (userId) => {
  const query = `
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.role_id,
      r.role_name,
      u.is_active,
      u.token_version
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
};

// ─── BRUTE-FORCE / ACCOUNT LOCKING ─────────────────────────────────────────────

/**
 * Increment failed_attempts for a user. Returns new count.
 */
export const incrementFailedAttempts = async (userId) => {
  const query = `
    UPDATE users 
    SET failed_attempts = failed_attempts + 1,
        updated_at = NOW()
    WHERE user_id = $1
    RETURNING failed_attempts
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.failed_attempts ?? 0;
};

/**
 * Lock user account until the specified timestamp.
 */
export const lockAccount = async (userId, lockUntil) => {
  const query = `
    UPDATE users 
    SET is_locked = true,
        lock_until = $2,
        updated_at = NOW()
    WHERE user_id = $1
  `;
  await pool.query(query, [userId, lockUntil]);
  logger.warn(`Account locked for user_id=${userId} until ${lockUntil.toISOString()}`);
};

/**
 * Reset failed_attempts to 0 and unlock account on successful login.
 */
export const resetFailedAttempts = async (userId) => {
  const query = `
    UPDATE users 
    SET failed_attempts = 0,
        is_locked = false,
        lock_until = NULL,
        updated_at = NOW()
    WHERE user_id = $1
  `;
  await pool.query(query, [userId]);
};

/**
 * Update last_login_at timestamp.
 */
export const updateLastLogin = async (userId) => {
  const query = `
    UPDATE users 
    SET last_login_at = NOW(),
        updated_at = NOW()
    WHERE user_id = $1
  `;
  await pool.query(query, [userId]);
};

// ─── SESSION MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * Create a new session in user_sessions.
 * session_id is provided (UUID generated in controller).
 */
export const createSession = async ({ session_id, user_id, refresh_token_hash, ip_address, user_agent, expires_at }) => {
  const query = `
    INSERT INTO user_sessions (session_id, user_id, refresh_token_hash, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4::inet, $5, $6)
    RETURNING session_id, user_id, created_at, expires_at
  `;
  const result = await pool.query(query, [
    session_id,
    user_id,
    refresh_token_hash,
    ip_address || null,
    user_agent || null,
    expires_at
  ]);
  return result.rows[0];
};

/**
 * Find a session by session_id.
 */
export const findSessionById = async (sessionId) => {
  const query = `
    SELECT 
      session_id,
      user_id,
      refresh_token_hash,
      ip_address,
      user_agent,
      created_at,
      last_activity,
      expires_at
    FROM user_sessions
    WHERE session_id = $1
  `;
  const result = await pool.query(query, [sessionId]);
  return result.rows[0] || null;
};

/**
 * Update the refresh_token_hash and last_activity for token rotation.
 */
export const rotateSessionRefreshToken = async (sessionId, newRefreshTokenHash) => {
  const query = `
    UPDATE user_sessions
    SET refresh_token_hash = $2,
        last_activity = NOW()
    WHERE session_id = $1
    RETURNING session_id, last_activity
  `;
  const result = await pool.query(query, [sessionId, newRefreshTokenHash]);
  return result.rows[0] || null;
};

/**
 * Delete a single session (logout).
 */
export const deleteSession = async (sessionId) => {
  const query = `DELETE FROM user_sessions WHERE session_id = $1 RETURNING session_id`;
  const result = await pool.query(query, [sessionId]);
  return result.rowCount > 0;
};

/**
 * Delete all sessions for a user (global logout / token invalidation).
 */
export const deleteAllUserSessions = async (userId) => {
  const query = `DELETE FROM user_sessions WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rowCount;
};

/**
 * Clean up expired sessions (can be called periodically).
 */
export const cleanExpiredSessions = async () => {
  const query = `DELETE FROM user_sessions WHERE expires_at < NOW()`;
  const result = await pool.query(query);
  if (result.rowCount > 0) {
    logger.info(`Cleaned ${result.rowCount} expired sessions`);
  }
  return result.rowCount;
};

// ─── TOKEN VERSION ──────────────────────────────────────────────────────────────

/**
 * Increment token_version to invalidate all existing tokens for a user.
 */
export const incrementTokenVersion = async (userId) => {
  const query = `
    UPDATE users 
    SET token_version = token_version + 1,
        updated_at = NOW()
    WHERE user_id = $1
    RETURNING token_version
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.token_version;
};
