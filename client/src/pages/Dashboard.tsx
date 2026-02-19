import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

// Get just the currency symbol (e.g. ₹, $, €)
const getCurrencySymbol = (currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 })
        .format(0).replace(/[\d,.\s]/g, '').trim();

export default function Dashboard() {
    const { user } = useAuth();
    const now = new Date();
    const from = format(startOfMonth(now), 'yyyy-MM-dd');
    const to = format(endOfMonth(now), 'yyyy-MM-dd');

    const { data: summary } = useQuery({
        queryKey: ['analytics', 'summary', from, to],
        queryFn: () => api.get(`/analytics/summary?from=${from}&to=${to}`).then(r => r.data.data),
    });

    const { data: byCategory } = useQuery({
        queryKey: ['analytics', 'by-category', from, to],
        queryFn: () => api.get(`/analytics/by-category?from=${from}&to=${to}`).then(r => r.data.data),
    });

    const { data: trends } = useQuery({
        queryKey: ['analytics', 'trends'],
        queryFn: () => {
            const trendFrom = format(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13), 'yyyy-MM-dd');
            return api.get(`/analytics/trends?from=${trendFrom}&to=${format(now, 'yyyy-MM-dd')}`).then(r => r.data.data);
        },
    });

    const { data: budgets } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => api.get('/budgets').then(r => r.data.data),
    });

    const { data: recentExpenses } = useQuery({
        queryKey: ['expenses', 'recent'],
        queryFn: () => api.get('/expenses?limit=10').then(r => r.data.data),
    });

    const currency = user?.homeCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    const total = summary?.total || 0;
    const delta = summary?.delta;

    const tooltipStyle = { background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e2e8f0' };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                    {(() => {
                        const h = now.getHours();
                        if (h >= 5 && h < 12) return `Good morning, ${user?.displayName?.split(' ')[0]} ☀️`;
                        if (h >= 12 && h < 17) return `Good afternoon, ${user?.displayName?.split(' ')[0]} 🌤️`;
                        if (h >= 17 && h < 21) return `Good evening, ${user?.displayName?.split(' ')[0]} 🌆`;
                        return `Good night, ${user?.displayName?.split(' ')[0]} 🌙`;
                    })()}
                </h1>
                <p style={{ color: '#94a3b8' }}>{format(now, 'MMMM yyyy')} spending overview</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))', borderColor: 'rgba(99,102,241,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Wallet size={18} color="#6366f1" />
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Month-to-Date</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 700 }}>{fmt(total, currency)}</div>
                    {delta !== null && delta !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 13, color: delta > 0 ? '#ef4444' : '#10b981' }}>
                            {delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {Math.abs(delta)}% vs last month
                        </div>
                    )}
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Target size={18} color="#10b981" />
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Transactions</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 700 }}>{summary?.count || 0}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
                        Avg {fmt(summary?.avgDaily || 0, currency)}/day
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <TrendingUp size={18} color="#f59e0b" />
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Largest Expense</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {summary?.largest ? fmt(summary.largest.homeAmount || summary.largest.amount, currency) : '—'}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {summary?.largest?.merchant || 'No expenses yet'}
                    </div>
                </div>
            </div>

            {/* Charts Row 1: Donut + Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'clamp(280px, 38%, 400px) 1fr', gap: 24, marginBottom: 24, flexWrap: 'wrap' }} className="dashboard-charts-row">
                {/* Donut Chart — Spending by Category */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Spending by Category</h3>
                    {byCategory && byCategory.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <defs>
                                        {byCategory.slice(0, 7).map((_: any, i: number) => (
                                            <radialGradient key={i} id={`grad${i}`} cx="50%" cy="50%" r="50%">
                                                <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
                                                <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.7} />
                                            </radialGradient>
                                        ))}
                                    </defs>
                                    <Pie data={byCategory.slice(0, 7)} dataKey="total" nameKey="categoryName"
                                        cx="50%" cy="50%" outerRadius={85} innerRadius={52}
                                        paddingAngle={3} strokeWidth={0}>
                                        {byCategory.slice(0, 7).map((_: any, i: number) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => [fmt(v, currency), 'Spent']} contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                                {byCategory.slice(0, 5).map((cat: any, i: number) => (
                                    <div key={cat.categoryId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                                            <span style={{ color: '#94a3b8' }}>{cat.categoryName}</span>
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{cat.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No expenses yet this month</div>
                    )}
                </div>

                {/* Area Chart — Daily Spending Trend */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Daily Spending (Last 14 Days)</h3>
                    {trends && trends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
                                <XAxis dataKey="date"
                                    tickFormatter={(d) => format(new Date(d + 'T00:00:00'), 'MMM d')}
                                    tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                                <Tooltip
                                    formatter={(v: any) => [fmt(v, currency), 'Spent']}
                                    contentStyle={tooltipStyle}
                                    labelFormatter={(d) => format(new Date(d + 'T00:00:00'), 'MMM d, yyyy')} />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
                                    fill="url(#areaGrad)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#818cf8' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '60px 0' }}>No spending data yet</div>
                    )}
                </div>
            </div>

            {/* Charts Row 2: Radar (if categories exist) */}
            {byCategory && byCategory.length >= 3 && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Category Radar</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={byCategory.slice(0, 7).map((c: any) => ({ subject: c.categoryName, amount: c.total, pct: c.pct }))}>
                            <PolarGrid stroke="#2d2d4e" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }}
                                tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                            <Radar name="Spent" dataKey="amount" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                            <Tooltip formatter={(v: any) => [fmt(v, currency), 'Spent']} contentStyle={tooltipStyle} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Budgets + Recent Transactions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {/* Budget Status */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Budget Status</h3>
                        <Link to="/budgets" style={{ color: '#6366f1', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            Manage <ArrowUpRight size={12} />
                        </Link>
                    </div>
                    {budgets && budgets.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {budgets.slice(0, 4).map((b: any) => {
                                const pct = Math.min(100, b.pct || 0);
                                const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
                                return (
                                    <div key={b._id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                                            <span style={{ color: '#e2e8f0' }}>{b.categoryId?.name || 'Total Budget'}</span>
                                            <span style={{ color: '#94a3b8' }}>{fmt(b.spent || 0, currency)} / {fmt(b.amount, currency)}</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{pct}% used</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>
                            <p style={{ marginBottom: 12 }}>No budgets set</p>
                            <Link to="/budgets" className="btn-primary" style={{ textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}>Create Budget</Link>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Transactions</h3>
                        <Link to="/transactions" style={{ color: '#6366f1', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ArrowUpRight size={12} />
                        </Link>
                    </div>
                    {recentExpenses && recentExpenses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {recentExpenses.map((e: any) => (
                                <div key={e._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2d2d4e' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: `${e.categoryId?.color || '#6366f1'}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 16,
                                        }}>
                                            💳
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 500 }}>{e.merchant || 'Unknown'}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>
                                                {e.categoryId?.name || 'Uncategorized'} · {format(new Date(e.expenseDate), 'MMM d')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                                            {e.currency !== currency
                                                ? `${e.currency} ${e.amount}`
                                                : fmt(e.amount, currency)}
                                        </div>
                                        {e.currency !== currency && (
                                            <div style={{ fontSize: 11, color: '#64748b' }}>{fmt(e.homeAmount || e.amount, currency)}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No transactions yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}
