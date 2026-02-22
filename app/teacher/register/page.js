"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';
import { UserPlus, Key, Mail, User, Lock, CheckCircle } from 'lucide-react';

export default function TeacherRegister() {
    const router = useRouter();
    const notify = useNotification();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validation
        if (password !== confirmPassword) {
            notify({ message: 'Passwords do not match!', type: 'error' });
            return;
        }

        if (password.length < 6) {
            notify({ message: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/teacher/register', { name, email, password });

            // Show success with PIN
            setRegistrationSuccess(res.data.teacher);
            notify({ message: 'Account created successfully!', type: 'success' });

        } catch (err) {
            console.error(err);
            notify({ message: err.response?.data?.error || 'Registration failed!', type: 'error' });
            setLoading(false);
        }
    };

    // Success screen showing the PIN
    if (registrationSuccess) {
        return (
            <>
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-12">
                    <div className="card text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
                        <p className="text-[var(--text-dim)] mb-6">Your teacher account has been successfully created.</p>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <User className="w-5 h-5 text-[var(--text-dim)]" />
                                <div className="text-left">
                                    <p className="text-xs text-[var(--text-dim)]">Name</p>
                                    <p className="font-medium">{registrationSuccess.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <Mail className="w-5 h-5 text-[var(--text-dim)]" />
                                <div className="text-left">
                                    <p className="text-xs text-[var(--text-dim)]">Email</p>
                                    <p className="font-medium">{registrationSuccess.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* PIN Display - Prominent */}
                        <div className="p-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl mb-6">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Key className="w-5 h-5 text-blue-400" />
                                <p className="text-sm text-blue-400 font-medium uppercase tracking-wider">Your Secret PIN</p>
                            </div>
                            <p className="text-5xl font-mono font-bold text-blue-400 tracking-widest">
                                {registrationSuccess.teacherCode}
                            </p>
                            <p className="text-xs text-[var(--text-dim)] mt-3">
                                Save this PIN! Admins will use it to assign classes to you.
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/teacher/login')}
                            className="btn btn-primary w-full"
                        >
                            Continue to Login
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="max-w-md mx-auto px-4 py-12">

                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Teacher Registration</h1>
                    <p className="text-[var(--text-dim)]">Create your account to get started</p>
                </div>

                <div className="card">
                    <form onSubmit={handleRegister} className="space-y-4">

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-dim)] mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-dim)] mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email
                            </label>
                            <input
                                type="email"
                                className="input"
                                placeholder="teacher@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-dim)] mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Password
                            </label>
                            <input
                                type="password"
                                className="input"
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-dim)] mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                className="input"
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-[var(--text-dim)] mb-2">Already have an account?</p>
                    <button
                        onClick={() => router.push('/teacher/login')}
                        className="text-sm text-blue-400 hover:text-blue-300"
                    >
                        Login here →
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-[var(--text-dim)] hover:text-white"
                    >
                        ← Back to Home
                    </button>
                </div>

            </div>
        </>
    );
}
