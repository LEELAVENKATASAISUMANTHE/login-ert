// Middleware to check access and refresh tokens, and auto-refresh if access token is about to expire
import { verifyToken, verifyRefreshToken, generateToken } from '../utils/jwt.js';

export async function authenticateWithAutoRefresh(req, res, next) {
  try {
    const accessToken = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;
    let user = null;
    let accessPayload = null;
    let refreshPayload = null;

    if (accessToken) {
      accessPayload = verifyToken(accessToken);
    }
    if (refreshToken) {
      refreshPayload = verifyRefreshToken(refreshToken);
    }

    // If access token is valid, check expiry
    if (accessPayload) {
      const now = Math.floor(Date.now() / 1000);
      const exp = accessPayload.exp;
      // If access token expires in less than 5 min, try to refresh
      if (exp - now < 5 * 60 && refreshPayload) {
        // Issue new access token
        const newAccessToken = generateToken({
          user_id: refreshPayload.user_id,
          username: refreshPayload.username,
          role_id: refreshPayload.role_id,
          role_name: refreshPayload.role_name
        });
        res.cookie('token', newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 15 * 60 * 1000
        });
        req.user = refreshPayload;
        return next();
      }
      // Access token is valid and not about to expire
      req.user = accessPayload;
      return next();
    }

    // If access token is invalid but refresh token is valid, issue new access token
    if (!accessPayload && refreshPayload) {
      const newAccessToken = generateToken({
        user_id: refreshPayload.user_id,
        username: refreshPayload.username,
        role_id: refreshPayload.role_id,
        role_name: refreshPayload.role_name
      });
      res.cookie('token', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000
      });
      req.user = refreshPayload;
      return next();
    }

    // If neither token is valid
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication error'
    });
  }
}
