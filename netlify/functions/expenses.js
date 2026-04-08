const { getDb, ok, created, badRequest, unauthorized, serverError, cors, notFound } = require('./_db');
const { getUser } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors();

  const user = getUser(event);
  if (!user) return unauthorized();

  const sql = getDb();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};

  try {
    if (method === 'GET') {
      const { month, year, is_yearly, limit = 100 } = params;

      if (is_yearly === 'true') {
        const expenses = await sql`
          SELECT * FROM expenses WHERE user_id = ${user.id} AND is_yearly = true ORDER BY expense_date DESC
        `;
        return ok({ expenses });
      }

      if (month && year) {
        const expenses = await sql`
          SELECT * FROM expenses 
          WHERE user_id = ${user.id} 
            AND EXTRACT(MONTH FROM expense_date) = ${parseInt(month)}
            AND EXTRACT(YEAR FROM expense_date) = ${parseInt(year)}
          ORDER BY expense_date DESC
        `;
        // Also fetch recurring expenses
        const recurring = await sql`
          SELECT * FROM expenses WHERE user_id = ${user.id} AND recurrence = 'monthly'
        `;
        return ok({ expenses, recurring });
      }

      const expenses = await sql`
        SELECT * FROM expenses WHERE user_id = ${user.id} ORDER BY expense_date DESC LIMIT ${parseInt(limit)}
      `;
      return ok({ expenses });
    }

    if (method === 'POST') {
      const { title, amount, category, expense_date, notes, is_yearly, recurrence } = JSON.parse(event.body || '{}');
      if (!title || !amount || !category || !expense_date) return badRequest('title, amount, category, expense_date required');

      const [expense] = await sql`
        INSERT INTO expenses (user_id, title, amount, category, expense_date, notes, is_yearly, recurrence)
        VALUES (${user.id}, ${title}, ${amount}, ${category}, ${expense_date}, ${notes || null}, ${is_yearly || false}, ${recurrence || 'none'})
        RETURNING *
      `;
      return created({ expense });
    }

    if (method === 'PUT') {
      const { id, title, amount, category, expense_date, notes, is_yearly, recurrence } = JSON.parse(event.body || '{}');
      if (!id) return badRequest('id required');

      const [expense] = await sql`
        UPDATE expenses SET title = ${title}, amount = ${amount}, category = ${category}, 
          expense_date = ${expense_date}, notes = ${notes}, is_yearly = ${is_yearly}, recurrence = ${recurrence}
        WHERE id = ${id} AND user_id = ${user.id}
        RETURNING *
      `;
      if (!expense) return notFound();
      return ok({ expense });
    }

    if (method === 'DELETE') {
      const { id } = params;
      if (!id) return badRequest('id required');
      await sql`DELETE FROM expenses WHERE id = ${id} AND user_id = ${user.id}`;
      return ok({ deleted: true });
    }

    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    return serverError(err);
  }
};
