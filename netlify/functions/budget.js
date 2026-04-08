const { getDb, ok, created, badRequest, unauthorized, serverError, cors, notFound } = require('./_db');
const { getUser } = require('./_auth');

// Budget suggestion logic
const suggestBudget = (income) => {
  const categories = [];
  if (income <= 15000) {
    categories.push(
      { name: 'Investments/Savings', emoji: '📈', percentage: 30, amount: Math.round(income * 0.30), color: '#10b981' },
      { name: 'Food & Groceries', emoji: '🍛', percentage: 20, amount: Math.round(income * 0.20), color: '#f59e0b' },
      { name: 'Transport', emoji: '⛽', percentage: 15, amount: Math.round(income * 0.15), color: '#3b82f6' },
      { name: 'Rent/Housing', emoji: '🏠', percentage: 20, amount: Math.round(income * 0.20), color: '#8b5cf6' },
      { name: 'Entertainment', emoji: '🎬', percentage: 7, amount: Math.round(income * 0.07), color: '#ec4899' },
      { name: 'Miscellaneous', emoji: '🛍️', percentage: 8, amount: Math.round(income * 0.08), color: '#6366f1' }
    );
  } else if (income <= 50000) {
    categories.push(
      { name: 'Investments/Savings', emoji: '📈', percentage: 35, amount: Math.round(income * 0.35), color: '#10b981' },
      { name: 'Rent/Housing', emoji: '🏠', percentage: 25, amount: Math.round(income * 0.25), color: '#8b5cf6' },
      { name: 'Food & Groceries', emoji: '🍛', percentage: 15, amount: Math.round(income * 0.15), color: '#f59e0b' },
      { name: 'Transport', emoji: '⛽', percentage: 10, amount: Math.round(income * 0.10), color: '#3b82f6' },
      { name: 'Health & Fitness', emoji: '💪', percentage: 5, amount: Math.round(income * 0.05), color: '#06b6d4' },
      { name: 'Entertainment', emoji: '🎬', percentage: 5, amount: Math.round(income * 0.05), color: '#ec4899' },
      { name: 'Miscellaneous', emoji: '🛍️', percentage: 5, amount: Math.round(income * 0.05), color: '#6366f1' }
    );
  } else {
    categories.push(
      { name: 'Investments/Savings', emoji: '📈', percentage: 40, amount: Math.round(income * 0.40), color: '#10b981' },
      { name: 'Rent/Housing', emoji: '🏠', percentage: 20, amount: Math.round(income * 0.20), color: '#8b5cf6' },
      { name: 'Food & Groceries', emoji: '🍛', percentage: 12, amount: Math.round(income * 0.12), color: '#f59e0b' },
      { name: 'Transport', emoji: '⛽', percentage: 8, amount: Math.round(income * 0.08), color: '#3b82f6' },
      { name: 'Health & Fitness', emoji: '💪', percentage: 5, amount: Math.round(income * 0.05), color: '#06b6d4' },
      { name: 'Entertainment', emoji: '🎬', percentage: 5, amount: Math.round(income * 0.05), color: '#ec4899' },
      { name: 'Vacation/Travel', emoji: '✈️', percentage: 5, amount: Math.round(income * 0.05), color: '#f43f5e' },
      { name: 'Miscellaneous', emoji: '🛍️', percentage: 5, amount: Math.round(income * 0.05), color: '#6366f1' }
    );
  }
  return categories;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors();

  const user = getUser(event);
  if (!user) return unauthorized();

  const sql = getDb();
  const path = event.path || '';
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const { month, year } = event.queryStringParameters || {};
      if (month && year) {
        const [plan] = await sql`
          SELECT * FROM budget_plans WHERE user_id = ${user.id} AND month = ${parseInt(month)} AND year = ${parseInt(year)}
        `;
        if (!plan) {
          // Return suggestion
          return ok({ plan: null, suggestion: null });
        }
        return ok({ plan });
      }
      // Get all plans
      const plans = await sql`SELECT * FROM budget_plans WHERE user_id = ${user.id} ORDER BY year DESC, month DESC LIMIT 24`;
      return ok({ plans });
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { month, year, income, income_type, categories } = body;
      if (!month || !year || !income) return badRequest('month, year, income required');

      const cats = categories || suggestBudget(parseFloat(income));

      const [plan] = await sql`
        INSERT INTO budget_plans (user_id, month, year, income, income_type, categories)
        VALUES (${user.id}, ${month}, ${year}, ${income}, ${income_type || 'salary'}, ${JSON.stringify(cats)})
        ON CONFLICT (user_id, month, year)
        DO UPDATE SET income = EXCLUDED.income, income_type = EXCLUDED.income_type, categories = EXCLUDED.categories, updated_at = NOW()
        RETURNING *
      `;
      return created({ plan });
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { id, categories, income, income_type } = body;
      if (!id) return badRequest('id required');

      const [plan] = await sql`
        UPDATE budget_plans SET categories = ${JSON.stringify(categories)}, income = ${income}, income_type = ${income_type}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${user.id}
        RETURNING *
      `;
      if (!plan) return notFound();
      return ok({ plan });
    }

    // GET suggestion
    if (method === 'GET' && path.includes('/suggest')) {
      const { income } = event.queryStringParameters || {};
      if (!income) return badRequest('income required');
      return ok({ categories: suggestBudget(parseFloat(income)) });
    }

    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    return serverError(err);
  }
};
