import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
    Tooltip, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, Cell,
    Treemap,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, ShoppingBag, Calendar, Zap } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#94a3b8'];
const GRADIENT_COLORS = [
    ['#6366f1', '#818cf8'],
    ['#8b5cf6', '#a78bfa'],
    ['#06b6d4', '#22d3ee'],
    ['#10b981', '#34d399'],
    ['#f59e0b', '#fbbf24'],
    ['#ef4444', '#f87171'],
    ['#ec4899', '#f472b6'],
    ['#94a3b8', '#cbd5e1'],
];

const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const getCurrencySymbol = (currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 })
        .format(0).replace(/[\d,.\s]/g, '').trim();

const tooltipStyle = {
    background: 'rgba(15,15,30,0.95)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 10,
    color: '#e2e8f0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

// Custom Treemap content
const TreemapContent = ({ x, y, width, height, index, name, value, currency }: any) => {
    if (width < 30 || height < 30) return null;
    const color = COLORS[index % COLORS.length];
    return (
        <g>
            <defs>
                <linearGradient id={`tg${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length][0]} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length][1]} stopOpacity={0.6} />
                </linearGradient>
            </defs>
            <rect x={x + 2} y={y + 2} width={width - 4} height={height - 4}
                rx={8} ry={8} fill={`url(#tg${index})`} stroke={color} strokeWidth={1} strokeOpacity={0.4} />
            {width > 60 && height > 40 && (
                <>
                    <text x={x + 10} y={y + 22} fill="white" fontSize={Math.min(13, width / 8)} fontWeight={600} opacity={0.95}>
                        {name?.length > 12 ? name.slice(0, 11) + '…' : name}
                    </text>
                    {height > 55 && (
                        <text x={x + 10} y={y + 38} fill="rgba(255,255,255,0.7)" fontSize={Math.min(11, width / 10)}>
                            {fmt(value, currency)}
                        </text>
                    )}
                </>
            )}
        </g>
    );
};

export default function Analytics() {
    const { user } = useAuth();
    const currency = user?.homeCurrency || 'USD';
    const symbol = getCurrencySymbol(currency);
    const [period, setPeriod] = useState('this-month');

    const getRange = () => {
        const now = new Date();
        if (period === 'this-month') return { from: startOfMonth(now), to: endOfMonth(now) };
        if (period === 'last-month') { const lm = subMonths(now, 1); return { from: startOfMonth(lm), to: endOfMonth(lm) }; }
        if (period === 'last-3') return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
        return { from: startOfMonth(now), to: endOfMonth(now) };
    };

    const { from, to } = getRange();
    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');

    const { data: summary } = useQuery({
        queryKey: ['analytics', 'summary', fromStr, toStr],
        queryFn: () => api.get(`/analytics/summary?from=${fromStr}&to=${toStr}`).then(r => r.data.data),
    });
    const { data: byCategory } = useQuery({
        queryKey: ['analytics', 'by-category', fromStr, toStr],
        queryFn: () => api.get(`/analytics/by-category?from=${fromStr}&to=${toStr}`).then(r => r.data.data),
    });
    const { data: byMerchant } = useQuery({
        queryKey: ['analytics', 'by-merchant', fromStr, toStr],
        queryFn: () => api.get(`/analytics/by-merchant?from=${fromStr}&to=${toStr}`).then(r => r.data.data),
    });
    const { data: trends } = useQuery({
        queryKey: ['analytics', 'trends', fromStr, toStr],
        queryFn: () => api.get(`/analytics/trends?from=${fromStr}&to=${toStr}`).then(r => r.data.data),
    });

    const treemapData = byCategory?.slice(0, 8).map((c: any, i: number) => ({
        name: c.categoryName,
        size: c.total,
        value: c.total,
        index: i,
        currency,
    })) || [];

    const maxMerchant = byMerchant?.[0]?.total || 1;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Analytics</h1>
                    <p style={{ color: '#94a3b8' }}>Understand your spending patterns</p>
                </div>
                <div style={{ display: 'flex', gap: 8, background: 'rgba(99,102,241,0.08)', padding: 4, borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
                    {[
                        { value: 'this-month', label: 'This Month' },
                        { value: 'last-month', label: 'Last Month' },
                        { value: 'last-3', label: 'Last 3 Months' },
                    ].map(opt => (
                        <button key={opt.value} onClick={() => setPeriod(opt.value)}
                            style={{
                                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                                background: period === opt.value ? '#6366f1' : 'transparent',
                                color: period === opt.value ? 'white' : '#94a3b8',
                                transition: 'all 0.2s',
                                boxShadow: period === opt.value ? '0 2px 12px rgba(99,102,241,0.4)' : 'none',
                            }}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                    { label: 'Total Spent', value: fmt(summary?.total || 0, currency), icon: <TrendingUp size={18} />, color: '#6366f1' },
                    { label: 'Transactions', value: summary?.count || 0, icon: <Zap size={18} />, color: '#10b981' },
                    { label: 'Daily Average', value: fmt(summary?.avgDaily || 0, currency), icon: <Calendar size={18} />, color: '#f59e0b' },
                    { label: 'Largest Expense', value: fmt(summary?.largest?.homeAmount || summary?.largest?.amount || 0, currency), icon: <ShoppingBag size={18} />, color: '#ef4444' },
                ].map(({ label, value, icon, color }) => (
                    <div key={label} className="card" style={{ textAlign: 'center', background: `linear-gradient(135deg, ${color}15, ${color}05)`, borderColor: `${color}25` }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{value}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Row 1: Treemap + Area Chart */}
            <div className="analytics-charts-row">

                {/* Treemap — By Category */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Spending by Category</h3>
                    {byCategory && byCategory.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <Treemap
                                    data={treemapData}
                                    dataKey="size"
                                    aspectRatio={4 / 3}
                                    content={<TreemapContent currency={currency} />}
                                >
                                    <Tooltip
                                        formatter={(v: any) => [fmt(v, currency), 'Spent']}
                                        contentStyle={tooltipStyle}
                                    />
                                </Treemap>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12 }}>
                                {byCategory.slice(0, 8).map((cat: any, i: number) => (
                                    <div key={cat.categoryId} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                                        <span style={{ color: '#94a3b8' }}>{cat.categoryName}</span>
                                        <span style={{ color: '#64748b' }}>{cat.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <div style={{ textAlign: 'center', color: '#64748b', padding: '60px 0' }}>No data for this period</div>}
                </div>

                {/* Area Chart — Daily Trend */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Daily Spending Trend</h3>
                    {trends && trends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" vertical={false} />
                                <XAxis dataKey="date"
                                    tickFormatter={(d) => format(new Date(d + 'T00:00:00'), 'MMM d')}
                                    tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                                <Tooltip
                                    formatter={(v: any) => [fmt(v, currency), 'Spent']}
                                    contentStyle={tooltipStyle}
                                    labelFormatter={(d) => format(new Date(d + 'T00:00:00'), 'EEEE, MMM d yyyy')} />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
                                    fill="url(#analyticsAreaGrad)"
                                    dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#818cf8', stroke: 'rgba(99,102,241,0.3)', strokeWidth: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', color: '#64748b', padding: '60px 0' }}>No data for this period</div>}
                </div>
            </div>

            {/* Row 2: Vertical Bar Chart (categories) + Merchant list */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

                {/* Vertical Gradient Bar Chart — Category Comparison */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Category Comparison</h3>
                    {byCategory && byCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={byCategory.slice(0, 8)} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                                <defs>
                                    {GRADIENT_COLORS.map(([c1, c2], i) => (
                                        <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={c1} stopOpacity={1} />
                                            <stop offset="100%" stopColor={c2} stopOpacity={0.6} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" horizontal={true} vertical={false} />
                                <XAxis dataKey="categoryName"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={false} tickLine={false}
                                    angle={-35} textAnchor="end" interval={0} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                <Tooltip
                                    formatter={(v: any) => [fmt(v, currency), 'Spent']}
                                    contentStyle={tooltipStyle}
                                    cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                    {byCategory.slice(0, 8).map((_: any, i: number) => (
                                        <Cell key={i} fill={`url(#barGrad${i % GRADIENT_COLORS.length})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', color: '#64748b', padding: '60px 0' }}>No data for this period</div>}
                </div>

                {/* Top Merchants — styled progress bars */}
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Top Merchants</h3>
                    {byMerchant && byMerchant.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {byMerchant.slice(0, 7).map((m: any, i: number) => {
                                const pct = Math.round((m.total / maxMerchant) * 100);
                                const color = COLORS[i % COLORS.length];
                                return (
                                    <div key={m.merchant}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: 6,
                                                    background: `${color}20`, display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: 10, fontWeight: 700, color, flexShrink: 0,
                                                }}>
                                                    {i + 1}
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {m.merchant}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(m.total, currency)}</div>
                                                <div style={{ fontSize: 10, color: '#64748b' }}>{m.count} txn{m.count !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${pct}%`, borderRadius: 99,
                                                background: `linear-gradient(90deg, ${color}, ${GRADIENT_COLORS[i % GRADIENT_COLORS.length][1]})`,
                                                transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>No data for this period</div>}
                </div>
            </div>
        </div>
    );
}
