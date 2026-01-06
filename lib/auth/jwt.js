import jwt from 'jsonwebtoken';

// Access Token - 24 hours (production value)
const ACCESS_TOKEN_EXPIRE = '24h';
// Refresh Token - 7 days (production value)  
const REFRESH_TOKEN_EXPIRE = '7d';

// Helper to get secrets at runtime
function getSecrets() {
  return {
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'your-secret-key-change-in-production',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-change-in-production'
  };
}

// Generate Access Token
export function generateAccessToken(userId) {
  const { ACCESS_TOKEN_SECRET } = getSecrets();
  return jwt.sign({ id: userId, type: 'access' }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE,
  });
}

// Generate Refresh Token
export function generateRefreshToken(userId) {
  const { REFRESH_TOKEN_SECRET } = getSecrets();
  return jwt.sign({ id: userId, type: 'refresh' }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRE,
  });
}

// Verify Access Token
export function verifyAccessToken(token) {
  try {
    const { ACCESS_TOKEN_SECRET } = getSecrets();
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (decoded.type !== 'access') return null;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Verify Refresh Token
export function verifyRefreshToken(token) {
  try {
    const { REFRESH_TOKEN_SECRET } = getSecrets();
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    if (decoded.type !== 'refresh') return null;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Extract user from access token
export function getUserFromToken(token) {
  const decoded = verifyAccessToken(token);
  return decoded ? decoded.id : null;
}
