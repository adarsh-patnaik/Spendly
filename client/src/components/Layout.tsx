import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, CreditCard, Target, BarChart3,
    Settings, LogOut, Zap, Plus, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import AddExpenseModal from './AddExpenseModal';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: CreditCard, label: 'Transactions' },
    { to: '/budgets', icon: Target, label: 'Budgets' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const closeSidebar = () => setSidebarOpen(false);

    // Current page title for mobile topbar
    const currentPage = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Spendly';

    return (
        <div className="app-layout">

            {/* ── Mobile Top Bar ── */}
            <div className="mobile-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setSidebarOpen(v => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}>
                        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={16} color="white" />
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{currentPage}</span>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => setShowAddExpense(true)}
                    style={{ padding: '7px 14px', fontSize: 13 }}>
                    <Plus size={14} /> Add
                </button>
            </div>

            {/* ── Sidebar Overlay (mobile) ── */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

            {/* ── Sidebar ── */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={20} color="white" />
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Spendly</span>
                </div>

                {/* Add Expense Button */}
                <button
                    className="btn-primary"
                    onClick={() => { setShowAddExpense(true); closeSidebar(); }}
                    style={{ marginBottom: 24, justifyContent: 'center' }}
                >
                    <Plus size={16} />
                    Add Expense
                </button>

                {/* Nav */}
                <nav style={{ flex: 1 }}>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={closeSidebar}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                marginBottom: 4,
                                textDecoration: 'none',
                                fontSize: 14,
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: isActive ? '#6366f1' : '#94a3b8',
                                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                            })}
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div style={{
                    borderTop: '1px solid #2d2d4e',
                    paddingTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                    }}>
                        {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.displayName}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{user?.plan === 'pro' ? '⭐ Pro' : 'Free'}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* ── Mobile Bottom Nav ── */}
            <nav className="mobile-bottom-nav">
                <div className="mobile-bottom-nav-inner">
                    {navItems.map(({ to, icon: Icon, label }) => {
                        const isActive = location.pathname.startsWith(to);
                        return (
                            <NavLink key={to} to={to}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                    padding: '6px 12px', textDecoration: 'none', borderRadius: 10,
                                    color: isActive ? '#6366f1' : '#64748b',
                                    transition: 'color 0.2s',
                                    minWidth: 52,
                                }}>
                                <div style={{
                                    padding: '4px 10px', borderRadius: 8,
                                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                                    transition: 'background 0.2s',
                                }}>
                                    <Icon size={20} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} />}
        </div>
    );
}
