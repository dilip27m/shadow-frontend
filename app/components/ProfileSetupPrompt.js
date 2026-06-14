'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { AlertTriangle, Mail, ArrowRight, X } from 'lucide-react';
import { useNotification } from '@/app/components/Notification';

export default function ProfileSetupPrompt({ classId, rollNumber }) {
    const router = useRouter();
    const notify = useNotification();
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classId || !rollNumber) return;

        // Check profile status
        const checkProfile = async () => {
            try {
                const res = await api.get('/student/profile');
                // Target users who haven't verified their email (or still have default password)
                if (!res.data.isEmailVerified || res.data.hasDefaultPassword) {
                    setIsVisible(true);
                }
            } catch (err) {
                console.error("Failed to fetch profile status");
            } finally {
                setLoading(false);
            }
        };

        checkProfile();
    }, [classId, rollNumber]);

    if (!isVisible || loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-40 animate-fade-in-down">
            <div className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-xl">
                <div className="max-w-md mx-auto px-4 py-3 flex items-start gap-3 relative">
                    <div className="mt-0.5 shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 pr-6">
                        <p className="text-sm text-amber-200/90 font-medium">
                            Action Required
                        </p>
                        <p className="text-xs text-amber-100/70 mt-0.5 mb-2 leading-snug">
                            Your account is currently using the default password. Setup your profile with an email address to secure it.
                        </p>
                        <button
                            onClick={() => router.push(`/student/${classId}/${rollNumber}/profile`)}
                            className="bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-900/20"
                        >
                            Complete Profile
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 p-1.5 text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
