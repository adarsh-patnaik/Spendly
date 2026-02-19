import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Brain, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    onClose: () => void;
    expense?: any; // for editing
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'INR', 'MXN', 'BRL', 'SGD', 'HKD'];

export default function AddExpenseModal({ onClose, expense }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isEdit = !!expense;

    const [form, setForm] = useState({
        amount: expense?.amount || '',
        currency: expense?.currency || user?.homeCurrency || 'USD',
        expenseDate: expense?.expenseDate ? expense.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
        categoryId: expense?.categoryId?._id || '',
        merchant: expense?.merchant || '',
        notes: expense?.notes || '',
    });

    const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; categoryName: string; confidence: number } | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [fxPreview, setFxPreview] = useState<number | null>(null);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories').then(r => r.data.data),
    });

    // AI categorization on merchant blur
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

    // FX preview
    useEffect(() => {
        const homeCurrency = user?.homeCurrency || 'USD';
        if (!form.amount || form.currency === homeCurrency) { setFxPreview(null); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/fx/rate?from=${form.currency}&to=${homeCurrency}`);
                setFxPreview(parseFloat(form.amount as string) * res.data.data.rate);
            } catch { }
        }, 500);
        return () => clearTimeout(timer);
    }, [form.amount, form.currency, user?.homeCurrency]);

    const mutation = useMutation({
        mutationFn: (data: any) => isEdit
            ? api.patch(`/expenses/${expense._id}`, data)
            : api.post('/expenses', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            toast.success(isEdit ? 'Expense updated!' : 'Expense added! 🎉');
            onClose();
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save expense'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount) return toast.error('Amount is required');
        mutation.mutate({
            ...form,
            aiCategoryId: aiSuggestion?.categoryId,
            aiConfidence: aiSuggestion?.confidence,
            aiUsed: aiSuggestion ? form.categoryId === aiSuggestion.categoryId : false,
        });
    };

    return (
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
                overflowY: 'auto',
            }}
        >
            <div
                className="card animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: 500,
                    flexShrink: 0,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Amount + Currency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                        <div>
                            <label className="label">Amount *</label>
                            <input
                                type="number" step="0.01" min="0" className="input"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Currency</label>
                            <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* FX Preview */}
                    {fxPreview !== null && (
                        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#a5b4fc' }}>
                            ≈ {new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.homeCurrency || 'USD' }).format(fxPreview)} {user?.homeCurrency}
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="label">Date</label>
                        <input type="date" className="input" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
                    </div>

                    {/* Merchant */}
                    <div>
                        <label className="label">Merchant / Payee</label>
                        <input
                            className="input" placeholder="e.g. Starbucks, Amazon..."
                            value={form.merchant}
                            onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))}
                            onBlur={handleMerchantBlur}
                        />
                    </div>

                    {/* AI Suggestion */}
                    {aiLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                            <Loader2 size={14} className="animate-spin" /> AI is categorizing...
                        </div>
                    )}
                    {aiSuggestion && !aiLoading && (
                        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                <Brain size={14} color="#6366f1" />
                                <span style={{ color: '#a5b4fc' }}>AI suggests: <strong>{aiSuggestion.categoryName}</strong></span>
                                <span style={{ background: 'rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: 999, fontSize: 11, color: '#818cf8' }}>
                                    {aiSuggestion.confidence}% confident
                                </span>
                                {form.categoryId !== aiSuggestion.categoryId && (
                                    <button type="button" onClick={() => setForm(f => ({ ...f, categoryId: aiSuggestion.categoryId }))}
                                        style={{ marginLeft: 'auto', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
                                        Accept
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Category */}
                    <div>
                        <label className="label">Category</label>
                        <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                            <option value="">Select category...</option>
                            {categories?.map((cat: any) => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="label">Notes</label>
                        <textarea className="input" placeholder="Optional notes..." rows={2}
                            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            style={{ resize: 'vertical' }} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={mutation.isPending} style={{ flex: 2, justifyContent: 'center' }}>
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
