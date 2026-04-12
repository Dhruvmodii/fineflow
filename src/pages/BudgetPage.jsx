import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wand2, Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useSettings } from '../hooks/useSettings';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EMOJIS = ['🏠','🍛','⛽','📈','🎬','💪','✈️','🛍️','💊','📚','🎮','☕','👔','🐾','💡'];
const COLORS_PRESET = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#f43f5e','#06b6d4','#84cc16','#f97316'];

const BudgetPage = () => {
  const { currency } = useSettings();
  const fmt = (n) => currency.symbol + parseFloat(n || 0).toLocaleString('en-IN');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [income, setIncome] = useState('');
  const [incomeType, setIncomeType] = useState('salary');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState({});
  const [plan, setPlan] = useState(null);

  useEffect(() => { loadPlan(); }, [month, year]);

  const loadPlan = async () => {
    try {
      const { data } = await api.get(`/budget?month=${month}&year=${year}`);
      if (data.plan) {
        setPlan(data.plan);
        setIncome(data.plan.income);
        setIncomeType(data.plan.income_type);
        setCategories(data.plan.categories || []);
      } else {
        setPlan(null); setCategories([]);
      }
    } catch {}
  };

  const getSuggestion = async () => {
    if (!income || parseFloat(income) <= 0) { toast.error('Enter income first'); return; }
    setSuggesting(true);
    try {
      const { data } = await api.get(`/budget-suggest?income=${income}`);
      setCategories(data.categories);
      toast.success('Smart allocation applied!');
    } catch { toast.error('Failed to get suggestion'); }
    setSuggesting(false);
  };

  const save = async () => {
    if (!income) { toast.error('Enter your income'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/budget', { month, year, income: parseFloat(income), income_type: incomeType, categories });
      setPlan(data.plan);
      toast.success('Budget saved!');
    } catch { toast.error('Failed to save'); }
    setLoading(false);
  };

  const addCategory = () => {
    setCategories(c => [...c, { name: 'New Category', emoji: '🛍️', percentage: 5, amount: Math.round(parseFloat(income || 0) * 0.05), color: COLORS_PRESET[c.length % COLORS_PRESET.length] }]);
  };

  const removeCategory = (i) => setCategories(c => c.filter((_, idx) => idx !== i));

  const startEdit = (i) => { setEditIdx(i); setEditVal({ ...categories[i] }); };
  const saveEdit = () => {
    const newCats = [...categories];
    const pct = parseFloat(editVal.percentage) || 0;
    newCats[editIdx] = { ...editVal, amount: Math.round(parseFloat(income || 0) * pct / 100) };
    setCategories(newCats);
    setEditIdx(null);
  };

  const totalAllocated = categories.reduce((s, c) => s + (c.amount || 0), 0);
  const incomeNum = parseFloat(income || 0);
  const unallocated = incomeNum - totalAllocated;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Budget Planner</h1>
        <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Set your income and allocate your money smartly</p>
      </div>

      {/* Month/Year picker */}
      <div className="card animate-fade-up" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '140px' }}>
            <label className="label">Month</label>
            <select className="input" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '100px' }}>
            <label className="label">Year</label>
            <input className="input" type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} min="2020" max="2030" />
          </div>
          <div style={{ flex: '2', minWidth: '160px' }}>
            <label className="label">Income / Stipend ({currency.symbol})</label>
            <input className="input" type="number" placeholder="e.g. 15000" value={income} onChange={e => setIncome(e.target.value)} />
          </div>
          <div style={{ flex: '1', minWidth: '140px' }}>
            <label className="label">Type</label>
            <select className="input" value={incomeType} onChange={e => setIncomeType(e.target.value)}>
              <option value="salary">Salary</option>
              <option value="stipend">Stipend</option>
              <option value="freelance">Freelance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button onClick={getSuggestion} className="btn btn-ghost" disabled={suggesting} style={{ flexShrink: 0 }}>
            {suggesting ? <span className="spinner" /> : <Wand2 size={15} />}
            AI Suggest
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Categories */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '15px' }}>Budget Categories</h3>
            <button onClick={addCategory} className="btn btn-ghost btn-sm"><Plus size={13} /> Add</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat, i) => (
              <div key={i} className="card" style={{ padding: '14px', borderColor: editIdx === i ? 'var(--accent)' : 'var(--border)' }}>
                {editIdx === i ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select className="input" style={{ width: '60px', padding: '8px' }} value={editVal.emoji} onChange={e => setEditVal(v => ({ ...v, emoji: e.target.value }))}>
                        {EMOJIS.map(em => <option key={em}>{em}</option>)}
                      </select>
                      <input className="input" placeholder="Category name" value={editVal.name} onChange={e => setEditVal(v => ({ ...v, name: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input className="input" type="number" placeholder="%" value={editVal.percentage} onChange={e => setEditVal(v => ({ ...v, percentage: e.target.value }))} style={{ maxWidth: '80px' }} />
                      <span style={{ color: 'var(--text3)', fontSize: '13px' }}>% = {fmt(Math.round(incomeNum * (editVal.percentage || 0) / 100))}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                        <button onClick={saveEdit} className="btn btn-primary btn-sm"><Check size={12} /></button>
                        <button onClick={() => setEditIdx(null)} className="btn btn-ghost btn-sm"><X size={12} /></button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{cat.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                        {cat.percentage}% of income
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '99px', marginTop: '6px' }}>
                        <div style={{ height: '100%', width: `${Math.min(cat.percentage, 100)}%`, background: cat.color, borderRadius: '99px' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: '700', fontSize: '14px' }}>{fmt(cat.amount)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => startEdit(i)} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}><Edit2 size={12} /></button>
                      <button onClick={() => removeCategory(i)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {incomeNum > 0 && (
            <div className="card" style={{ marginTop: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text3)' }}>Total Allocated</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{fmt(totalAllocated)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text3)' }}>Unallocated</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: '600', color: unallocated < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(unallocated)}</span>
              </div>
              {unallocated < 0 && <p style={{ fontSize: '12px', color: 'var(--red)' }}>⚠️ You've allocated more than your income!</p>}
            </div>
          )}

          <button onClick={save} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }} disabled={loading}>
            {loading ? <span className="spinner" /> : <Save size={15} />}
            {plan ? 'Update Budget Plan' : 'Save Budget Plan'}
          </button>
        </div>

        {/* Pie chart */}
        {categories.length > 0 && (
          <div className="card animate-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px', alignSelf: 'flex-start' }}>Allocation Overview</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" outerRadius={110} dataKey="amount" nameKey="name" paddingAngle={2}>
                  {categories.map((cat, i) => <Cell key={i} fill={cat.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', fontFamily: 'var(--font)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {categories.map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: cat.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text2)', flex: 1 }}>{cat.emoji} {cat.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: '600' }}>{fmt(cat.amount)}</span>
                  <span style={{ color: 'var(--text3)', minWidth: '36px', textAlign: 'right' }}>{cat.percentage}%</span>
                </div>
              ))}
            </div>
            {incomeNum > 0 && (
              <div style={{ marginTop: '16px', width: '100%', padding: '14px', background: 'var(--bg3)', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Total Income</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '22px', fontWeight: '800' }}>{fmt(incomeNum)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'capitalize', marginTop: '2px' }}>{incomeType}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetPage;
