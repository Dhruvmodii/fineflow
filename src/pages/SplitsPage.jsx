import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowRight, Check, X, DollarSign, UserPlus, ChevronLeft, Repeat } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';

const ICONS = ['🏠','✈️','🎉','🍕','🏖️','🚗','💼','🎮','🏋️','👥'];

// ───── Create Group Modal ─────
const CreateGroupModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', description: '', icon: '🏠', member_emails: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name) { toast.error('Group name required'); return; }
    setLoading(true);
    try {
      const emails = form.member_emails.split(',').map(e => e.trim()).filter(Boolean);
      const { data } = await api.post('/groups', { ...form, member_emails: emails });
      onCreate(data.group);
      onClose();
      toast.success('Group created!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">🏘️ Create Group</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={() => setForm(f => ({...f, icon: ic}))}
              style={{ fontSize: '22px', padding: '8px', borderRadius: '10px', border: `2px solid ${form.icon === ic ? 'var(--accent)' : 'var(--border)'}`, background: form.icon === ic ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer' }}>
              {ic}
            </button>
          ))}
        </div>
        <div className="form-group">
          <label className="label">Group Name</label>
          <input className="input" placeholder='e.g. "Italy Trip 2026"' value={form.name} onChange={set('name')} />
        </div>
        <div className="form-group">
          <label className="label">Description (optional)</label>
          <input className="input" placeholder="What's this group for?" value={form.description} onChange={set('description')} />
        </div>
        <div className="form-group">
          <label className="label">Invite Members (comma-separated emails)</label>
          <input className="input" placeholder="friend@email.com, roommate@email.com" value={form.member_emails} onChange={set('member_emails')} />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleCreate} className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <Plus size={14} />} Create
          </button>
        </div>
      </div>
    </div>
  );
};

