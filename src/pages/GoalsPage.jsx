import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Target, Calendar, TrendingUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../hooks/useSettings';

const GOAL_EMOJIS = ['🎯','⌚','🏠','🚗','✈️','💻','📱','🎓','💍','🏋️','🎸','🛥️','🌍','💰','🎮','📷'];

const GoalModal = ({ goal, onSave, onClose }) => {
  const { currency } = useSettings();
  const [form, setForm] = useState(goal || {
    title: '', emoji: '🎯', targetAmount: '', savedAmount: '', deadline: '',
    monthlyIncome: '', notes: '',
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title || !form.targetAmount) { toast.error('Title and target amount required'); return; }
    onSave({ ...form, id: form.id || Date.now().toString() });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(99,102,241,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
              {form.emoji}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{goal?.id ? 'Edit Goal' : 'New Goal'}</h2>
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>Define what you're saving for</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '7px' }}><X size={16} /></button>
        </div>

        {/* Emoji picker */}
        <div className="form-group">
          <label className="label">Choose an Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {GOAL_EMOJIS.map(e => (
              <button key={e} onClick={() => set('emoji')(e)} style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '18px', background: form.emoji === e ? 'rgba(99,102,241,0.2)' : 'var(--bg3)', outline: form.emoji === e ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent', transition: 'all 0.15s' }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Goal Title</label>
          <input className="input" placeholder="e.g. Buy a luxury watch" value={form.title} onChange={e => set('title')(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Target Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent3)', fontWeight: '700', fontFamily: 'var(--mono)' }}>{currency.symbol}</span>
              <input className="input" type="number" placeholder="0" value={form.targetAmount} onChange={e => set('targetAmount')(e.target.value)} style={{ paddingLeft: '28px', fontFamily: 'var(--mono)', fontWeight: '700' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Already Saved</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontWeight: '700', fontFamily: 'var(--mono)' }}>{currency.symbol}</span>
              <input className="input" type="number" placeholder="0" value={form.savedAmount} onChange={e => set('savedAmount')(e.target.value)} style={{ paddingLeft: '28px', fontFamily: 'var(--mono)' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={11} /> Target Date (optional)</label>
            <input className="input" type="date" value={form.deadline} onChange={e => set('deadline')(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Monthly Savings Budget</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{currency.symbol}</span>
              <input className="input" type="number" placeholder="Optional" value={form.monthlyIncome} onChange={e => set('monthlyIncome')(e.target.value)} style={{ paddingLeft: '28px', fontFamily: 'var(--mono)' }} />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Notes (optional)</label>
          <input className="input" placeholder="Why is this goal important?" value={form.notes || ''} onChange={e => set('notes')(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" style={{ minWidth: '110px' }}>
            <Check size={15} /> {goal?.id ? 'Update' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

const GoalsPage = () => {
  const { currency } = useSettings();
  const fmt = (n) => currency.symbol + parseFloat(n || 0).toLocaleString('en-IN');

  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('finflow_goals') || '[]'); } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  const saveGoals = (updated) => {
    setGoals(updated);
    localStorage.setItem('finflow_goals', JSON.stringify(updated));
  };

  const handleSave = (goal) => {
    if (goal.id && goals.find(g => g.id === goal.id)) {
      saveGoals(goals.map(g => g.id === goal.id ? goal : g));
      toast.success('Goal updated!');
    } else {
      saveGoals([...goals, goal]);
      toast.success('Goal created! 🎯');
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this goal?')) return;
    saveGoals(goals.filter(g => g.id !== id));
    toast.success('Goal deleted');
  };

  const handleAddSavings = (id, amount) => {
    const updated = goals.map(g => {
      if (g.id !== id) return g;
      const newSaved = Math.min(parseFloat(g.savedAmount || 0) + parseFloat(amount), parseFloat(g.targetAmount));
      return { ...g, savedAmount: newSaved.toString() };
    });
    saveGoals(updated);
    toast.success(`${fmt(amount)} added to goal!`);
  };

  const calcGoalStats = (goal) => {
    const target = parseFloat(goal.targetAmount || 0);
    const saved = parseFloat(goal.savedAmount || 0);
    const remaining = Math.max(target - saved, 0);
    const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    let monthsNeeded = null;
    let monthlyNeeded = null;

    if (goal.deadline) {
      const now = new Date();
      const deadline = new Date(goal.deadline);
      const months = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30)));
      monthsNeeded = months;
      monthlyNeeded = months > 0 ? remaining / months : remaining;
    } else if (goal.monthlyIncome) {
      const monthly = parseFloat(goal.monthlyIncome);
      monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : null;
      monthlyNeeded = monthly;
    }

    return { target, saved, remaining, pct, monthsNeeded, monthlyNeeded };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Goals 🎯</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Save for the things that matter most</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={15} /> New Goal</button>
      </div>

      {(showModal || editGoal) && (
        <GoalModal goal={editGoal} onSave={handleSave} onClose={() => { setShowModal(false); setEditGoal(null); }} />
      )}

      {goals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No Goals Yet</h3>
          <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>
            Set a savings goal — a watch, a trip, a new phone — and track your progress month by month.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <Plus size={15} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {goals.map(goal => {
            const { target, saved, remaining, pct, monthsNeeded, monthlyNeeded } = calcGoalStats(goal);
            const isComplete = pct >= 100;

            return (
              <div key={goal.id} className="card animate-fade-up" style={{ position: 'relative', overflow: 'hidden', border: isComplete ? '1px solid rgba(16,185,129,0.4)' : 'var(--border)' }}>
                {isComplete && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--green), #34d399)' }} />
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isComplete ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {isComplete ? '✅' : goal.emoji}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{goal.title}</div>
                      {goal.notes && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{goal.notes}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => setEditGoal(goal)} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(goal.id)} className="btn btn-danger btn-sm" style={{ padding: '6px' }}><Trash2 size={12} /></button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--text)', fontSize: '15px' }}>{fmt(saved)}</span>
                      <span style={{ color: 'var(--text3)' }}> / {fmt(target)}</span>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: isComplete ? 'var(--green)' : 'var(--accent3)', fontFamily: 'var(--mono)' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg3)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: isComplete ? 'linear-gradient(90deg, var(--green), #34d399)' : 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Stats row */}
                {!isComplete && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Still Need</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'var(--mono)', color: 'var(--red)' }}>{fmt(remaining)}</div>
                    </div>
                    {monthlyNeeded != null && (
                      <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Per Month</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'var(--mono)', color: 'var(--yellow)' }}>{fmt(Math.ceil(monthlyNeeded))}</div>
                      </div>
                    )}
                    {monthsNeeded != null && (
                      <div style={{ background: 'var(--bg3)', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{goal.deadline ? 'Months Left' : 'Months to Go'}</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{monthsNeeded}</div>
                      </div>
                    )}
                  </div>
                )}

                {goal.deadline && !isComplete && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
                    <Calendar size={12} />
                    <span>Target: {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}

                {isComplete ? (
                  <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--green)' }}>
                    🎉 Goal Achieved! Congratulations!
                  </div>
                ) : (
                  <AddSavingsRow onAdd={(amt) => handleAddSavings(goal.id, amt)} currency={currency} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AddSavingsRow = ({ onAdd, currency }) => {
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '13px', gap: '6px' }}>
        <TrendingUp size={14} /> Add Savings
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent3)', fontFamily: 'var(--mono)', fontWeight: '700', fontSize: '13px' }}>{currency.symbol}</span>
        <input autoFocus className="input" type="number" placeholder="Amount" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && val && (onAdd(val), setVal(''), setShow(false))} style={{ paddingLeft: '26px', padding: '8px 8px 8px 26px', fontSize: '13px' }} />
      </div>
      <button onClick={() => { if (val) { onAdd(val); setVal(''); setShow(false); } }} className="btn btn-primary btn-sm"><Check size={14} /></button>
      <button onClick={() => setShow(false)} className="btn btn-ghost btn-sm"><X size={14} /></button>
    </div>
  );
};

export default GoalsPage;
