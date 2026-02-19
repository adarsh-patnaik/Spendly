import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Zap, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 52, height: 52,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <Zap size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Reset password</h1>
                    <p style={{ color: '#94a3b8', fontSize: 15 }}>We'll send you a reset link</p>
                </div>

                <div className="card">
                    {sent ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Check your email</h3>
                            <p style={{ color: '#94a3b8', fontSize: 14 }}>If that email exists, we've sent a reset link. It expires in 1 hour.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="label">Email address</label>
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="input" placeholder="you@example.com" required
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} /> Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
