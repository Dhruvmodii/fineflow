const bcrypt = require('bcryptjs');
const { getDb, ok, created, badRequest, serverError, cors } = require('./_db');
const { signToken } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors();

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { name, email, password } = JSON.parse(event.body || '{}');

    if (!name || !email || !password) return badRequest('Name, email and password are required');
    if (password.length < 8) return badRequest('Password must be at least 8 characters');
    if (!/\S+@\S+\.\S+/.test(email)) return badRequest('Invalid email address');

    const sql = getDb();
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) return badRequest('Email already registered');

    const hash = await bcrypt.hash(password, 12);
    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, avatar_color)
      VALUES (${name.trim()}, ${email.toLowerCase()}, ${hash}, ${color})
      RETURNING id, name, email, avatar_color, created_at
    `;

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return created({ token, user });
  } catch (err) {
    return serverError(err);
  }
};
