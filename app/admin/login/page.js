"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';

export default function AdminLogin() {
    const router = useRouter();
    const notify = useNotification();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const storedClassId = localStorage.getItem('adminClassId');
        const storedToken = localStorage.getItem('token');
        if (storedClassId && storedToken) {
            api.post('/class/verify-token')
                .then(res => {
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('adminClassId', res.data.classId);
                    router.push('/admin/attention');
                })
                .catch(() => {
                    localStorage.removeItem('adminClassId');
                    localStorage.removeItem('token');
                    setCheckingSession(false);
                });
        } else {
            setCheckingSession(false);
        }
    }, [router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/login', {
                email: email.trim().toLowerCase(),
                password
            });

            localStorage.setItem('adminClassId', res.data.user.classId);
            localStorage.setItem('token', res.data.token);
            router.push('/admin/attention');
        } catch (err) {
            const msg = err.response?.data?.error || 'Login failed!';
            notify({ message: msg, type: 'error' });
            setLoading(false);
        }
    };

    if (checkingSession) return <div className="flex h-screen items-center justify-center text-white animate-pulse">Loading...</div>;

    return (
        <>
            <Navbar />

            <div className="max-w-md mx-auto px-4 py-16">

                {/* Header */}
                <div className="text-center mb-8 animate-fade-up">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2" style={{ letterSpacing: '-0.03em' }}>Admin Login</h1>
                    <p className="text-[var(--text-dim)]">Enter your admin email and password to continue</p>
                </div>

                {/* Form */}
                <div className="glass-card animate-fade-up delay-100">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    className="input pl-10"
                                    placeholder="admin@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white transition"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="admin-login-submit"
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verifying...
                                </span>
                            ) : 'Login'}
                        </button>
                    </form>
                </div>

                {/* Back link */}
                <div className="mt-6 text-center animate-fade-up delay-200">
                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-white transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>
                </div>

            </div>
        </>
    );
}