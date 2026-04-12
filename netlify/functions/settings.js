const { getDb, ok, badRequest, unauthorized, serverError, cors } = require('./_db');
const { getUser } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors();

  const user = getUser(event);
  if (!user) return unauthorized();

  const sql = getDb();

  try {
    if (event.httpMethod === 'GET') {
      const [row] = await sql`SELECT settings FROM users WHERE id = ${user.id}`;
      return ok({ settings: row?.settings || {} });
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const [row] = await sql`
        UPDATE users SET settings = ${JSON.stringify(body)}::jsonb
        WHERE id = ${user.id}
        RETURNING settings
      `;
      return ok({ settings: row.settings });
    }

    return badRequest('Method not supported');
  } catch (err) {
    return serverError(err);
  }
};
