import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Plus, Send, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { ExpenseModal } from './ExpensesPage';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <div className="card animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', fontFamily: 'var(--mono)' }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{sub}</div>}
      </div>
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  </div>
);

const Dashboard = ({ onAddExpense }) => {
  const { user } = useAuth();
  const { currency } = useSettings();
  const fmt = (n) => currency.symbol + parseFloat(n || 0).toLocaleString('en-IN');
  const navigate = useNavigate();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, eRes] = await Promise.all([
          api.get(`/budget?month=${month}&year=${year}`),
          api.get(`/expenses?month=${month}&year=${year}`),
        ]);
        setBudget(bRes.data.plan);
        setExpenses(eRes.data.expenses || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [month, year]);

  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const income = parseFloat(budget?.income || 0);
  const remaining = income - totalSpent;
  const spentPct = income > 0 ? Math.min((totalSpent / income) * 100, 100) : 0;

  // Category breakdown
  const byCategory = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
  });
  const categoryData = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#06b6d4'];

  // Budget vs actual for plan categories
  const budgetVsActual = (budget?.categories || []).map(cat => ({
    name: cat.name.split('/')[0],
    budgeted: cat.amount,
    spent: byCategory[cat.name] || 0,
  }));

  const handleSaveExpense = async (form) => {
    const { data } = await api.post('/expenses', form);
    setExpenses(e => [data.expense, ...e]);
    toast.success('Expense added!');
  };

  const sendReport = async () => {
    setSending(true);
    try {
      await api.post('/send-report', { month, year });
      toast.success('Report sent to your email!');
    } catch {
      toast.error('Failed to send report. Check SMTP settings.');
    }
    setSending(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '32px', height: '32px' }} />
    </div>
  );

  return (
    <div>
      {showAddModal && (
        <ExpenseModal
          onSave={handleSaveExpense}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Hey {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>
            {MONTHS[month - 1]} {year} overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={sendReport} className="btn btn-ghost btn-sm" disabled={sending}>
            {sending ? <span className="spinner" /> : <Send size={14} />}
            Email Report
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={DollarSign} label="Income" value={income > 0 ? fmt(income) : 'Not Set'} sub={budget?.income_type || ''} color="#10b981" delay={0} />
        <StatCard icon={TrendingDown} label="Spent" value={fmt(totalSpent)} sub={`${spentPct.toFixed(0)}% of income`} color="#f43f5e" delay={50} />
        <StatCard icon={TrendingUp} label="Remaining" value={fmt(remaining)} sub={remaining < 0 ? '⚠️ Over budget' : '✅ On track'} color={remaining >= 0 ? '#6366f1' : '#f43f5e'} delay={100} />
        <StatCard icon={Target} label="Transactions" value={expenses.length} sub="this month" color="#f59e0b" delay={150} />
      </div>

      {/* No budget set */}
      {!budget && (
        <div className="card animate-fade-up" style={{ marginBottom: '24px', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)', textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💰</div>
          <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>Set Up Your Budget</h3>
          <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '20px' }}>
            Enter your salary or stipend and we'll suggest the perfect spending plan.
          </p>
          <button onClick={() => navigate('/budget')} className="btn btn-primary" style={{ margin: '0 auto' }}>
            Create Budget Plan <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Spend progress */}
      {budget && (
        <div className="card animate-fade-up" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>Monthly Budget Progress</span>
            <span style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{fmt(totalSpent)} / {fmt(income)}</span>
          </div>
          <div style={{ height: '10px', background: 'var(--bg3)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${spentPct}%`,
              borderRadius: '99px',
              background: spentPct > 90 ? 'var(--red)' : spentPct > 70 ? 'var(--yellow)' : 'linear-gradient(90deg, var(--accent), var(--accent2))',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text3)' }}>
            <span>{spentPct.toFixed(1)}% spent</span>
            <span>{fmt(remaining)} remaining</span>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Pie chart */}
        {categoryData.length > 0 && (
          <div className="card animate-fade-up" style={{ animationDelay: '200ms' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'var(--font)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {categoryData.slice(0, 6).map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text2)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  {cat.name.split('/')[0]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget vs Actual bar chart */}
        {budgetVsActual.length > 0 && (
          <div className="card animate-fade-up" style={{ animationDelay: '250ms' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>Budget vs Actual</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetVsActual} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'var(--font)' }} />
                <Bar dataKey="budgeted" fill="rgba(99,102,241,0.4)" radius={[4,4,0,0]} name="Budgeted" />
                <Bar dataKey="spent" fill="#6366f1" radius={[4,4,0,0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent expenses */}
      {expenses.length > 0 && (
        <div className="card animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '15px' }}>Recent Transactions</h3>
            <button onClick={() => navigate('/expenses')} className="btn btn-ghost btn-sm">View All <ArrowRight size={13} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expenses.slice(0, 8).map(exp => (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    {exp.category?.split(' ')[0] || '💸'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{exp.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{exp.category} • {new Date(exp.expense_date).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--red)', fontSize: '14px' }}>
                  -{fmt(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && budget && (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📝</div>
          <p>No expenses yet this month. Start tracking!</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ margin: '16px auto 0' }}>
            <Plus size={15} /> Add First Expense
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
