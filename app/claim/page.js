"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowLeft, Loader2, Eye, EyeOff, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';

export default function ClaimAccount() {
    const router = useRouter();
    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [classes, setClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [claimed, setClaimed] = useState(false);

    const [formData, setFormData] = useState({
        rollNumber: '',
        classId: '',
        secretKey: '',
        newPassword: '',
        confirmPassword: '',
        recoveryEmail: ''
    });

    // Fetch approved classes for dropdown
    useEffect(() => {
        api.get('/class/public/list')
            .then(res => {
                setClasses(res.data.classes || []);
            })
            .catch(() => {
                // Fallback: allow manual classId entry
            })
            .finally(() => setLoadingClasses(false));
    }, []);

    const handleClaim = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            notify({ message: 'Passwords do not match!', type: 'error' });
            return;
        }

        if (formData.newPassword.length < 8) {
            notify({ message: 'Password must be at least 8 characters', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                rollNumber: formData.rollNumber.trim(),
                classId: formData.classId,
                secretKey: formData.secretKey.trim(),
                newPassword: formData.newPassword
            };

            if (formData.recoveryEmail.trim()) {
                payload.recoveryEmail = formData.recoveryEmail.trim();
            }

            const res = await api.post('/auth/claim-account', payload);

            // Store session
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('studentClassId', res.data.student.classId);
            localStorage.setItem('studentRoll', res.data.student.rollNumber);

            setClaimed(true);
            notify({ message: 'Account claimed successfully!', type: 'success' });

            setTimeout(() => {
                router.push(`/student/${res.data.student.classId}/${res.data.student.rollNumber}/attention`);
            }, 2000);

        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to claim account. Check your details.';
            notify({ message: msg, type: 'error' });
            setLoading(false);
        }
    };

    if (claimed) {
        return (
            <>
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-up">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3" style={{ letterSpacing: '-0.03em' }}>Account Claimed!</h1>
                    <p className="text-[var(--text-dim)]">Redirecting to your dashboard...</p>
                    <div className="mt-6">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-[var(--text-dim)]" />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="max-w-md mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-up">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-6 h-6 text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2" style={{ letterSpacing: '-0.03em' }}>Claim Your Account</h1>
                    <p className="text-[var(--text-dim)]">Use the secret key from your admin to activate your account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleClaim} className="glass-card animate-fade-up delay-100">
                    <div className="space-y-4">

                        {/* Class Selection */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Class
                            </label>
                            {loadingClasses ? (
                                <div className="input flex items-center text-[var(--text-dim)]">Loading classes...</div>
                            ) : classes.length > 0 ? (
                                <select
                                    id="claim-class"
                                    className="input"
                                    value={formData.classId}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                    required
                                >
                                    <option value="">Select your class</option>
                                    {classes.map(cls => (
                                        <option key={cls._id} value={cls._id}>
                                            {cls.className}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id="claim-class-id"
                                    type="text"
                                    className="input"
                                    placeholder="Enter your Class ID"
                                    value={formData.classId}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                    required
                                />
                            )}
                        </div>

                        {/* Roll Number */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Roll Number
                            </label>
                            <input
                                id="claim-roll"
                                type="text"
                                className="input"
                                placeholder="e.g. 21CS042"
                                value={formData.rollNumber}
                                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                autoComplete="off"
                                required
                            />
                        </div>

                        {/* Secret Key */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Secret Key
                            </label>
                            <input
                                id="claim-secret-key"
                                type="text"
                                className="input font-mono tracking-widest text-center text-lg"
                                placeholder="e.g. Xk9f2A"
                                maxLength={6}
                                value={formData.secretKey}
                                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                                autoComplete="off"
                                required
                            />
                            <p className="text-xs text-[var(--text-dim)] mt-1.5 text-center">
                                6-character alphanumeric key from your admin
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/6 pt-2">
                            <div className="flex items-center gap-2 mb-3">
                                <KeyRound className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Set Your Password</span>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="claim-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12"
                                    placeholder="Min 8 characters"
                                    minLength="8"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="claim-confirm-password"
                                    type={showConfirm ? 'text' : 'password'}
                                    className="input pr-12"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white transition"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                            )}
                            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                <p className="text-xs text-emerald-400 mt-1.5">Passwords match ✓</p>
                            )}
                        </div>

                        {/* Recovery Email (optional) */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Recovery Email <span className="text-[var(--text-dim)] normal-case">(optional)</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                                <input
                                    id="claim-email"
                                    type="email"
                                    className="input pl-10"
                                    placeholder="you@email.com"
                                    value={formData.recoveryEmail}
                                    onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="claim-submit-btn"
                            type="submit"
                            className="btn btn-primary w-full mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Claiming...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Claim Account
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>

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
