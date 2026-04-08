import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, Filter, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CATEGORIES = ['Food & Groceries','Transport','Rent/Housing','Entertainment','Investments/Savings','Health & Fitness','Shopping','Utilities','Education','Vacation/Travel','Miscellaneous'];

const ExpenseModal = ({ expense, onSave, onClose }) => {
  const [form, setForm] = useState(expense || {
    title: '', amount: '', category: 'Food & Groceries',
    expense_date: new Date().toISOString().slice(0, 10),
    notes: '', recurrence: 'none', is_yearly: false,
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSave = async () => {
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    setLoading(true);
    try { await onSave(form); onClose(); }
    catch { toast.error('Failed to save'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{expense?.id ? '✏️ Edit Expense' : '➕ Add Expense'}</div>
        <div className="form-group">
          <label className="label">Title</label>
          <input className="input" placeholder="e.g. Lunch at restaurant" value={form.title} onChange={set('title')} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Amount (₹)</label>
            <input className="input" type="number" placeholder="0" value={form.amount} onChange={set('amount')} />
          </div>
          <div className="form-group">
            <label className="label">Date</label>
            <input className="input" type="date" value={form.expense_date} onChange={set('expense_date')} />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Recurrence</label>
            <select className="input" value={form.recurrence} onChange={set('recurrence')}>
              <option value="none">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text2)' }}>
              <input type="checkbox" checked={form.is_yearly} onChange={set('is_yearly')} style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }} />
              Yearly Expense
            </label>
          </div>
        </div>
        <div className="form-group">
          <label className="label">Notes (optional)</label>
          <input className="input" placeholder="Any notes..." value={form.notes || ''} onChange={set('notes')} />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <Check size={15} />} Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpensesPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => { loadExpenses(); }, [month, year]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/expenses?month=${month}&year=${year}`);
      setExpenses(data.expenses || []);
    } catch { toast.error('Failed to load expenses'); }
    setLoading(false);
  };

  const handleSave = async (form) => {
    if (form.id) {
      const { data } = await api.put('/expenses', form);
      setExpenses(e => e.map(x => x.id === form.id ? data.expense : x));
      toast.success('Updated!');
    } else {
      const { data } = await api.post('/expenses', form);
      setExpenses(e => [data.expense, ...e]);
      toast.success('Expense added!');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses?id=${id}`);
      setExpenses(e => e.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || e.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalFiltered = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);
  const cats = ['All', ...new Set(expenses.map(e => e.category))];

  return (
    <div>
      {(showModal || editExp) && (
        <ExpenseModal
          expense={editExp}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditExp(null); }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Expenses</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Track where your money goes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card animate-fade-up" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="input" style={{ width: '130px' }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <input className="input" style={{ width: '90px' }} type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} />
          <div style={{ flex: '1', minWidth: '160px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input className="input" style={{ paddingLeft: '34px' }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: '170px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="badge badge-red" style={{ fontSize: '13px', padding: '6px 14px' }}>
            {filtered.length} transactions
          </div>
          <div className="badge badge-purple" style={{ fontSize: '13px', padding: '6px 14px' }}>
            Total: {fmt(totalFiltered)}
          </div>
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '68px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <p>No expenses found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(exp => (
            <div key={exp.id} className="card animate-fade-in" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {exp.category?.split(' ')[0] || '💸'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                  {exp.category} • {new Date(exp.expense_date).toLocaleDateString('en-IN')}
                  {exp.recurrence !== 'none' && <span className="badge badge-blue" style={{ marginLeft: '6px', padding: '1px 7px', fontSize: '11px' }}>{exp.recurrence}</span>}
                  {exp.is_yearly && <span className="badge badge-yellow" style={{ marginLeft: '6px', padding: '1px 7px', fontSize: '11px' }}>yearly</span>}
                </div>
              </div>
              {exp.notes && (
                <div style={{ fontSize: '12px', color: 'var(--text3)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exp.notes}
                </div>
              )}
              <div style={{ fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--red)', fontSize: '15px', flexShrink: 0 }}>
                -{fmt(exp.amount)}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => setEditExp(exp)} className="btn btn-ghost btn-sm" style={{ padding: '7px' }}><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(exp.id)} className="btn btn-danger btn-sm" style={{ padding: '7px' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
