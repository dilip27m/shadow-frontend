"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';

export default function AdminSettings() {
    const router = useRouter();
    const notify = useNotification();
    const [loading, setLoading] = useState(true);
    const [classId, setClassId] = useState(null);
    const [className, setClassName] = useState('');

    // Settings state
    const [minPercentage, setMinPercentage] = useState(75);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const storedClassId = localStorage.getItem('adminClassId');
        if (!storedClassId) {
            router.push('/admin/login');
            return;
        }
        setClassId(storedClassId);

        // Load current settings
        api.get(`/class/${storedClassId}`)
            .then(res => {
                setClassName(res.data.className);
                if (res.data.settings) {
                    setMinPercentage(res.data.settings.minAttendancePercentage || 75);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('adminClassId');
        router.push('/');
    };

    const handleSave = async () => {
        setSaving(true);

        const settings = {
            minAttendancePercentage: minPercentage
        };

        try {
            await api.put('/class/update-settings', { classId, settings });
            notify({ message: 'Settings saved successfully!', type: 'success' });
        } catch (err) {
            notify({ message: 'Failed to save settings', type: 'error' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-white animate-pulse">Loading...</div>;

    return (
        <>
            <Navbar isAdmin={true} onLogout={handleLogout} />

            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">Class Settings</h1>
                    <p className="text-[var(--text-dim)] text-sm">{className}</p>
                </div>

                {/* Minimum Percentage */}
                <div className="card mb-4">
                    <h2 className="text-sm uppercase text-[var(--text-dim)] mb-3">Minimum Attendance Percentage</h2>
                    <p className="text-sm text-[var(--text-dim)] mb-3">
                        Students below this percentage will be marked as "at risk"
                    </p>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={minPercentage}
                            onChange={(e) => setMinPercentage(parseInt(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-2xl font-bold text-blue-400 min-w-[60px]">{minPercentage}%</span>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                >
                    {saving ? 'Saving...' : 'Save Settings 💾'}
                </button>

                {/* Back Button */}
                <div className="mt-4 text-center">
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="text-sm text-[var(--text-dim)] hover:text-white"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

            </div>
        </>
    );
}
