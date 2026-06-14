'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';
import { User, ShieldCheck, Mail, Key, Loader2, Edit3, Save, Search, Lock } from 'lucide-react';

export default function StudentProfile() {
    const params = useParams();
    const { classId, rollNumber } = params;
    const notify = useNotification();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [emailForm, setEmailForm] = useState({ email: '', otp: '', mode: 'SEND' }); // SEND or VERIFY
    const [emailLoading, setEmailLoading] = useState(false);

    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [nameForm, setNameForm] = useState({ name: '', isEditing: false });
    const [nameLoading, setNameLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/student/profile');
            setProfile(res.data);
            setNameForm(prev => ({ ...prev, name: res.data.name || '' }));
        } catch (err) {
            notify({ message: 'Failed to load profile', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!nameForm.name.trim()) return notify({ message: 'Name cannot be empty', type: 'error' });
        setNameLoading(true);
        try {
            await api.post('/student/update-name', { name: nameForm.name.trim() });
            notify({ message: 'Name updated successfully', type: 'success' });
            setProfile(prev => ({ ...prev, name: nameForm.name.trim() }));
            setNameForm(prev => ({ ...prev, isEditing: false }));
        } catch (err) {
            notify({ message: 'Failed to update name', type: 'error' });
        } finally {
            setNameLoading(false);
        }
    };

    const handleEmailAction = async (e) => {
        e.preventDefault();
        setEmailLoading(true);
        try {
            if (emailForm.mode === 'SEND') {
                await api.post('/student/send-verification-otp', { email: emailForm.email });
                notify({ message: 'OTP sent to your email!', type: 'success' });
                setEmailForm(prev => ({ ...prev, mode: 'VERIFY' }));
            } else {
                await api.post('/student/verify-email', { email: emailForm.email, otp: emailForm.otp });
                notify({ message: 'Email verified successfully!', type: 'success' });
                setProfile(prev => ({ ...prev, isEmailVerified: true, email: emailForm.email }));
                setEmailForm({ email: '', otp: '', mode: 'SEND' });
            }
        } catch (err) {
            notify({ message: err.response?.data?.error || 'Verification failed', type: 'error' });
        } finally {
            setEmailLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        try {
            await api.post('/student/change-password', passwordForm);
            notify({ message: 'Password updated securely!', type: 'success' });
            setProfile(prev => ({ ...prev, hasDefaultPassword: false }));
            setPasswordForm({ oldPassword: '', newPassword: '' });
        } catch (err) {
            notify({ message: err.response?.data?.error || 'Failed to change password', type: 'error' });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24">
            <Navbar isStudent={true} classId={classId} rollNumber={rollNumber} />

            <div className="max-w-md mx-auto px-4 py-8 mt-4 animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-900/40 shrink-0 border border-white/20">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        {nameForm.isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    className="bg-white/10 border border-fuchsia-500/50 rounded-lg px-3 py-1 text-white flex-1 focus:outline-none focus:border-fuchsia-500"
                                    value={nameForm.name}
                                    onChange={(e) => setNameForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your name"
                                    autoFocus
                                />
                                <button
                                    onClick={handleUpdateName}
                                    disabled={nameLoading}
                                    className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded-lg transition-colors border border-emerald-500/30"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setNameForm({ name: profile.name || '', isEditing: false })}
                                    className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors border border-red-500/30"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setNameForm(prev => ({ ...prev, isEditing: true }))}>
                                <h1 className="text-2xl font-bold text-white truncate leading-tight">
                                    {profile?.name || `Student ${rollNumber}`}
                                </h1>
                                <Edit3 className="w-4 h-4 text-white/30 group-hover:text-fuchsia-400 transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                        )}
                        <p className="text-[var(--text-dim)] font-medium flex items-center gap-2 mt-0.5">
                            Roll No. <span className="text-white px-2 py-0.5 rounded bg-white/10 border border-white/10">{rollNumber}</span>
                        </p>
                    </div>
                </div>

                {/* Email Verification Section */}
                <div className="mb-6 bg-[#0f0f13]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-[40px] pointer-events-none" />

                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl ${profile?.isEmailVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
                            {profile?.isEmailVerified ? <ShieldCheck className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                        </div>
                        <h2 className="text-xl font-bold flex-1 text-white">Identity Security</h2>
                    </div>

                    {profile?.isEmailVerified ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                            <p className="text-sm text-emerald-400 font-semibold mb-1">Protection Active</p>
                            <p className="text-xs text-emerald-200/60 leading-relaxed mb-3">
                                Your account is bound and verified to your email address. It enables secure password resets.
                            </p>
                            <div className="flex justify-between items-center bg-black/30 rounded-lg p-2.5 border border-white/5">
                                <span className="text-sm font-mono text-emerald-300 truncate">{profile.email}</span>
                                <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded">Verified</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleEmailAction} className="space-y-4">
                            <div>
                                <p className="text-sm text-amber-200/80 mb-4 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                    Link an email address so you can securely reset your password if you ever forget it. This unlocks the ability to change passwords.
                                </p>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    disabled={emailForm.mode === 'VERIFY'}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                                    placeholder="student@university.edu"
                                    value={emailForm.email}
                                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                />
                            </div>

                            {emailForm.mode === 'VERIFY' && (
                                <div className="animate-fade-in-down">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1.5 ml-1">Enter 6-Digit OTP</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-center tracking-[0.5em] text-lg font-bold text-amber-400 focus:outline-none focus:border-amber-500 transition-colors placeholder:tracking-normal placeholder:font-normal placeholder:text-amber-500/30"
                                        placeholder="000000"
                                        value={emailForm.otp}
                                        onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value.replace(/\D/g, '') })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEmailForm({ email: emailForm.email, otp: '', mode: 'SEND' })}
                                        className="text-xs text-amber-500/60 hover:text-amber-400 mt-2 ml-1"
                                    >
                                        Wrong email? Start over.
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={emailLoading}
                                className="w-full bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-900/30 flex items-center justify-center transition-all disabled:opacity-70"
                            >
                                {emailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (emailForm.mode === 'SEND' ? 'Send Verification Code' : 'Verify & Lock Account')}
                            </button>
                        </form>
                    )}
                </div>

                {/* Password Section */}
                <div className={`bg-[#0f0f13]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-500 ${!profile?.isEmailVerified && 'opacity-60 grayscale-[50%]'}`}>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
                            <Key className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold flex-1 text-white">Password</h2>
                    </div>

                    {!profile?.isEmailVerified ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <Lock className="w-8 h-8 text-white/20 mb-3" />
                            <p className="text-sm text-white/50 px-4">You must verify your email address above before you can change your password.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {profile?.hasDefaultPassword && (
                                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400/90 text-sm p-3 rounded-lg flex gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>You are using the default password pattern. Please change it immediately!</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs text-white/50 mb-1 ml-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                    placeholder={profile?.hasDefaultPassword ? "shadow123" : "••••••••"}
                                    value={passwordForm.oldPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-white/50 mb-1 ml-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                    placeholder="Must be at least 6 characters"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl border border-white/10 flex items-center justify-center transition-all disabled:opacity-50 mt-2"
                            >
                                {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
