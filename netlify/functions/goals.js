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
      const goals = await sql`
        SELECT * FROM goals WHERE user_id = ${user.id} ORDER BY created_at ASC
      `;
      return ok({ goals });
    }

    if (method === 'POST') {
      const { title, emoji, target_amount, saved_amount, deadline, monthly_budget, notes } = JSON.parse(event.body || '{}');
      if (!title || !target_amount) return badRequest('title and target_amount required');

      const [goal] = await sql`
        INSERT INTO goals (user_id, title, emoji, target_amount, saved_amount, deadline, monthly_budget, notes)
        VALUES (
          ${user.id}, ${title}, ${emoji || '🎯'}, ${target_amount},
          ${saved_amount || 0}, ${deadline || null}, ${monthly_budget || null}, ${notes || null}
        )
        RETURNING *
      `;
      return created({ goal });
    }

    if (method === 'PUT') {
      const { id, title, emoji, target_amount, saved_amount, deadline, monthly_budget, notes } = JSON.parse(event.body || '{}');
      if (!id) return badRequest('id required');

      const [goal] = await sql`
        UPDATE goals SET
          title = ${title},
          emoji = ${emoji},
          target_amount = ${target_amount},
          saved_amount = ${saved_amount},
          deadline = ${deadline || null},
          monthly_budget = ${monthly_budget || null},
          notes = ${notes || null},
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${user.id}
        RETURNING *
      `;
      if (!goal) return notFound('Goal not found');
      return ok({ goal });
    }

    // PATCH — just update saved_amount (add savings)
    if (method === 'PATCH') {
      const { id, saved_amount } = JSON.parse(event.body || '{}');
      if (!id) return badRequest('id required');

      const [goal] = await sql`
        UPDATE goals SET saved_amount = ${saved_amount}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${user.id}
        RETURNING *
      `;
      if (!goal) return notFound('Goal not found');
      return ok({ goal });
    }

    if (method === 'DELETE') {
      const { id } = params;
      if (!id) return badRequest('id required');
      await sql`DELETE FROM goals WHERE id = ${id} AND user_id = ${user.id}`;
      return ok({ deleted: true });
    }

    return badRequest('Method not supported');
  } catch (err) {
    return serverError(err);
  }
};
