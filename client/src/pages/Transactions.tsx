import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { format } from 'date-fns';
import { Search, Filter, Download, Trash2, Edit2, Plus, X, Brain, Loader2, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'INR', 'MXN', 'BRL', 'SGD', 'HKD'];

const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

const emptyForm = (currency: string) => ({
    amount: '',
    currency,
    expenseDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    merchant: '',
    notes: '',
});

export default function Transactions() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const currency = user?.homeCurrency || 'USD';

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [page, setPage] = useState(1);
    const [editExpense, setEditExpense] = useState<any>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Inline add form state
    const [form, setForm] = useState(emptyForm(currency));
    const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; categoryName: string; confidence: number } | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [fxPreview, setFxPreview] = useState<number | null>(null);

    // Inline edit form state
    const [editForm, setEditForm] = useState<any>(null);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories').then(r => r.data.data),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['expenses', search, categoryFilter, page],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (search) params.set('q', search);
            if (categoryFilter) params.set('category_id', categoryFilter);
            return api.get(`/expenses?${params}`).then(r => r.data);
        },
    });

    // FX preview for add form
    useEffect(() => {
        if (!form.amount || form.currency === currency) { setFxPreview(null); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/fx/rate?from=${form.currency}&to=${currency}`);
                setFxPreview(parseFloat(form.amount as string) * res.data.data.rate);
            } catch { }
        }, 500);
        return () => clearTimeout(timer);
    }, [form.amount, form.currency, currency]);

    const handleMerchantBlur = async () => {
        if (!form.merchant || form.merchant.length < 2) return;
        setAiLoading(true);
        try {
            const res = await api.post('/ai/categorize', { merchant: form.merchant, notes: form.notes });
            const suggestion = res.data.data;
            if (suggestion.confidence > 0) {
                setAiSuggestion(suggestion);
                if (suggestion.confidence >= 85 && !form.categoryId) {
                    setForm(f => ({ ...f, categoryId: suggestion.categoryId }));
                }
            }
        } catch { }
        setAiLoading(false);
    };

    const addMutation = useMutation({
        mutationFn: (data: any) => api.post('/expenses', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            toast.success('Expense added! 🎉');
            setShowAdd(false);
            setForm(emptyForm(currency));
            setAiSuggestion(null);
            setFxPreview(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add expense'),
    });

    const editMutation = useMutation({
        mutationFn: ({ id, data }: any) => api.patch(`/expenses/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            toast.success('Expense updated!');
            setEditExpense(null);
            setEditForm(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/expenses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            toast.success('Expense deleted');
            setSelected(new Set());
        },
    });

    const handleExportCsv = async () => {
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.set('category_id', categoryFilter);
            const res = await api.get(`/expenses/export/csv?${params}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = `spendly-export-${Date.now()}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success('CSV exported!');
        } catch { toast.error('Export failed'); }
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selected.size} expense(s)?`)) return;
        for (const id of selected) await deleteMutation.mutateAsync(id);
    };

    const startEdit = (expense: any) => {
        setEditExpense(expense);
        setEditForm({
            amount: expense.amount,
            currency: expense.currency,
            expenseDate: expense.expenseDate?.split('T')[0] || '',
            categoryId: expense.categoryId?._id || '',
            merchant: expense.merchant || '',
            notes: expense.notes || '',
        });
        setShowAdd(false);
    };

    const expenses = data?.data || [];
    const total = data?.meta?.total || 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Transactions</h1>
                    <p style={{ color: '#94a3b8' }}>{total} total expenses</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-ghost" onClick={handleExportCsv}>
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="btn-primary" onClick={() => { setShowAdd(v => !v); setEditExpense(null); setEditForm(null); }}>
                        {showAdd ? <X size={16} /> : <Plus size={16} />}
                        {showAdd ? 'Cancel' : 'Add Expense'}
                    </button>
                </div>
            </div>

            {/* Inline Add Expense Form */}
            {showAdd && (
                <div className="card animate-fade-in" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Add Expense</h3>
                    <form onSubmit={e => { e.preventDefault(); if (!form.amount) return toast.error('Amount is required'); addMutation.mutate(form); }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>

                        {/* Amount + Currency */}
                        <div>
                            <label className="label">Amount *</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
                                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required style={{ flex: 1 }} />
                                <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={{ width: 90 }}>
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {fxPreview !== null && (
                                <div style={{ marginTop: 6, fontSize: 12, color: '#a5b4fc' }}>
                                    ≈ {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(fxPreview)} {currency}
                                </div>
                            )}
                        </div>

                        {/* Date */}
                        <div>
                            <label className="label">Date</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="add-date-input"
                                    type="date" className="input" value={form.expenseDate}
                                    onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                                    style={{ paddingRight: 40 }}
                                />
                                <button type="button"
                                    onClick={() => (document.getElementById('add-date-input') as HTMLInputElement)?.showPicker()}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 0 }}>
                                    <CalendarDays size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="label">Category</label>
                            <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                                <option value="">Select category...</option>
                                {categories?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Merchant */}
                        <div>
                            <label className="label">Merchant / Payee</label>
                            <input className="input" placeholder="e.g. Starbucks, Amazon..."
                                value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))}
                                onBlur={handleMerchantBlur} />
                            {aiLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                                    <Loader2 size={12} className="animate-spin" /> AI categorizing...
                                </div>
                            )}
                            {aiSuggestion && !aiLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#a5b4fc' }}>
                                    <Brain size={12} color="#6366f1" />
                                    AI: <strong>{aiSuggestion.categoryName}</strong> ({aiSuggestion.confidence}%)
                                    {form.categoryId !== aiSuggestion.categoryId && (
                                        <button type="button" onClick={() => setForm(f => ({ ...f, categoryId: aiSuggestion.categoryId }))}
                                            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 4, padding: '1px 8px', fontSize: 11, cursor: 'pointer' }}>
                                            Accept
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="label">Notes</label>
                            <input className="input" placeholder="Optional notes..."
                                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                            <button type="button" className="btn-ghost" onClick={() => { setShowAdd(false); setForm(emptyForm(currency)); setAiSuggestion(null); }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
                                {addMutation.isPending ? 'Adding...' : 'Add Expense'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Inline Edit Form */}
            {editExpense && editForm && (
                <div className="card animate-fade-in" style={{ marginBottom: 24, borderColor: 'rgba(99,102,241,0.4)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Edit Expense</h3>
                    <form onSubmit={e => { e.preventDefault(); editMutation.mutate({ id: editExpense._id, data: editForm }); }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="label">Amount *</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="number" step="0.01" min="0" className="input" value={editForm.amount}
                                    onChange={e => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} required style={{ flex: 1 }} />
                                <select className="input" value={editForm.currency} onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))} style={{ width: 90 }}>
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Date</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="edit-date-input"
                                    type="date" className="input" value={editForm.expenseDate}
                                    onChange={e => setEditForm((f: any) => ({ ...f, expenseDate: e.target.value }))}
                                    style={{ paddingRight: 40 }}
                                />
                                <button type="button"
                                    onClick={() => (document.getElementById('edit-date-input') as HTMLInputElement)?.showPicker()}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 0 }}>
                                    <CalendarDays size={16} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="label">Category</label>
                            <select className="input" value={editForm.categoryId} onChange={e => setEditForm((f: any) => ({ ...f, categoryId: e.target.value }))}>
                                <option value="">Select category...</option>
                                {categories?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Merchant / Payee</label>
                            <input className="input" value={editForm.merchant}
                                onChange={e => setEditForm((f: any) => ({ ...f, merchant: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Notes</label>
                            <input className="input" value={editForm.notes}
                                onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                            <button type="button" className="btn-ghost" onClick={() => { setEditExpense(null); setEditForm(null); }}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={editMutation.isPending}>
                                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input className="input" placeholder="Search merchant or notes..." style={{ paddingLeft: 36 }}
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <div style={{ position: 'relative' }}>
                    <Filter size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <select className="input" style={{ paddingLeft: 36, minWidth: 160 }} value={categoryFilter}
                        onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                        <option value="">All Categories</option>
                        {categories?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
                {selected.size > 0 && (
                    <button className="btn-danger" onClick={handleBulkDelete}>
                        <Trash2 size={16} /> Delete ({selected.size})
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
                ) : expenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                        <p style={{ fontSize: 16, marginBottom: 8 }}>No expenses found</p>
                        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ fontSize: 14 }}>
                            <Plus size={14} /> Add your first expense
                        </button>
                    </div>
                ) : (
                    <div className="table-scroll">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #2d2d4e' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                        <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(expenses.map((ex: any) => ex._id)) : new Set())} />
                                    </th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>DATE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>MERCHANT</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>CATEGORY</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: '#64748b', fontWeight: 600 }}>AMOUNT</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: '#64748b', fontWeight: 600 }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((e: any) => (
                                    <tr key={e._id} style={{ borderBottom: '1px solid #2d2d4e', transition: 'background 0.15s', background: editExpense?._id === e._id ? 'rgba(99,102,241,0.08)' : '' }}
                                        onMouseEnter={ev => { if (editExpense?._id !== e._id) ev.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
                                        onMouseLeave={ev => { if (editExpense?._id !== e._id) ev.currentTarget.style.background = ''; }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <input type="checkbox" checked={selected.has(e._id)} onChange={() => toggleSelect(e._id)} />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>
                                            {format(new Date(e.expenseDate), 'MMM d, yyyy')}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 500 }}>{e.merchant || '—'}</div>
                                            {e.notes && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{e.notes.slice(0, 40)}{e.notes.length > 40 ? '...' : ''}</div>}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {e.categoryId ? (
                                                <span style={{ background: `${e.categoryId.color}20`, color: e.categoryId.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                                                    {e.categoryId.name}
                                                </span>
                                            ) : <span style={{ color: '#64748b', fontSize: 13 }}>Uncategorized</span>}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                                                {e.currency !== currency ? `${e.currency} ${e.amount.toFixed(2)}` : fmt(e.amount, currency)}
                                            </div>
                                            {e.currency !== currency && (
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{fmt(e.homeAmount || e.amount, currency)}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                <button onClick={() => startEdit(e)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: editExpense?._id === e._id ? '#6366f1' : '#64748b', padding: 4 }} title="Edit">
                                                    <Edit2 size={15} />
                                                </button>
                                                <button onClick={() => { if (window.confirm('Delete this expense?')) deleteMutation.mutate(e._id); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }} title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px' }}>Previous</button>
                    <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 14 }}>Page {page} of {totalPages}</span>
                    <button className="btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px' }}>Next</button>
                </div>
            )}
        </div>
    );
}
