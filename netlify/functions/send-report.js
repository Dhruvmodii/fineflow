const nodemailer = require('nodemailer');
const { getDb, ok, badRequest, unauthorized, serverError, cors } = require('./_db');
const { getUser } = require('./_auth');

const formatCurrency = (n) => `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const generateCSV = (expenses, budget) => {
  const rows = [['Date', 'Title', 'Category', 'Amount (₹)', 'Notes']];
  expenses.forEach(e => {
    rows.push([
      new Date(e.expense_date).toLocaleDateString('en-IN'),
      e.title,
      e.category,
      parseFloat(e.amount).toFixed(2),
      e.notes || ''
    ]);
  });

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  rows.push(['', '', '', '', '']);
  rows.push(['TOTAL', '', '', total.toFixed(2), '']);
  if (budget) {
    rows.push(['INCOME', '', '', parseFloat(budget.income).toFixed(2), '']);
    rows.push(['SAVINGS', '', '', (parseFloat(budget.income) - total).toFixed(2), '']);
  }

  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
};

const generateHTML = (user, expenses, budget, month, year) => {
  const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long' });
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const byCategory = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
  });

  const categoryRows = Object.entries(byCategory)
    .sort(([,a],[,b]) => b-a)
    .map(([cat, amt]) => `<tr><td style="padding:8px 12px">${cat}</td><td style="padding:8px 12px;text-align:right;font-weight:600">${formatCurrency(amt)}</td></tr>`)
    .join('');

  const expenseRows = expenses.slice(0, 50)
    .map(e => `<tr><td style="padding:6px 12px">${new Date(e.expense_date).toLocaleDateString('en-IN')}</td><td style="padding:6px 12px">${e.title}</td><td style="padding:6px 12px">${e.category}</td><td style="padding:6px 12px;text-align:right">${formatCurrency(e.amount)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>FinFlow Report</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;color:#fff">
      <h1 style="margin:0;font-size:24px">💰 FinFlow Monthly Report</h1>
      <p style="margin:8px 0 0;opacity:0.9">${monthName} ${year} — ${user.name}</p>
    </div>
    <div style="padding:24px">
      <div style="display:flex;gap:16px;margin-bottom:24px">
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center">
          <div style="color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600">Income</div>
          <div style="color:#16a34a;font-size:22px;font-weight:700;margin-top:4px">${budget ? formatCurrency(budget.income) : 'N/A'}</div>
        </div>
        <div style="flex:1;background:#fef2f2;border-radius:12px;padding:16px;text-align:center">
          <div style="color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600">Spent</div>
          <div style="color:#dc2626;font-size:22px;font-weight:700;margin-top:4px">${formatCurrency(total)}</div>
        </div>
        ${budget ? `<div style="flex:1;background:#f0f9ff;border-radius:12px;padding:16px;text-align:center">
          <div style="color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600">Saved</div>
          <div style="color:#0284c7;font-size:22px;font-weight:700;margin-top:4px">${formatCurrency(parseFloat(budget.income) - total)}</div>
        </div>` : ''}
      </div>
      
      <h3 style="color:#1f2937;margin:0 0 12px">By Category</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="background:#f9fafb"><th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:12px">Category</th><th style="padding:8px 12px;text-align:right;color:#6b7280;font-size:12px">Amount</th></tr></thead>
        <tbody>${categoryRows}</tbody>
      </table>

      <h3 style="color:#1f2937;margin:0 0 12px">All Transactions</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f9fafb"><th style="padding:6px 12px;text-align:left;color:#6b7280;font-size:12px">Date</th><th style="padding:6px 12px;text-align:left;color:#6b7280;font-size:12px">Title</th><th style="padding:6px 12px;text-align:left;color:#6b7280;font-size:12px">Category</th><th style="padding:6px 12px;text-align:right;color:#6b7280;font-size:12px">Amount</th></tr></thead>
        <tbody>${expenseRows}</tbody>
      </table>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px">
      Sent by FinFlow • Your personal finance tracker
    </div>
  </div>
</body>
</html>`;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors();
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const user = getUser(event);
  if (!user) return unauthorized();

  try {
    const { month, year } = JSON.parse(event.body || '{}');
    if (!month || !year) return badRequest('month and year required');

    const sql = getDb();
    const [userData] = await sql`SELECT name, email FROM users WHERE id = ${user.id}`;

    const expenses = await sql`
      SELECT * FROM expenses 
      WHERE user_id = ${user.id}
        AND EXTRACT(MONTH FROM expense_date) = ${parseInt(month)}
        AND EXTRACT(YEAR FROM expense_date) = ${parseInt(year)}
      ORDER BY expense_date
    `;

    const [budget] = await sql`
      SELECT * FROM budget_plans WHERE user_id = ${user.id} AND month = ${parseInt(month)} AND year = ${parseInt(year)}
    `;

    const csv = generateCSV(expenses, budget);
    const html = generateHTML(userData, expenses, budget, month, year);
    const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"FinFlow" <${process.env.SMTP_USER}>`,
      to: userData.email,
      subject: `💰 FinFlow: ${monthName} ${year} Expense Report`,
      html,
      attachments: [{
        filename: `finflow-${monthName}-${year}.csv`,
        content: csv,
        contentType: 'text/csv',
      }],
    });

    return ok({ sent: true, to: userData.email });
  } catch (err) {
    return serverError(err);
  }
};
