const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'finflow-super-secret-change-in-prod';

const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '7d' });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};

const getUser = (event) => {
  const auth = event.headers?.authorization || event.headers?.Authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
};

module.exports = { signToken, verifyToken, getUser };
