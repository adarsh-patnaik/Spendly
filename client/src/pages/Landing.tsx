import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Globe, Brain, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
    { icon: Brain, title: 'AI Categorization', desc: 'Automatically categorizes every expense as you type the merchant name.' },
    { icon: Globe, title: 'Multi-Currency', desc: 'Support for 150+ currencies with live exchange rates.' },
    { icon: TrendingUp, title: 'Smart Analytics', desc: 'Visual insights into your spending patterns by category and merchant.' },
    { icon: CheckCircle, title: 'Budget Tracking', desc: 'Set budgets per category and get alerts before you overspend.' },
];

export default function Landing() {
    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0' }}>
            {/* Navbar */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 48px', borderBottom: '1px solid #2d2d4e',
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(15, 15, 26, 0.9)', backdropFilter: 'blur(12px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={20} color="white" />
                    </div>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>Spendly</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>Log In</Link>
                    <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Get Started Free</Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '100px 48px 80px', position: 'relative', overflow: 'hidden' }}>
                {/* Glow */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 600, height: 400,
                    background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 999, padding: '6px 16px', marginBottom: 24,
                    fontSize: 13, color: '#a5b4fc',
                }}>
                    <Brain size={14} />
                    AI-Powered Expense Tracking
                </div>

                <h1 style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, maxWidth: 700, margin: '0 auto 24px' }}>
                    Know exactly where your{' '}
                    <span className="gradient-text">money goes</span>
                </h1>

                <p style={{ fontSize: 20, color: '#94a3b8', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
                    Spendly auto-categorizes every expense using AI and handles multiple currencies transparently — so tracking feels effortless.
                </p>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: 16, padding: '14px 28px' }}>
                        Start for free <ArrowRight size={18} />
                    </Link>
                    <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 16, padding: '14px 28px' }}>
                        Sign in
                    </Link>
                </div>

                <p style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>No credit card required · Free forever plan</p>
            </section>

            {/* Features */}
            <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 700, marginBottom: 16 }}>
                    Everything you need, nothing you don't
                </h2>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 60, fontSize: 18 }}>
                    Built for freelancers, remote workers, and frequent travellers.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                    {features.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="card" style={{ transition: 'transform 0.2s, border-color 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#6366f1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#2d2d4e'; }}
                        >
                            <div style={{
                                width: 48, height: 48,
                                background: 'rgba(99,102,241,0.15)',
                                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 16,
                            }}>
                                <Icon size={24} color="#6366f1" />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: 14 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{ textAlign: 'center', padding: '80px 48px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 24, padding: '60px 40px', maxWidth: 600, margin: '0 auto',
                }}>
                    <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>Ready to take control?</h2>
                    <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 16 }}>
                        Join thousands of users who track smarter with Spendly.
                    </p>
                    <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: 16, padding: '14px 32px' }}>
                        Create free account <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #2d2d4e', padding: '24px 48px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                © 2026 Spendly. Built with ❤️ for the financially aware.
            </footer>
        </div>
    );
}
