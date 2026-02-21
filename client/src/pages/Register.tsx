import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';

const schema = z.object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            await registerUser(data.email, data.password, data.displayName);
            toast.success('Account created! Welcome to Spendly 🎉');
            navigate('/dashboard');
        } catch (err: any) {
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                toast.error('Server is waking up, please try again in a moment ⏳');
            } else if (!err.response) {
                toast.error('Cannot reach server. Check your connection and try again.');
            } else {
                toast.error(err.response?.data?.error || 'Registration failed');
            }
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
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Create your account</h1>
                    <p style={{ color: '#94a3b8', fontSize: 15 }}>Start tracking smarter today</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <label className="label">Display Name</label>
                            <input {...register('displayName')} className="input" placeholder="Alex Johnson" />
                            {errors.displayName && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.displayName.message}</p>}
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
                            {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input" placeholder="Min. 8 characters" style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 24, color: '#94a3b8', fontSize: 14 }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
