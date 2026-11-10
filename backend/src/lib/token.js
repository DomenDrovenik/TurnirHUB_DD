const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'token';
// Kratka veljavnost žetona (glej ADR-0005); privzeto 1 ura.
const TOKEN_TTL_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS) || 60 * 60;

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET ni nastavljen');
  }
  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ role: user.role }, getSecret(), {
    subject: user.id,
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

module.exports = {
  COOKIE_NAME,
  TOKEN_TTL_SECONDS,
  cookieOptions,
  signToken,
  verifyToken,
};
