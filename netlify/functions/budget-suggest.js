const { ok, badRequest, cors } = require('./_db');

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
  const { income } = event.queryStringParameters || {};
  if (!income) return badRequest('income required');
  return ok({ categories: suggestBudget(parseFloat(income)) });
};
