const bcrypt = require('bcryptjs');
const { getDb, ok, badRequest, unauthorized, serverError, cors } = require('./_db');
const { signToken } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors();
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    let body;

try {
  body = event.body ? JSON.parse(event.body) : {};
} catch (e) {
  return badRequest("Invalid JSON");
}

const { email, password } = body;
console.log("BODY:", body);
    if (!email || !password) return badRequest('Email and password required');

    const sql = getDb();
    const [user] = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
    if (!user) return unauthorized();

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return unauthorized();

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    const { password_hash, ...safeUser } = user;
    return ok({ token, user: safeUser });
  } catch (err) {
    return serverError(err);
  }
};
