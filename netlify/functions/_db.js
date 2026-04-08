const { neon } = require('@neondatabase/serverless');

let sql;

const getDb = () => {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const response = (statusCode, body) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

const ok = (data) => response(200, data);
const created = (data) => response(201, data);
const badRequest = (msg) => response(400, { error: msg });
const unauthorized = () => response(401, { error: 'Unauthorized' });
const forbidden = () => response(403, { error: 'Forbidden' });
const notFound = (msg = 'Not found') => response(404, { error: msg });
const serverError = (err) => {
  console.error(err);
  return response(500, { error: 'Internal server error' });
};

const cors = () => response(200, {});

module.exports = { getDb, ok, created, badRequest, unauthorized, forbidden, notFound, serverError, cors, headers };
