'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Key, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';

export default function ForgotPassword() {
    const router = useRouter();
    const notify = useNotification();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/student/forgot-password', { email: email.trim() });
            notify({ message: 'OTP sent to your verified email!', type: 'success' });
            setStep(2);
        } catch (err) {
            notify({ message: err.response?.data?.error || 'Account not found or unverified', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/student/reset-password', {
                email: email.trim(),
                otp: otp.trim(),
                newPassword: newPassword.trim()
            });
            notify({ message: 'Password reset successful! You can now log in.', type: 'success' });
            router.push('/');
        } catch (err) {
            notify({ message: err.response?.data?.error || 'Failed to reset password', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col pt-16 px-4">
            <button
                onClick={() => router.push('/')}
                className="absolute top-6 left-4 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Login</span>
            </button>

            <div className="max-w-md w-full mx-auto relative animate-fade-in-up">
                {/* Visual Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-600 to-indigo-600 mb-6 shadow-[0_0_40px_rgba(192,38,211,0.3)] relative">
                        <div className="absolute inset-0 rounded-full blur-xl bg-fuchsia-500/30" />
                        <ShieldCheck className="w-10 h-10 text-white relative z-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Account Recovery</h1>
                    <p className="text-white/50 text-sm">Reset your password using your verified email.</p>
                </div>

                {/* Form Card */}
                <div className="glass-card overflow-hidden relative">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none" />

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 ml-1">Verified Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-fuchsia-500/70" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors placeholder:text-white/20"
                                        placeholder="student@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-fuchsia-900/30 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Recovery OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6 relative z-10 animate-fade-in">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-6 text-center">
                                OTP sent to <span className="font-semibold text-emerald-300">{email}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 ml-1">6-Digit OTP</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="w-full bg-black/40 border border-fuchsia-500/30 rounded-xl px-4 py-3.5 text-center tracking-[0.5em] text-xl font-bold text-fuchsia-400 focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:tracking-normal placeholder:font-normal placeholder:text-white/10"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 ml-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Key className="w-5 h-5 text-fuchsia-500/70" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors placeholder:text-white/20"
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6 || newPassword.length < 6}
                                className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-fuchsia-900/30 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-center text-xs text-white/40 hover:text-white/80 transition-colors"
                            >
                                Didn't receive code? Change email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
