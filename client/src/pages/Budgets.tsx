import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

export default function Budgets() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ categoryId: '', amount: '', period: 'monthly', alert80: true, alert100: true });
    const currency = user?.homeCurrency || 'USD';

    const { data: budgets, isLoading } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => api.get('/budgets').then(r => r.data.data),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories').then(r => r.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/budgets', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            toast.success('Budget created!');
            setShowForm(false);
            setForm({ categoryId: '', amount: '', period: 'monthly', alert80: true, alert100: true });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create budget'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/budgets/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget deleted'); },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount) return toast.error('Amount is required');
        createMutation.mutate(form);
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Budgets</h1>
                    <p style={{ color: '#94a3b8' }}>Set monthly spending limits per category</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} /> New Budget
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Create Budget</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <div>
                            <label className="label">Category (leave empty for total budget)</label>
                            <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                                <option value="">Total Monthly Budget</option>
                                {categories?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Amount ({currency})</label>
                            <input type="number" min="1" step="1" className="input" placeholder="e.g. 400"
                                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="label">Period</label>
                            <select className="input" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.alert80} onChange={e => setForm(f => ({ ...f, alert80: e.target.checked }))} />
                                Alert at 80%
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.alert100} onChange={e => setForm(f => ({ ...f, alert100: e.target.checked }))} />
                                Alert at 100%
                            </label>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Budget'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Budget List */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
            ) : budgets?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
                    <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p style={{ fontSize: 18, marginBottom: 8 }}>No budgets yet</p>
                    <p style={{ fontSize: 14, marginBottom: 24 }}>Create a budget to track your spending limits</p>
                    <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Create Budget</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {budgets?.map((b: any) => {
                        const pct = Math.min(100, b.pct || 0);
                        const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
                        return (
                            <div key={b._id} className="card" style={{ position: 'relative' }}>
                                <button onClick={() => { if (window.confirm('Delete this budget?')) deleteMutation.mutate(b._id); }}
                                    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <Trash2 size={15} />
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${b.categoryId?.color || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Target size={20} color={b.categoryId?.color || '#6366f1'} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 600 }}>{b.categoryId?.name || 'Total Budget'}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{b.period}</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                        <span style={{ color: '#94a3b8' }}>Spent</span>
                                        <span style={{ fontWeight: 600, color }}>{fmt(b.spent || 0, currency)}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                                    <div style={{ textAlign: 'center', background: '#0f0f1a', borderRadius: 8, padding: '8px 4px' }}>
                                        <div style={{ color: '#64748b', marginBottom: 2 }}>Budget</div>
                                        <div style={{ fontWeight: 600 }}>{fmt(b.amount, currency)}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#0f0f1a', borderRadius: 8, padding: '8px 4px' }}>
                                        <div style={{ color: '#64748b', marginBottom: 2 }}>Remaining</div>
                                        <div style={{ fontWeight: 600, color: b.remaining > 0 ? '#10b981' : '#ef4444' }}>{fmt(b.remaining || 0, currency)}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#0f0f1a', borderRadius: 8, padding: '8px 4px' }}>
                                        <div style={{ color: '#64748b', marginBottom: 2 }}>Projected</div>
                                        <div style={{ fontWeight: 600, color: (b.projected || 0) > b.amount ? '#ef4444' : '#94a3b8' }}>{fmt(b.projected || 0, currency)}</div>
                                    </div>
                                </div>

                                {pct >= 80 && (
                                    <div style={{ marginTop: 12, background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color }}>
                                        {pct >= 100 ? '🚨 Budget exceeded!' : '⚠️ Approaching budget limit'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
