import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await signup(form.name, form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-mark">
                        <div className="logo-icon">⚡</div>
                        TaskFlow
                    </div>
                </div>
                <div className="card">
                    <h2 className="auth-title">Create account</h2>
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" type="text" placeholder="Jane Smith"
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" placeholder="you@example.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" placeholder="Min 6 characters"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                        <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
                            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Creating...</> : 'Create Account'}
                        </button>
                    </form>
                    <div className="auth-switch">
                        Already have an account? <a onClick={() => navigate('/login')}>Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}