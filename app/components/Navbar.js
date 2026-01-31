'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, PlusCircle, LogIn, UserPlus, GraduationCap } from 'lucide-react';

export default function Navbar({ isAdmin = false, isStudent = false, isTeacher = false, onLogout, onReportClick, classId, rollNumber }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [navClassId, setNavClassId] = useState(classId);
    const router = useRouter();
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    // Load classId from localStorage for admins if not provided via props
    useEffect(() => {
        if (typeof window !== 'undefined' && isAdmin && !classId) {
            const stored = localStorage.getItem('adminClassId');
            if (stored) setNavClassId(stored);
        }
    }, [isAdmin, classId]);

    // Keep state in sync if prop changes
    useEffect(() => {
        if (classId) setNavClassId(classId);
    }, [classId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showQuickActions && !e.target.closest('.quick-actions-container')) {
                setShowQuickActions(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showQuickActions]);

    return (
        <nav className="border-b border-[var(--border)] p-4 sticky top-0 bg-black/80 backdrop-blur-md z-50">
            <div className="max-w-5xl mx-auto flex justify-between items-center">

                <Link href="/" className="text-lg font-bold tracking-tight">
                    SHADOW
                </Link>

                {/* Quick Actions for Homepage (Guests) */}
                {isHomePage && !isAdmin && !isStudent && !isTeacher && (
                    <div className="quick-actions-container relative">
                        {/* Desktop: Show buttons directly */}
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => router.push('/admin/setup')}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Create Class
                            </button>
                            <button
                                onClick={() => router.push('/admin/login')}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/10"
                            >
                                <LogIn className="w-4 h-4" />
                                Admin
                            </button>
                            <button
                                onClick={() => router.push('/teacher/login')}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/10"
                            >
                                <GraduationCap className="w-4 h-4" />
                                Teacher
                            </button>
                            <button
                                onClick={() => router.push('/teacher/register')}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg font-medium transition-all border border-green-500/30"
                            >
                                <UserPlus className="w-4 h-4" />
                                Register
                            </button>
                        </div>

                        {/* Mobile: Show dropdown */}
                        <div className="md:hidden">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowQuickActions(!showQuickActions);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/10"
                            >
                                Get Started
                                <ChevronDown className={`w-4 h-4 transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />
                            </button>

                            {showQuickActions && (
                                <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-lg">
                                    <button
                                        onClick={() => { router.push('/admin/setup'); setShowQuickActions(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <PlusCircle className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Create Class</p>
                                            <p className="text-xs text-[var(--text-dim)]">For class representatives</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { router.push('/admin/login'); setShowQuickActions(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left border-t border-white/5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <LogIn className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Admin Login</p>
                                            <p className="text-xs text-[var(--text-dim)]">Manage your class</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { router.push('/teacher/login'); setShowQuickActions(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left border-t border-white/5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                            <GraduationCap className="w-4 h-4 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Teacher Login</p>
                                            <p className="text-xs text-[var(--text-dim)]">Access dashboard</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { router.push('/teacher/register'); setShowQuickActions(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors text-left border-t border-white/5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <UserPlus className="w-4 h-4 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Teacher Register</p>
                                            <p className="text-xs text-[var(--text-dim)]">Create new account</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {(isAdmin || isStudent || isTeacher) && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex flex-col gap-1 p-2"
                    >
                        <span className={`w-5 h-0.5 bg-white transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                        <span className={`w-5 h-0.5 bg-white transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`w-5 h-0.5 bg-white transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-3 max-w-5xl mx-auto">
                    {isAdmin ? (
                        <>
                            <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Dashboard
                            </Link>
                            <Link href="/admin/teachers" onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Teachers
                            </Link>
                            <Link href="/admin/settings" onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Settings
                            </Link>
                            {navClassId && (
                                <Link href={`/admin/reports/${navClassId}`} onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                    Reports
                                </Link>
                            )}
                            <button onClick={() => { onLogout?.(); setIsOpen(false); }} className="text-sm text-[var(--danger-text)] hover:text-red-400 text-left transition">
                                Logout
                            </button>
                        </>
                    ) : isTeacher ? (
                        <>
                            <Link href="/teacher/dashboard" onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Dashboard
                            </Link>
                            <Link href="/teacher/settings" onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Settings
                            </Link>
                            <button onClick={() => { onLogout?.(); setIsOpen(false); }} className="text-sm text-[var(--danger-text)] hover:text-red-400 text-left transition">
                                Logout
                            </button>
                        </>
                    ) : isStudent ? (
                        <>
                            <Link href={`/student/${classId}/${rollNumber}`} onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Dashboard
                            </Link>
                            <Link href={`/student/${classId}/${rollNumber}/calendar`} onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Calendar
                            </Link>
                            {/* <Link href={`/student/${classId}/${rollNumber}/bunk-effect`} onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white transition">
                                Bunk Effect
                            </Link> */}
                            {onReportClick && (
                                <button onClick={() => { onReportClick(); setIsOpen(false); }} className="text-sm text-[var(--text-dim)] hover:text-white text-left transition">
                                    Report Issue
                                </button>
                            )}
                            <button onClick={() => { onLogout?.(); setIsOpen(false); }} className="text-sm text-[var(--danger-text)] hover:text-red-400 text-left transition">
                                Logout
                            </button>
                        </>
                    ) : (
                        null
                    )}
                </div>
            )}
        </nav>
    );
}