const { getDb, ok, created, badRequest, unauthorized, serverError, cors, notFound, forbidden } = require('./_db');
const { getUser } = require('./_auth');

// Simplify debts algorithm (like Splitwise magic)
const simplifyDebts = (members, expenses) => {
  const balances = {};
  members.forEach(m => { balances[m.user_id] = 0; });

  expenses.forEach(exp => {
    const splits = exp.splits || [];
    const paidBy = exp.paid_by;
    splits.forEach(split => {
      if (split.user_id !== paidBy) {
        balances[paidBy] = (balances[paidBy] || 0) + split.amount;
        balances[split.user_id] = (balances[split.user_id] || 0) - split.amount;
      }
    });
  });

  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([uid, bal]) => {
    if (bal > 0.01) creditors.push({ id: uid, amount: bal });
    else if (bal < -0.01) debtors.push({ id: uid, amount: -bal });
  });

  const transactions = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].amount, debtors[j].amount);
    transactions.push({ from: debtors[j].id, to: creditors[i].id, amount: Math.round(amount * 100) / 100 });
    creditors[i].amount -= amount;
    debtors[j].amount -= amount;
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }
  return transactions;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors();

  const user = getUser(event);
  if (!user) return unauthorized();

  const sql = getDb();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const path = event.path || '';

  try {
    // GET /groups - list user's groups
    if (method === 'GET' && !params.group_id && !path.includes('expense')) {
      const groups = await sql`
        SELECT g.*, COUNT(gm.id) as member_count
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ${user.id}
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `;
      return ok({ groups });
    }

    // GET /groups?group_id=X - get group details with members, expenses, debts
    if (method === 'GET' && params.group_id) {
      const gid = params.group_id;
      const [group] = await sql`SELECT * FROM groups WHERE id = ${gid}`;
      if (!group) return notFound();

      const members = await sql`
        SELECT gm.*, u.name, u.email, u.avatar_color 
        FROM group_members gm 
        JOIN users u ON gm.user_id = u.id 
        WHERE gm.group_id = ${gid}
      `;

      const isMember = members.some(m => m.user_id === user.id);
      if (!isMember) return forbidden();

      const expenses = await sql`
        SELECT se.*, u.name as paid_by_name, u.avatar_color as paid_by_color
        FROM split_expenses se
        JOIN users u ON se.paid_by = u.id
        WHERE se.group_id = ${gid}
        ORDER BY se.expense_date DESC
      `;

      const settlements = await sql`
        SELECT s.*, u1.name as from_name, u2.name as to_name
        FROM settlements s
        JOIN users u1 ON s.paid_by = u1.id
        JOIN users u2 ON s.paid_to = u2.id
        WHERE s.group_id = ${gid}
        ORDER BY s.settled_at DESC
      `;

      const debts = simplifyDebts(members, expenses);
      return ok({ group, members, expenses, settlements, debts });
    }

    // POST /groups - create group
    if (method === 'POST' && !params.action) {
      const { name, description, icon, member_emails } = JSON.parse(event.body || '{}');
      if (!name) return badRequest('name required');

      const [group] = await sql`
        INSERT INTO groups (name, description, icon, created_by)
        VALUES (${name}, ${description || null}, ${icon || '🏠'}, ${user.id})
        RETURNING *
      `;

      await sql`INSERT INTO group_members (group_id, user_id) VALUES (${group.id}, ${user.id})`;

      // Add other members by email
      if (member_emails?.length) {
        for (const email of member_emails) {
          const [u] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
          if (u) {
            await sql`
              INSERT INTO group_members (group_id, user_id) VALUES (${group.id}, ${u.id})
              ON CONFLICT DO NOTHING
            `;
          }
        }
      }

      return created({ group });
    }

    // POST /groups?action=add_expense - add split expense
    if (method === 'POST' && params.action === 'add_expense') {
      const { group_id, title, amount, split_type, splits, expense_date, notes, is_recurring, recurrence } = JSON.parse(event.body || '{}');
      if (!group_id || !title || !amount || !splits) return badRequest('group_id, title, amount, splits required');

      const [expense] = await sql`
        INSERT INTO split_expenses (group_id, paid_by, title, amount, split_type, splits, expense_date, notes, is_recurring, recurrence)
        VALUES (${group_id}, ${user.id}, ${title}, ${amount}, ${split_type || 'equal'}, ${JSON.stringify(splits)}, ${expense_date || new Date().toISOString().slice(0,10)}, ${notes || null}, ${is_recurring || false}, ${recurrence || 'none'})
        RETURNING *
      `;
      return created({ expense });
    }

    // POST /groups?action=settle - record settlement
    if (method === 'POST' && params.action === 'settle') {
      const { group_id, paid_to, amount, method: payMethod, notes } = JSON.parse(event.body || '{}');
      if (!group_id || !paid_to || !amount) return badRequest('group_id, paid_to, amount required');

      const [settlement] = await sql`
        INSERT INTO settlements (group_id, paid_by, paid_to, amount, method, notes)
        VALUES (${group_id}, ${user.id}, ${paid_to}, ${amount}, ${payMethod || 'cash'}, ${notes || null})
        RETURNING *
      `;
      return created({ settlement });
    }

    // POST /groups?action=add_member
    if (method === 'POST' && params.action === 'add_member') {
      const { group_id, email } = JSON.parse(event.body || '{}');
      const [u] = await sql`SELECT id, name, email, avatar_color FROM users WHERE email = ${email.toLowerCase()}`;
      if (!u) return notFound('User not found');

      await sql`INSERT INTO group_members (group_id, user_id) VALUES (${group_id}, ${u.id}) ON CONFLICT DO NOTHING`;
      return ok({ member: u });
    }

    if (method === 'DELETE') {
      const { expense_id } = params;
      if (expense_id) {
        await sql`DELETE FROM split_expenses WHERE id = ${expense_id} AND paid_by = ${user.id}`;
        return ok({ deleted: true });
      }
    }

    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    return serverError(err);
  }
};
