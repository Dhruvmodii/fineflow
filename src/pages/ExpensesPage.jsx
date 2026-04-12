import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, Check, X, Zap, Tag, Calendar, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useSettings } from '../hooks/useSettings';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const CATEGORIES = [
  { label: 'Food & Groceries', emoji: '🍔' },
  { label: 'Transport', emoji: '🚗' },
  { label: 'Rent/Housing', emoji: '🏠' },
  { label: 'Entertainment', emoji: '🎬' },
  { label: 'Investments/Savings', emoji: '📈' },
  { label: 'Health & Fitness', emoji: '💪' },
  { label: 'Shopping', emoji: '🛍️' },
  { label: 'Utilities', emoji: '⚡' },
  { label: 'Education', emoji: '📚' },
  { label: 'Vacation/Travel', emoji: '✈️' },
  { label: 'Miscellaneous', emoji: '📦' },
];

export const ExpenseModal = ({ expense, onSave, onClose }) => {
  const { currency } = useSettings();
  const [form, setForm] = useState(expense || {
    title: '', amount: '', category: 'Food & Groceries',
    expense_date: new Date().toISOString().slice(0, 10),
    notes: '', recurrence: 'none', is_yearly: false,
  });
  const [loading, setLoading] = useState(false);
  const [quickMode, setQuickMode] = useState(!expense?.id);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!expense?.id;
  const selectedCat = CATEGORIES.find(c => c.label === form.category) || CATEGORIES[0];

  const handleSave = async () => {
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    setLoading(true);
    try { await onSave(form); onClose(); }
    catch { toast.error('Failed to save'); }
    setLoading(false);
  };

  if (!isEdit && quickMode) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: '380px', padding: '28px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
              <Zap size={24} color="white" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Add Expense</h2>
            <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '4px' }}>Quick & easy — done in seconds</p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(99,102,241,0.08)', border: '2px solid rgba(99,102,241,0.3)', borderRadius: '14px', padding: '4px 16px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent3)', fontFamily: 'var(--mono)', marginRight: '4px' }}>{currency.symbol}</span>
              <input
                autoFocus
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={e => set('amount')(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && form.amount && document.getElementById('exp-title-quick')?.focus()}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '32px', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--mono)', padding: '12px 0' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <input
              id="exp-title-quick"
              className="input"
              placeholder="What was this for? (e.g. Lunch)"
              value={form.title}
              onChange={e => set('title')(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && form.amount && form.title && handleSave()}
              style={{ fontSize: '15px', padding: '14px 16px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.label} onClick={() => set('category')(cat.label)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font)', background: form.category === cat.label ? 'rgba(99,102,241,0.2)' : 'var(--bg3)', color: form.category === cat.label ? 'var(--accent3)' : 'var(--text2)', outline: form.category === cat.label ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent', transition: 'all 0.15s' }}>
                  <span>{cat.emoji}</span> {cat.label.split('/')[0].split(' &')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button onClick={() => setQuickMode(false)} className="btn btn-ghost" style={{ flex: 1, fontSize: '13px' }}>More Options</button>
            <button onClick={handleSave} disabled={!form.amount || !form.title || loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : <Check size={15} />} Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: isEdit ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {isEdit ? '✏️' : selectedCat.emoji}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>Fill in the details below</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '7px' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent3)', fontWeight: '700', fontFamily: 'var(--mono)', fontSize: '15px' }}>{currency.symbol}</span>
              <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => set('amount')(e.target.value)} style={{ paddingLeft: '28px', fontFamily: 'var(--mono)', fontWeight: '700' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Lunch at restaurant" value={form.title} onChange={e => set('title')(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={11} /> Date</label>
          <input className="input" type="date" value={form.expense_date} onChange={e => set('expense_date')(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Tag size={11} /> Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => set('category')(cat.label)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font)', background: form.category === cat.label ? 'rgba(99,102,241,0.2)' : 'var(--bg3)', color: form.category === cat.label ? 'var(--accent3)' : 'var(--text2)', outline: form.category === cat.label ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent', transition: 'all 0.15s' }}>
                <span>{cat.emoji}</span> {cat.label.split('/')[0].split(' &')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><RefreshCw size={11} /> Recurrence</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['none', 'monthly', 'yearly'].map(r => (
              <button key={r} onClick={() => set('recurrence')(r)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: 'var(--font)', background: form.recurrence === r ? 'rgba(99,102,241,0.2)' : 'var(--bg3)', color: form.recurrence === r ? 'var(--accent3)' : 'var(--text2)', outline: form.recurrence === r ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent', transition: 'all 0.15s' }}>
                {r === 'none' ? 'One-time' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={11} /> Notes (optional)</label>
          <input className="input" placeholder="Any additional notes..." value={form.notes || ''} onChange={e => set('notes')(e.target.value)} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label onClick={() => set('is_yearly')(!form.is_yearly)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 14px', background: 'var(--bg3)', borderRadius: '10px', border: form.is_yearly ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)', transition: 'all 0.15s' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, background: form.is_yearly ? 'var(--accent)' : 'var(--bg2)', border: form.is_yearly ? 'none' : '1.5px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {form.is_yearly && <Check size={11} color="white" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: '14px', color: form.is_yearly ? 'var(--text)' : 'var(--text2)', fontWeight: '500' }}>Mark as yearly expense</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>Annual cost</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
            {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : <Check size={15} />}
            {isEdit ? 'Update' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpensesPage = ({ openAddModal, onModalClose }) => {
  const { currency } = useSettings();
  const fmt = (n) => currency.symbol + parseFloat(n || 0).toLocaleString('en-IN');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    if (openAddModal) { setShowModal(true); if (onModalClose) onModalClose(); }
  }, [openAddModal]);

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
  const getCatEmoji = (cat) => CATEGORIES.find(c => c.label === cat)?.emoji || '💸';

  return (
    <div>
      {(showModal || editExp) && (
        <ExpenseModal expense={editExp} onSave={handleSave} onClose={() => { setShowModal(false); setEditExp(null); }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Expenses</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Track where your money goes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={15} /> Add Expense</button>
      </div>

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

      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="badge badge-red" style={{ fontSize: '13px', padding: '6px 14px' }}>{filtered.length} transactions</div>
          <div className="badge badge-purple" style={{ fontSize: '13px', padding: '6px 14px' }}>Total: {fmt(totalFiltered)}</div>
        </div>
      )}

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
                {getCatEmoji(exp.category)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span>{exp.category}</span>
                  <span>•</span>
                  <span>{new Date(exp.expense_date).toLocaleDateString('en-IN')}</span>
                  {exp.recurrence !== 'none' && <span className="badge badge-blue" style={{ padding: '1px 7px', fontSize: '11px' }}>{exp.recurrence}</span>}
                  {exp.is_yearly && <span className="badge badge-yellow" style={{ padding: '1px 7px', fontSize: '11px' }}>yearly</span>}
                  {exp.notes && <span style={{ fontStyle: 'italic' }}>• {exp.notes}</span>}
                </div>
              </div>
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
