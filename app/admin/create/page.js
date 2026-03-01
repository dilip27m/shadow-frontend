"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, BookOpen, Shield, Eye, EyeOff, ArrowRight,
    Hash, Mail, Calendar
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';

export default function CreateClass() {
    const router = useRouter();
    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        className: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        semester: '',
        academicYear: '',
        rangeStart: '',
        rangeEnd: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.adminPassword !== formData.confirmPassword) {
            notify({ message: 'Passwords do not match!', type: 'error' });
            return;
        }

        if (formData.adminPassword.length < 8) {
            notify({ message: 'Password must be at least 8 characters', type: 'error' });
            return;
        }

        const semester = parseInt(formData.semester, 10);
        if (!semester || semester < 1 || semester > 8) {
            notify({ message: 'Semester must be between 1 and 8', type: 'error' });
            return;
        }

        if (!formData.rangeStart.trim() || !formData.rangeEnd.trim()) {
            notify({ message: 'Roll number range is required', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/class/create', {
                className: formData.className.trim(),
                adminEmail: formData.adminEmail.trim().toLowerCase(),
                adminPassword: formData.adminPassword,
                semester,
                academicYear: formData.academicYear.trim(),
                rangeConfig: {
                    start: formData.rangeStart.trim(),
                    end: formData.rangeEnd.trim()
                }
            });

            notify({
                message: `Class "${formData.className}" created! Pending Super Admin approval.`,
                type: 'success'
            });

            setTimeout(() => router.push('/'), 2500);
        } catch (err) {
            const msg = err.response?.data?.error
                || err.response?.data?.details?.map(d => d.message).join(', ')
                || 'Failed to create class.';
            notify({ message: msg, type: 'error' });
            setLoading(false);
        }
    };

    const rangePreview = (() => {
        if (!formData.rangeStart || !formData.rangeEnd) return null;
        const regex = /^(.*?)(\d+)$/;
        const startMatch = formData.rangeStart.trim().match(regex);
        const endMatch = formData.rangeEnd.trim().match(regex);
        if (!startMatch || !endMatch) return null;
        const startNum = parseInt(startMatch[2], 10);
        const endNum = parseInt(endMatch[2], 10);
        if (endNum < startNum) return null;
        return endNum - startNum + 1;
    })();

    return (
        <>
            <Navbar />

            <div className="max-w-md mx-auto px-4 py-12">
                <div className="text-center mb-8 animate-fade-up">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2" style={{ letterSpacing: '-0.03em' }}>Create New Class</h1>
                    <p className="text-[var(--text-dim)]">Set up your class for attendance tracking</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-card animate-fade-up delay-100">
                    <div className="space-y-4">

                        {/* Class Name */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Class Name
                            </label>
                            <input
                                id="create-class-name"
                                type="text"
                                className="input"
                                placeholder="e.g. S6 CSE-B"
                                value={formData.className}
                                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                                required
                            />
                        </div>

                        {/* Semester & Academic Year */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                    Semester
                                </label>
                                <select
                                    id="create-semester"
                                    className="input"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    required
                                >
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                    Academic Year
                                </label>
                                <input
                                    id="create-academic-year"
                                    type="text"
                                    className="input"
                                    placeholder="2025-2026"
                                    value={formData.academicYear}
                                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Roll Number Range */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                <Hash className="w-3.5 h-3.5 inline mr-1" />
                                Roll Number Range
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    id="create-range-start"
                                    type="text"
                                    className="input text-center"
                                    placeholder="e.g. 21CS001"
                                    value={formData.rangeStart}
                                    onChange={(e) => setFormData({ ...formData, rangeStart: e.target.value })}
                                    required
                                />
                                <input
                                    id="create-range-end"
                                    type="text"
                                    className="input text-center"
                                    placeholder="e.g. 21CS060"
                                    value={formData.rangeEnd}
                                    onChange={(e) => setFormData({ ...formData, rangeEnd: e.target.value })}
                                    required
                                />
                            </div>
                            {rangePreview !== null && (
                                <div className="rounded-xl border border-white/10 bg-white/3 px-3 py-2 mt-2">
                                    <p className="text-xs text-[var(--text-dim)]">
                                        Will create <span className="text-white font-semibold">{rangePreview}</span> student accounts
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Security Section */}
                        <div className="border-t border-white/6 pt-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Admin Credentials</span>
                            </div>
                        </div>

                        {/* Admin Email */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                                <input
                                    id="create-admin-email"
                                    type="email"
                                    className="input pl-10"
                                    placeholder="admin@college.edu"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Admin Password */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-dim)] mb-2 uppercase tracking-wider">
                                Admin Password
                            </label>
                            <div className="relative">
                                <input
                                    id="create-admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12"
                                    placeholder="Min 8 characters"
                                    minLength="8"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
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
                                    id="create-confirm-password"
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
                            {formData.confirmPassword && formData.adminPassword !== formData.confirmPassword && (
                                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                            )}
                            {formData.confirmPassword && formData.adminPassword === formData.confirmPassword && (
                                <p className="text-xs text-emerald-400 mt-1.5">Passwords match ✓</p>
                            )}
                        </div>

                        <button
                            id="create-submit-btn"
                            type="submit"
                            className="btn btn-primary w-full mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Create Class
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>

                        <p className="text-xs text-center text-[var(--text-dim)] mt-2">
                            Your class will require Super Admin approval before students can be provisioned.
                        </p>
                    </div>
                </form>

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
