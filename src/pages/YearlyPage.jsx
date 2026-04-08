import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Edit2, Calendar, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORIES = ['Food & Groceries','Transport','Rent/Housing','Entertainment','Investments/Savings','Health & Fitness','Shopping','Utilities','Education','Vacation/Travel','Miscellaneous'];

const YearlyPage = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Vacation/Travel', expense_date: new Date().toISOString().slice(0,10), notes: '', is_yearly: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all months for the year
      const promises = Array.from({ length: 12 }, (_, i) =>
        api.get(`/expenses?month=${i+1}&year=${year}`).then(r => ({ month: i + 1, expenses: r.data.expenses || [] }))
      );
      const results = await Promise.all(promises);

      const monthly = results.map(r => ({
        name: MONTHS[r.month - 1],
        total: r.expenses.reduce((s, e) => s + parseFloat(e.amount), 0),
        count: r.expenses.length,
      }));
      setMonthlyData(monthly);

      // Get yearly-tagged expenses
      const { data } = await api.get('/expenses?is_yearly=true');
      setExpenses((data.expenses || []).filter(e => new Date(e.expense_date).getFullYear() === year));
    } catch {}
    setLoading(false);
  };

  const totalYear = monthlyData.reduce((s, m) => s + m.total, 0);
  const avgMonth = monthlyData.length > 0 ? totalYear / 12 : 0;
  const bestMonth = monthlyData.reduce((best, m) => m.total < best.total ? m : best, { total: Infinity, name: '—' });

  const handleAdd = async () => {
    if (!form.title || !form.amount) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/expenses', { ...form, is_yearly: true });
      setExpenses(e => [data.expense, ...e]);
      setShowAdd(false);
      setForm({ title: '', amount: '', category: 'Vacation/Travel', expense_date: new Date().toISOString().slice(0,10), notes: '', is_yearly: true });
      toast.success('Yearly expense added!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/expenses?id=${id}`);
    setExpenses(e => e.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Yearly Overview</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Annual spending analysis and big expenses</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input className="input" type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '90px' }} />
          <button onClick={() => setShowAdd(s => !s)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Yearly Expense
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card animate-fade-up" style={{ marginBottom: '20px', borderColor: 'var(--accent)' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>📅 Add Yearly Expense</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. Insurance Premium" value={form.title} onChange={set('title')} />
            </div>
            <div className="form-group">
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" placeholder="0" value={form.amount} onChange={set('amount')} />
            </div>
            <div className="form-group">
              <label className="label">Date</label>
              <input className="input" type="date" value={form.expense_date} onChange={set('expense_date')} />
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <input className="input" placeholder="Optional notes..." value={form.notes} onChange={set('notes')} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm">Cancel</button>
            <button onClick={handleAdd} className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="spinner" /> : <Check size={13} />} Save
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Spent', value: fmt(totalYear), color: 'var(--accent)' },
          { label: 'Monthly Avg', value: fmt(avgMonth), color: 'var(--yellow)' },
          { label: 'Lowest Month', value: bestMonth.name, color: 'var(--green)', sub: fmt(bestMonth.total) },
          { label: 'Big Expenses', value: expenses.length, color: 'var(--pink)', sub: 'tracked' },
        ].map((s, i) => (
          <div key={i} className="card animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--mono)', color: s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card animate-fade-up" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>Monthly Spending — {year}</h3>
        {loading ? (
          <div className="skeleton" style={{ height: '220px' }} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text3)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text3)' }} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'var(--font)' }} />
              <Bar dataKey="total" fill="url(#barGrad)" radius={[6,6,0,0]} name="Spent" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Yearly expenses list */}
      <div className="card animate-fade-up">
        <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} /> Big Yearly Expenses
        </h3>
        {expenses.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
            No yearly expenses tracked. Add insurance, subscriptions, vacations etc.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expenses.map(exp => (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg3)', borderRadius: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {exp.category?.split(' ')[0] || '📅'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{exp.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                    {exp.category} • {new Date(exp.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: '700', fontSize: '15px', color: 'var(--yellow)' }}>{fmt(exp.amount)}</div>
                <button onClick={() => handleDelete(exp.id)} className="btn btn-danger btn-sm" style={{ padding: '7px' }}><Trash2 size={13} /></button>
              </div>
            ))}
            <div style={{ marginTop: '8px', padding: '12px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Total Yearly Expenses</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: '800', fontSize: '16px', color: 'var(--accent3)' }}>
                {fmt(expenses.reduce((s, e) => s + parseFloat(e.amount), 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearlyPage;