// ───── Add Expense Modal ─────
const AddExpenseModal = ({ group, members, onClose, onAdd }) => {
  const { user } = useAuth();
  const { currency } = useSettings();
  const fmt = (n) => currency.symbol + parseFloat(n || 0).toLocaleString('en-IN');
  const [form, setForm] = useState({ title: '', amount: '', split_type: 'equal', expense_date: new Date().toISOString().slice(0,10), notes: '', is_recurring: false, recurrence: 'none' });
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  useEffect(() => {
    if (members.length && form.amount) recalcSplits();
  }, [form.amount, form.split_type, members]);

  const recalcSplits = () => {
    const amt = parseFloat(form.amount) || 0;
    const count = members.length;
    let newSplits;
    if (form.split_type === 'equal') {
      const each = Math.round((amt / count) * 100) / 100;
      newSplits = members.map(m => ({ user_id: m.user_id, name: m.name, amount: each, percentage: Math.round(100 / count) }));
    } else {
      newSplits = splits.length === members.length ? splits : members.map(m => ({ user_id: m.user_id, name: m.name, amount: 0, percentage: 0 }));
    }
    setSplits(newSplits);
  };

  const updateSplit = (i, field, val) => {
    const newSplits = [...splits];
    newSplits[i] = { ...newSplits[i], [field]: parseFloat(val) || 0 };
    if (field === 'percentage') newSplits[i].amount = Math.round((parseFloat(form.amount) || 0) * val / 100 * 100) / 100;
    setSplits(newSplits);
  };

  const handleAdd = async () => {
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    setLoading(true);
    try {
      const finalSplits = splits.length ? splits : members.map(m => ({ user_id: m.user_id, name: m.name, amount: parseFloat(form.amount) / members.length }));
      const { data } = await api.post('/groups?action=add_expense', { group_id: group.id, ...form, splits: finalSplits });
      onAdd(data.expense);
      onClose();
      toast.success('Expense added!');
    } catch { toast.error('Failed to add expense'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-title">💸 Add Group Expense</div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" placeholder="Dinner, Hotel, etc." value={form.title} onChange={set('title')} />
          </div>
          <div className="form-group">
            <label className="label">Amount ({currency.symbol})</label>
            <input className="input" type="number" placeholder="0" value={form.amount} onChange={set('amount')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Split Type</label>
            <select className="input" value={form.split_type} onChange={set('split_type')}>
              <option value="equal">Equal</option>
              <option value="percentage">By Percentage</option>
              <option value="exact">Exact Amounts</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Date</label>
            <input className="input" type="date" value={form.expense_date} onChange={set('expense_date')} />
          </div>
        </div>

        {/* Split preview */}
        {splits.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label className="label">Splits</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {splits.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', flex: 1, color: s.user_id === user?.id ? 'var(--accent3)' : 'var(--text2)', fontWeight: s.user_id === user?.id ? '600' : '400' }}>
                    {s.name} {s.user_id === user?.id ? '(you)' : ''}
                  </span>
                  {form.split_type === 'equal' ? (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>{fmt(s.amount)}</span>
                  ) : form.split_type === 'percentage' ? (
                    <input type="number" className="input" style={{ width: '60px', padding: '4px 8px', fontSize: '12px' }} placeholder="%" value={s.percentage || ''} onChange={e => updateSplit(i, 'percentage', e.target.value)} />
                  ) : (
                    <input type="number" className="input" style={{ width: '90px', padding: '4px 8px', fontSize: '12px' }} placeholder={`${currency.symbol}0`} value={s.amount || ''} onChange={e => updateSplit(i, 'amount', e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="label">Notes</label>
            <input className="input" placeholder="Optional..." value={form.notes} onChange={set('notes')} />
          </div>
          <div className="form-group">
            <label className="label">Recurring?</label>
            <select className="input" value={form.recurrence} onChange={set('recurrence')}>
              <option value="none">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleAdd} className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <Check size={14} />} Add Expense
          </button>
        </div>
      </div>
    </div>
  );
};

// ───── Group Detail View ─────
const GroupDetail = ({ groupId, onBack }) => {
  const { user } = useAuth();
  const { currency } = useSettings();
  const fmt = (n) => currency.symbol + parseFloat(n || 0).toLocaleString('en-IN');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExp, setShowAddExp] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [settling, setSettling] = useState(null);
  const [settleAmt, setSettleAmt] = useState('');

  useEffect(() => { loadGroup(); }, [groupId]);

  const loadGroup = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get(`/groups?group_id=${groupId}`);
      setData(d);
    } catch { toast.error('Failed to load group'); }
    setLoading(false);
  };

  const addMember = async () => {
    if (!newMemberEmail) return;
    try {
      await api.post('/groups?action=add_member', { group_id: groupId, email: newMemberEmail });
      setNewMemberEmail('');
      loadGroup();
      toast.success('Member added!');
    } catch (err) { toast.error(err.response?.data?.error || 'User not found'); }
  };

  const settle = async (debt) => {
    if (!settleAmt) return;
    try {
      await api.post('/groups?action=settle', { group_id: groupId, paid_to: debt.to, amount: parseFloat(settleAmt) });
      setSettling(null); setSettleAmt('');
      loadGroup();
      toast.success('Settlement recorded!');
    } catch { toast.error('Failed'); }
  };

  const memberName = (id) => data?.members?.find(m => m.user_id === id)?.name || 'Unknown';
  const memberColor = (id) => data?.members?.find(m => m.user_id === id)?.avatar_color || '#6366f1';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>;
  if (!data) return null;

  const { group, members, expenses, debts } = data;
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const myDebts = debts.filter(d => d.from === user?.id);
  const owedToMe = debts.filter(d => d.to === user?.id);

  return (
    <div>
      {showAddExp && <AddExpenseModal group={group} members={members} onClose={() => setShowAddExp(false)} onAdd={() => loadGroup()} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ padding: '8px' }}><ChevronLeft size={16} /></button>
        <span style={{ fontSize: '28px' }}>{group.icon}</span>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>{group.name}</h1>
          {group.description && <p style={{ fontSize: '13px', color: 'var(--text3)' }}>{group.description}</p>}
        </div>
        <button onClick={() => setShowAddExp(true)} className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
          <Plus size={14} /> Add Expense
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Balance summary */}
          <div className="card">
            <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '14px' }}>💰 Your Balance</h3>
            {myDebts.length === 0 && owedToMe.length === 0 ? (
              <p style={{ color: 'var(--green)', fontSize: '14px', fontWeight: '600' }}>✅ You're all settled up!</p>
            ) : (
              <>
                {myDebts.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px' }}>You owe <strong>{memberName(d.to)}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--red)' }}>{fmt(d.amount)}</span>
                      <button onClick={() => { setSettling(d); setSettleAmt(d.amount); }} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>Settle</button>
                    </div>
                  </div>
                ))}
                {owedToMe.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px' }}><strong>{memberName(d.from)}</strong> owes you</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--green)' }}>{fmt(d.amount)}</span>
                  </div>
                ))}
              </>
            )}
            {settling && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg3)', borderRadius: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Record settlement with {memberName(settling.to)}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="input" type="number" value={settleAmt} onChange={e => setSettleAmt(e.target.value)} style={{ flex: 1 }} />
                  <button onClick={() => settle(settling)} className="btn btn-primary btn-sm"><Check size={13} /></button>
                  <button onClick={() => setSettling(null)} className="btn btn-ghost btn-sm"><X size={13} /></button>
                </div>
              </div>
            )}
          </div>

          {/* Members */}
          <div className="card">
            <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '14px' }}>👥 Members ({members.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map(m => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                    {m.name?.slice(0,2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: m.user_id === user?.id ? '600' : '400' }}>
                    {m.name} {m.user_id === user?.id ? '(you)' : ''}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
              <input className="input" placeholder="Add by email..." value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMember()} style={{ flex: 1, fontSize: '13px' }} />
              <button onClick={addMember} className="btn btn-ghost btn-sm"><UserPlus size={14} /></button>
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>📊 Group Stats</h3>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Total expenses</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{fmt(totalExpenses)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Transactions</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{expenses.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Per person avg</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: '600' }}>{fmt(members.length ? totalExpenses / members.length : 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right col — expenses */}
        <div>
          <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '14px' }}>📋 Transactions</h3>
          {expenses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧾</div>
              <p>No expenses yet. Add the first one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expenses.map(exp => (
                <div key={exp.id} className="card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{exp.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                        Paid by <strong style={{ color: exp.paid_by === user?.id ? 'var(--accent3)' : 'var(--text2)' }}>{exp.paid_by === user?.id ? 'You' : exp.paid_by_name}</strong>
                        {' '}• {new Date(exp.expense_date).toLocaleDateString('en-IN')}
                        {exp.is_recurring && <span className="badge badge-blue" style={{ marginLeft: '6px', padding: '1px 7px', fontSize: '11px' }}><Repeat size={10} /> {exp.recurrence}</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: '700', fontSize: '15px', color: 'var(--text)' }}>{fmt(exp.amount)}</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(exp.splits || []).map((s, i) => (
                      <div key={i} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: s.user_id === user?.id ? 'rgba(99,102,241,0.15)' : 'var(--bg3)', color: s.user_id === user?.id ? 'var(--accent3)' : 'var(--text3)' }}>
                        {s.name?.split(' ')[0]}: {fmt(s.amount)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ───── Main Splits Page ─────
const SplitsPage = () => {
  const { currency } = useSettings();
  const fmt = (n) => currency.symbol + parseFloat(n || 0).toLocaleString('en-IN');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups');
      setGroups(data.groups || []);
    } catch {}
    setLoading(false);
  };

  if (activeGroup) return <GroupDetail groupId={activeGroup} onBack={() => { setActiveGroup(null); loadGroups(); }} />;

  return (
    <div>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={g => { setGroups(gs => [g, ...gs]); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Split Expenses</h1>
          <p style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '14px' }}>Split bills with friends, roommates, or travel groups</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={15} /> New Group
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>No groups yet</h3>
          <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '20px' }}>
            Create a group for your apartment, trip, or any shared expenses.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <Plus size={15} /> Create First Group
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {groups.map(g => (
            <button key={g.id} onClick={() => setActiveGroup(g.id)} className="card"
              style={{ cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>{g.icon}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{g.name}</div>
                  {g.description && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{g.description}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="badge badge-blue">{g.member_count} members</div>
                <ArrowRight size={15} color="var(--text3)" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SplitsPage;
