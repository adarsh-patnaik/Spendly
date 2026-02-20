import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Globe, Tag, Plus, Trash2, Check, ChevronRight, Shield, X } from 'lucide-react';

const CURRENCIES: { code: string; name: string; symbol: string; flag: string }[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$', flag: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: '$', flag: '🇸🇬' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', flag: '🇭🇰' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', flag: '🇳🇿' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
    { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱' },
];

const COLOR_PRESETS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316', '#14b8a6', '#84cc16'];

const SECTIONS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'currency', label: 'Currency', icon: Globe },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'security', label: 'Security', icon: Shield },
];

export default function Settings() {
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();
    const [activeSection, setActiveSection] = useState('profile');
    const [profile, setProfile] = useState({ displayName: user?.displayName || '', homeCurrency: user?.homeCurrency || 'USD' });
    const [newCategory, setNewCategory] = useState({ name: '', icon: 'tag', color: '#6366f1' });
    const [showCatForm, setShowCatForm] = useState(false);


    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories').then(r => r.data.data),
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => api.patch('/auth/me', data),
        onSuccess: (res) => { updateUser(res.data.data); toast.success('Saved!'); },
        onError: () => toast.error('Failed to save'),
    });

    const createCategoryMutation = useMutation({
        mutationFn: (data: any) => api.post('/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created!');
            setShowCatForm(false);
            setNewCategory({ name: '', icon: 'tag', color: '#6366f1' });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create category'),
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/categories/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category removed'); },
    });

    const userCategories = categories?.filter((c: any) => c.userId) || [];
    const systemCategories = categories?.filter((c: any) => !c.userId) || [];

    const activeCurrency = CURRENCIES.find(c => c.code === profile.homeCurrency) || CURRENCIES[7];
    const initials = (user?.displayName || user?.email || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="animate-fade-in" style={{ maxWidth: 860, width: '100%' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Manage your account, preferences, and categories.</p>
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Sidebar Nav */}
                <div className="card" style={{ width: 200, flexShrink: 0, padding: 8 }}>
                    {SECTIONS.map(({ id, label, icon: Icon }) => {
                        const isActive = activeSection === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveSection(id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', borderRadius: 10, border: 'none',
                                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                                    color: isActive ? '#818cf8' : '#94a3b8',
                                    cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 600 : 400,
                                    transition: 'all 0.15s', textAlign: 'left', marginBottom: 2,
                                }}
                            >
                                <Icon size={16} />
                                {label}
                                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, minWidth: 0 }}>

                    {/* ── PROFILE ── */}
                    {activeSection === 'profile' && (
                        <div className="card animate-fade-in">
                            <SectionHeader icon={<User size={18} color="#6366f1" />} title="Profile" subtitle="Your personal information" />

                            {/* Avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: '16px 20px', background: '#0f0f1a', borderRadius: 14 }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0,
                                    boxShadow: '0 0 0 3px rgba(99,102,241,0.25)',
                                }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{user?.displayName || 'No name set'}</div>
                                    <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
                                </div>
                                <span style={{
                                    background: user?.plan === 'pro' ? 'rgba(99,102,241,0.2)' : 'rgba(100,116,139,0.15)',
                                    color: user?.plan === 'pro' ? '#818cf8' : '#94a3b8',
                                    padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                                }}>
                                    {user?.plan === 'pro' ? '⭐ Pro' : 'Free'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div>
                                    <label className="label">Display Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="input" value={profile.displayName}
                                            onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                                            placeholder="Your full name" />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Email <span style={{ color: '#64748b', fontSize: 11 }}>(cannot be changed)</span></label>
                                    <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.45, cursor: 'not-allowed' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                                    <button className="btn-primary"
                                        onClick={() => updateProfileMutation.mutate({ displayName: profile.displayName })}
                                        disabled={updateProfileMutation.isPending || profile.displayName === user?.displayName}>
                                        {updateProfileMutation.isPending ? 'Saving…' : <><Check size={14} /> Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CURRENCY ── */}
                    {activeSection === 'currency' && (
                        <div className="card animate-fade-in">
                            <SectionHeader icon={<Globe size={18} color="#06b6d4" />} title="Home Currency" subtitle="All values are displayed and converted to this currency" />

                            {/* Preview chip */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#0f0f1a', borderRadius: 12, marginBottom: 24 }}>
                                <span style={{ fontSize: 28 }}>{activeCurrency.flag}</span>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{activeCurrency.code} — {activeCurrency.name}</div>
                                    <div style={{ fontSize: 13, color: '#64748b' }}>Symbol: <span style={{ color: '#818cf8', fontWeight: 700 }}>{activeCurrency.symbol}</span></div>
                                </div>
                            </div>

                            <label className="label">Select Currency</label>
                            <select className="input" value={profile.homeCurrency}
                                onChange={e => setProfile(p => ({ ...p, homeCurrency: e.target.value }))}
                                style={{ marginBottom: 20 }}>
                                {CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.flag}  {c.code} — {c.name}</option>
                                ))}
                            </select>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn-primary"
                                    onClick={() => updateProfileMutation.mutate({ homeCurrency: profile.homeCurrency })}
                                    disabled={updateProfileMutation.isPending || profile.homeCurrency === user?.homeCurrency}>
                                    {updateProfileMutation.isPending ? 'Saving…' : <><Check size={14} /> Apply Currency</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── CATEGORIES ── */}
                    {activeSection === 'categories' && (
                        <div className="card animate-fade-in">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                                <SectionHeader icon={<Tag size={18} color="#8b5cf6" />} title="Custom Categories" subtitle={`${userCategories.length} custom · ${systemCategories.length} system`} noMargin />
                                {!showCatForm && (
                                    <button className="btn-primary" style={{ fontSize: 13, padding: '8px 14px' }}
                                        onClick={() => setShowCatForm(true)}>
                                        <Plus size={14} /> New
                                    </button>
                                )}
                            </div>

                            {/* New category form */}
                            {showCatForm && (
                                <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid #2d2d4e' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>New Category</span>
                                        <button onClick={() => { setShowCatForm(false); setNewCategory({ name: '', icon: 'tag', color: '#6366f1' }); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <label className="label">Name</label>
                                    <input className="input" placeholder="e.g. Pet Care" value={newCategory.name}
                                        onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
                                        style={{ marginBottom: 16 }} />
                                    <label className="label">Color</label>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                                        {COLOR_PRESETS.map(color => (
                                            <button key={color} onClick={() => setNewCategory(c => ({ ...c, color }))}
                                                style={{
                                                    width: 28, height: 28, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer',
                                                    boxShadow: newCategory.color === color ? `0 0 0 3px rgba(255,255,255,0.25), 0 0 0 5px ${color}` : 'none',
                                                    transform: newCategory.color === color ? 'scale(1.15)' : 'scale(1)',
                                                    transition: 'all 0.15s',
                                                }} />
                                        ))}
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <input type="color" value={newCategory.color}
                                                onChange={e => setNewCategory(c => ({ ...c, color: e.target.value }))}
                                                style={{ width: 28, height: 28, padding: 2, background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: '50%', cursor: 'pointer' }}
                                                title="Custom color" />
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    {newCategory.name && (
                                        <div style={{ marginBottom: 16 }}>
                                            <span style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'block' }}>Preview</span>
                                            <span style={{ background: `${newCategory.color}20`, color: newCategory.color, padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                                                {newCategory.name}
                                            </span>
                                        </div>
                                    )}

                                    <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                                        onClick={() => createCategoryMutation.mutate(newCategory)}
                                        disabled={!newCategory.name || createCategoryMutation.isPending}>
                                        {createCategoryMutation.isPending ? 'Adding…' : <><Plus size={14} /> Add Category</>}
                                    </button>
                                </div>
                            )}

                            {/* User categories */}
                            {userCategories.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '28px 0', color: '#64748b', fontSize: 14 }}>
                                    <Tag size={32} style={{ marginBottom: 10, opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
                                    No custom categories yet.
                                    {user?.plan === 'free' && <div style={{ fontSize: 12, marginTop: 4 }}>Free plan: up to 5 custom categories.</div>}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                    {userCategories.map((cat: any) => (
                                        <div key={cat._id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', background: '#0f0f1a', borderRadius: 10,
                                            border: '1px solid #2d2d4e',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: 14 }}>{cat.name}</span>
                                                <span style={{ background: `${cat.color}18`, color: cat.color, padding: '2px 10px', borderRadius: 999, fontSize: 11 }}>
                                                    Custom
                                                </span>
                                            </div>
                                            <button onClick={() => { if (window.confirm(`Remove "${cat.name}"?`)) deleteCategoryMutation.mutate(cat._id); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6, borderRadius: 6, transition: 'all 0.15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* System categories */}
                            <div style={{ paddingTop: 20, borderTop: '1px solid #2d2d4e' }}>
                                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>System categories ({systemCategories.length})</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {systemCategories.map((cat: any) => (
                                        <span key={cat._id} style={{
                                            background: `${cat.color}15`, color: cat.color,
                                            padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                                            border: `1px solid ${cat.color}25`,
                                        }}>
                                            {cat.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SECURITY ── */}
                    {activeSection === 'security' && (
                        <div className="card animate-fade-in">
                            <SectionHeader icon={<Shield size={18} color="#10b981" />} title="Security" subtitle="Account safety and data management" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <InfoRow label="Account email" value={user?.email || ''} />
                                <InfoRow label="Plan" value={user?.plan === 'pro' ? '⭐ Pro' : 'Free'} />
                            </div>

                            <div style={{ marginTop: 32, padding: 20, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
                                <p style={{ fontWeight: 600, fontSize: 14, color: '#ef4444', marginBottom: 4 }}>Danger Zone</p>
                                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                                    Deleting your account is permanent and cannot be undone.
                                </p>
                                <button className="btn-danger"
                                    onClick={() => toast.error('Contact support to delete your account.')}>
                                    Delete My Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, subtitle, noMargin }: { icon: React.ReactNode; title: string; subtitle: string; noMargin?: boolean }) {
    return (
        <div style={{ marginBottom: noMargin ? 0 : 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                {icon}
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>{title}</h2>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginLeft: 28 }}>{subtitle}</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#0f0f1a', borderRadius: 10 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
        </div>
    );
}
