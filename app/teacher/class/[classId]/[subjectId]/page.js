"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';
import { ArrowLeft, Users, AlertTriangle } from 'lucide-react';

export default function TeacherAttendanceView() {
    const params = useParams();
    const router = useRouter();
    const notify = useNotification();

    // params.classId and params.subjectId are string|string[]
    // Unwrapping them properly if they come as arrays (optional safety)
    const classId = params.classId;
    const subjectId = params.subjectId;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'shortage', 'critical'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/attendance/stats/subject/${classId}/${subjectId}`);
                setData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                notify({ message: 'Failed to load attendance stats', type: 'error' });
                if (err.response?.status === 403 || err.response?.status === 401) {
                    router.push('/teacher/dashboard');
                }
                setLoading(false);
            }
        };

        if (classId && subjectId) {
            fetchStats();
        }
    }, [classId, subjectId, router, notify]);

    if (loading) return <div className="flex h-screen items-center justify-center text-white animate-pulse">Loading...</div>;
    if (!data) return <div className="text-center text-white mt-20">Stats not found</div>;

    const filteredStudents = data.students.filter(s => {
        if (filter === 'shortage') return s.percentage < 75;
        if (filter === 'critical') return s.percentage < 50;
        return true;
    });

    return (
        <>
            <Navbar isTeacher={true} onLogout={() => {
                localStorage.removeItem('token');
                router.push('/');
            }} />

            <div className="max-w-5xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[var(--text-dim)] hover:text-white mb-6 transition"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-white/10">
                    <h1 className="text-3xl font-bold mb-2">{data.className}</h1>
                    <p className="text-xl text-[var(--text-dim)] flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5" /> {data.subjectName} Attendance Report
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                        <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-[var(--text-dim)] text-xs uppercase">Total Classes</span>
                            <p className="text-2xl font-bold">{data.totalClasses}</p>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-white/10">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-[var(--text-dim)] hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('shortage')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'shortage'
                                    ? 'bg-orange-600 text-white'
                                    : 'text-[var(--text-dim)] hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Shortage (&lt;75%)
                            </button>
                            <button
                                onClick={() => setFilter('critical')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'critical'
                                    ? 'bg-red-600 text-white'
                                    : 'text-[var(--text-dim)] hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Critical (&lt;50%)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-[#1a1a1a] rounded-xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[var(--text-dim)] text-sm uppercase">
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Present</th>
                                <th className="p-4">Absent</th>
                                <th className="p-4">Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-[var(--text-dim)]">
                                        No students found for this filter.
                                    </td>
                                </tr>
                            ) : filteredStudents.map((student) => {
                                const isLow = student.percentage < 75;
                                return (
                                    <tr key={student.rollNumber} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="p-4 font-bold">#{student.rollNumber}</td>
                                        <td className="p-4 text-green-400">{student.present}</td>
                                        <td className="p-4 text-red-400">{student.absent}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-full max-w-[100px] h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${student.percentage}%` }}
                                                    />
                                                </div>
                                                <span className={`font-bold ${isLow ? 'text-red-400' : 'text-green-400'}`}>
                                                    {student.percentage}%
                                                </span>
                                                {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
