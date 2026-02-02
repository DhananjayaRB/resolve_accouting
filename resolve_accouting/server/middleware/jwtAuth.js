/**
 * JWT Authentication Middleware
 * Verifies JWT tokens from Authorization header
 */

/**
 * Decode JWT token without verification (for basic validation)
 * For production, use a proper JWT library with secret verification
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Use atob equivalent for Node.js
    let jsonPayload;
    if (typeof Buffer !== 'undefined') {
      jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    } else {
      // Fallback for environments without Buffer
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }
    
    const decoded = JSON.parse(jsonPayload);
    
    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * JWT Authentication Middleware
 * Expects: Authorization: Bearer <token>
 */
export const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required'
        }
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization header format. Expected: Bearer <token>'
        }
      });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token is required'
        }
      });
    }

    // Decode and verify token
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      });
    }

    // Attach decoded token to request
    req.user = decoded;
    req.orgId = decoded.org_id;
    
    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
};

export default authenticateJWT;

