"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';
import { UserCheck, Key, BookOpen, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ManageTeachers() {
    const router = useRouter();
    const notify = useNotification();
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]); // All registered teachers
    const [classId, setClassId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Assignment form state
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [teacherPin, setTeacherPin] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        const storedClassId = localStorage.getItem('adminClassId');
        if (!storedClassId) {
            router.push('/admin/login');
            return;
        }
        setClassId(storedClassId);
        fetchData(storedClassId);
    }, [router]);

    const fetchData = async (id) => {
        try {
            // Fetch class subjects
            const classRes = await api.get(`/class/${id}`);
            setSubjects(classRes.data.subjects || []);

            // Fetch all registered teachers
            const teachersRes = await api.get('/class/teachers/list');
            setTeachers(teachersRes.data.teachers || []);

            setLoading(false);
        } catch (err) {
            console.error("Failed to load data:", err);
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();

        if (!selectedTeacherId || !selectedSubjectId || !teacherPin) {
            notify({ message: 'Please fill all fields', type: 'error' });
            return;
        }

        if (teacherPin.length !== 4) {
            notify({ message: 'PIN must be 4 digits', type: 'error' });
            return;
        }

        setAssigning(true);

        try {
            const res = await api.post('/class/assign-teacher', {
                teacherId: selectedTeacherId,
                subjectId: selectedSubjectId,
                teacherPin: teacherPin
            });

            notify({ message: res.data.message, type: 'success' });

            // Reset form
            setSelectedTeacherId('');
            setTeacherPin('');

            // Refresh subjects to show updated assignments
            const classRes = await api.get(`/class/${classId}`);
            setSubjects(classRes.data.subjects || []);

        } catch (err) {
            notify({
                message: err.response?.data?.error || 'Failed to assign teacher',
                type: 'error'
            });
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async (subjectId) => {
        if (!confirm('Are you sure you want to remove this teacher assignment?')) {
            return;
        }

        try {
            await api.delete(`/class/unassign-teacher/${subjectId}`);
            notify({ message: 'Teacher unassigned successfully', type: 'success' });

            // Refresh subjects
            const classRes = await api.get(`/class/${classId}`);
            setSubjects(classRes.data.subjects || []);
        } catch (err) {
            notify({ message: 'Failed to unassign teacher', type: 'error' });
        }
    };

    // Get teacher name by ID
    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t._id === teacherId);
        return teacher?.name || 'Unknown';
    };

    // Get unassigned subjects
    const unassignedSubjects = subjects.filter(s => !s.teacherId);

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-white animate-pulse">Loading...</div>;
    }

    return (
        <>
            <Navbar isAdmin={true} classId={classId} />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-2">Manage Teachers</h1>
                <p className="text-[var(--text-dim)] mb-8">Assign verified teachers to your subjects</p>

                {/* Current Assignments */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        Subject Assignments
                    </h2>

                    <div className="space-y-3">
                        {subjects.map(subject => (
                            <div
                                key={subject._id}
                                className={`card flex justify-between items-center ${subject.teacherId ? 'border-green-500/20' : 'border-orange-500/20'
                                    }`}
                            >
                                <div>
                                    <h3 className="font-semibold">{subject.name}</h3>
                                    {subject.teacherId ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            <span className="text-sm text-green-400">
                                                {subject.teacherName || getTeacherName(subject.teacherId)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <AlertCircle className="w-4 h-4 text-orange-400" />
                                            <span className="text-sm text-orange-400">No teacher assigned</span>
                                        </div>
                                    )}
                                </div>

                                {subject.teacherId && (
                                    <button
                                        onClick={() => handleUnassign(subject._id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg transition"
                                        title="Remove teacher"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Assign Teacher Form */}
                {teachers.length === 0 ? (
                    <div className="card text-center py-8 border-orange-500/30 bg-orange-900/10">
                        <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">No Registered Teachers</h3>
                        <p className="text-sm text-[var(--text-dim)] mb-4">
                            Teachers need to register first at the homepage before you can assign them.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="btn btn-outline inline-flex"
                        >
                            Go to Homepage
                        </button>
                    </div>
                ) : unassignedSubjects.length === 0 ? (
                    <div className="card text-center py-8 border-green-500/30 bg-green-900/10">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                        <h3 className="font-semibold">All Subjects Assigned!</h3>
                        <p className="text-sm text-[var(--text-dim)]">
                            Every subject has a teacher assigned.
                        </p>
                    </div>
                ) : (
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-blue-400" />
                            Assign Teacher
                        </h2>

                        <form onSubmit={handleAssign} className="space-y-4">
                            {/* Subject Selection */}
                            <div>
                                <label className="block text-sm text-[var(--text-dim)] mb-2">
                                    Select Subject
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="input w-full"
                                    required
                                >
                                    <option value="">-- Choose a subject --</option>
                                    {unassignedSubjects.map(sub => (
                                        <option key={sub._id} value={sub._id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Teacher Selection (Dropdown) */}
                            <div>
                                <label className="block text-sm text-[var(--text-dim)] mb-2">
                                    Select Teacher
                                </label>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="input w-full"
                                    required
                                >
                                    <option value="">-- Choose a registered teacher --</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher._id} value={teacher._id}>
                                            {teacher.name} ({teacher.email})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-[var(--text-dim)] mt-1">
                                    Only registered teachers appear here
                                </p>
                            </div>

                            {/* Teacher PIN Verification */}
                            <div>
                                <label className="block text-sm text-[var(--text-dim)] mb-2 flex items-center gap-2">
                                    <Key className="w-4 h-4" />
                                    Teacher's Secret PIN
                                </label>
                                <input
                                    type="text"
                                    value={teacherPin}
                                    onChange={(e) => setTeacherPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="input w-full text-center text-2xl tracking-widest font-mono"
                                    placeholder="• • • •"
                                    maxLength={4}
                                    required
                                />
                                <p className="text-xs text-[var(--text-dim)] mt-2">
                                    Ask the teacher to enter their 4-digit PIN to confirm assignment
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={assigning}
                                className="btn btn-primary w-full"
                            >
                                {assigning ? "Verifying..." : "Verify & Assign Teacher"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <h3 className="font-medium text-blue-400 mb-2">How it works:</h3>
                    <ol className="text-sm text-[var(--text-dim)] space-y-1 list-decimal list-inside">
                        <li>Teacher registers at the homepage and gets a 4-digit PIN</li>
                        <li>You select the teacher from the dropdown above</li>
                        <li>Teacher enters their PIN to confirm the assignment</li>
                        <li>This prevents fake teacher registrations!</li>
                    </ol>
                </div>
            </div>
        </>
    );
}
