"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, Calendar as CalendarIcon, ChevronDown, ChevronUp, Key, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Calendar from '@/app/components/Calendar';
import api from '@/utils/api';
import { useNotification } from '@/app/components/Notification';
import CustomSelect from '@/app/components/CustomSelect';

const sanitizeRollNumber = (value) => {
    if (value === undefined || value === null) return null;
    const cleaned = String(value).trim();
    return cleaned || null;
};

const sortRollNumbers = (rolls) => {
    return [...rolls].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
    );
};

const normalizeClassRollNumbers = (classData) => {
    const rawRolls = Array.isArray(classData?.rollNumbers) ? classData.rollNumbers : [];
    const seen = new Set();
    const normalizedRolls = rawRolls
        .map((roll) => sanitizeRollNumber(roll))
        .filter((roll) => {
            if (!roll || seen.has(roll)) return false;
            seen.add(roll);
            return true;
        });

    if (normalizedRolls.length > 0) {
        return sortRollNumbers(normalizedRolls);
    }

    const totalStudents = Number(classData?.totalStudents);
    if (Number.isInteger(totalStudents) && totalStudents > 0) {
        return Array.from({ length: totalStudents }, (_, index) => String(index + 1));
    }

    return [];
};

const AUTO_RELOCK_MS = 2 * 60 * 1000;

export default function AdminDashboard() {
    const router = useRouter();
    const notify = useNotification();
    const [loading, setLoading] = useState(true);
    const [classId, setClassId] = useState(null);
    const [className, setClassName] = useState('');
    const [classStrength, setClassStrength] = useState(70);
    const [subjects, setSubjects] = useState([]); // Saved subjects with teacher info
    const [selectedDate, setSelectedDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [attendanceDates, setAttendanceDates] = useState([]);
    const [lastModified, setLastModified] = useState(null);

    // Periods for the selected date
    const [periods, setPeriods] = useState([]);
    const [expandedPeriod, setExpandedPeriod] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Teacher verification codes per period
    const [verificationCodes, setVerificationCodes] = useState({});

    // New period form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [isCustomSubject, setIsCustomSubject] = useState(false);

    // Ref to track if initial load is done
    const isInitialLoad = useRef(true);

    // Load class info on mount
    useEffect(() => {
        const storedClassId = localStorage.getItem('adminClassId');
        if (!storedClassId) {
            router.push('/admin/login');
            return;
        }
        setClassId(storedClassId);

        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);

        api.get(`/class/${storedClassId}`)
            .then(res => {
                setClassName(res.data.className);
                setClassStrength(res.data.totalStudents || 70);
                setSubjects(res.data.subjects || []);
                setLoading(false);

                // Load attendance for today (only on initial load)
                loadAttendanceForDate(today, storedClassId);

                api.get(`/attendance/dates/${storedClassId}`)
                    .then(datesRes => {
                        const formattedDates = (datesRes.data.dates || []).map(dateStr => {
                            return new Date(dateStr).toISOString().split('T')[0];
                        });
                        setAttendanceDates(formattedDates);
                    })
                    .catch(() => { });

                // Mark initial load as complete after a short delay
                setTimeout(() => {
                    isInitialLoad.current = false;
                }, 500);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    // Load attendance when date changes (skip initial load)
    useEffect(() => {
        if (classId && selectedDate && !isInitialLoad.current) {
            loadAttendanceForDate(selectedDate, classId);
            setShowCalendar(false);
        }
    }, [selectedDate]);

    const loadAttendanceForDate = async (date, classId) => {
        try {
            const res = await api.get(`/attendance/by-date/${classId}/${date}`);
            if (res.data && res.data.periods && res.data.periods.length > 0) {
                setPeriods(res.data.periods.map(p => ({
                    periodNum: p.periodNum,
                    subjectName: p.subjectName || '',
                    subjectId: p.subjectId || '',
                    absentRollNumbers: p.absentRollNumbers || [],
                    isVerified: p.isVerified || false
                })));

                // Pre-fill verification codes for verified periods (keyed by periodNum)
                const codes = {};
                res.data.periods.forEach((p) => {
                    codes[p.periodNum] = p.isVerified ? '****' : '';
                });
                setVerificationCodes(codes);

                setLastModified(res.data.updatedAt ? new Date(res.data.updatedAt) : null);
            } else {
                setPeriods([]);
                setVerificationCodes({});
                setLastModified(null);
            }
            setHasChanges(false);
            setExpandedPeriod(null);
        } catch (err) {
            setPeriods([]);
            setVerificationCodes({});
            setLastModified(null);
            setHasChanges(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminClassId');
        localStorage.removeItem('token');
        router.push('/');
    };

    // Get teacher info for a subject (show PIN for any assigned teacher)
    const getTeacherForSubject = (subjectId) => {
        if (!subjectId) return null;
        const subject = subjects.find(s => s._id === subjectId);
        // Show PIN entry for any teacher that's assigned (not just Verified)
        if (subject && subject.teacherId) {
            console.log('📚 Subject:', subject.name, 'Teacher:', subject.teacherName, 'Status:', subject.teacherStatus);
            return {
                name: subject.teacherName || 'Assigned Teacher',
                id: subject.teacherId
            };
        }
        return null;
    };

    // Add a new period
    const addPeriod = () => {
        const nextNum = periods.length > 0
            ? Math.max(...periods.map(p => p.periodNum)) + 1
            : 1;

        let periodSubjectId = '';
        let periodSubjectName = '';

        if (!isCustomSubject && selectedSubjectId) {
            const existingSubject = subjects.find(s => s._id === selectedSubjectId);
            if (existingSubject) {
                periodSubjectId = existingSubject._id;
                periodSubjectName = existingSubject.name;
                console.log('✅ Selected existing subject:', periodSubjectName);
            }
        }

        // Fallback or Custom
        if (!periodSubjectId) {
            // Try matching by name if custom or fallback
            const inputName = newSubjectName.trim();
            if (!inputName && !periodSubjectName) {
                notify({ message: 'Please enter a subject name', type: 'error' });
                return;
            }

            // Even if custom, check if it matches an existing subject by name
            const existingSubject = subjects.find(s =>
                s.name.toLowerCase() === inputName.toLowerCase()
            );

            if (existingSubject) {
                periodSubjectId = existingSubject._id;
                periodSubjectName = existingSubject.name;
                console.log('✅ Custom name matched existing subject:', periodSubjectName);
            } else {
                periodSubjectName = inputName;
                console.log('⚠️ Using custom subject name (no teacher verification):', periodSubjectName);
            }
        }

        console.log('🔍 Final Period Data -> Name:', periodSubjectName, 'ID:', periodSubjectId);

        const newPeriod = {
            periodNum: nextNum,
            subjectName: periodSubjectName,
            subjectId: periodSubjectId,
            absentRollNumbers: [],
            isVerified: false
        };

        const newPeriods = [...periods, newPeriod];
        setPeriods(newPeriods);
        setVerificationCodes(prev => ({ ...prev, [nextNum]: '' }));
        setNewSubjectName('');
        setSelectedSubjectId('');
        setIsCustomSubject(false);
        setShowAddForm(false);
        setExpandedPeriod(nextNum);
        setHasChanges(true);
    };

    // Delete a period
    const deletePeriod = (periodNum) => {
        setPeriods(periods.filter(p => p.periodNum !== periodNum));

        // Remove verification code for deleted period (keyed by periodNum)
        setVerificationCodes(prev => {
            const newCodes = { ...prev };
            delete newCodes[periodNum];
            return newCodes;
        });

        setHasChanges(true);
        if (expandedPeriod === periodNum) setExpandedPeriod(null);
    };

    // Toggle absent status
    const toggleAbsent = (periodNum, rollNo) => {
        setPeriods(periods.map(p => {
            if (p.periodNum !== periodNum) return p;
            const isAbsent = p.absentRollNumbers.includes(rollNo);
            return {
                ...p,
                absentRollNumbers: isAbsent
                    ? p.absentRollNumbers.filter(r => r !== rollNo)
                    : [...p.absentRollNumbers, rollNo].sort((a, b) => a - b)
            };
        }));
        setHasChanges(true);
    };

    // Handle verification code input (keyed by periodNum)
    const handleCodeInput = (periodNum, value) => {
        // Only allow 4 digits
        const cleanValue = value.replace(/\D/g, '').slice(0, 4);
        setVerificationCodes(prev => ({ ...prev, [periodNum]: cleanValue }));
        setHasChanges(true);
    };

    // Save attendance
    const saveAttendance = async () => {
        if (!classId) return;
        if (isDateLocked) return;
        if (classRollNumbers.length === 0) {
            notify({ message: "No students found in this class. Add students first.", type: 'error' });
            return;
        }

        const validPeriods = periods.filter(slot => slot.subjectId);
        if (validPeriods.length === 0) {
            notify({ message: "Please add at least one class with a subject selected", type: 'error' });
            return;
        }

        // Check if any periods with assigned teachers need verification
        const periodsNeedingVerification = periods.filter((p) => {
            const teacher = getTeacherForSubject(p.subjectId);
            // If already verified, we don't need a PIN (unless we want to re-verify, but usually we presume it persists)
            if (p.isVerified) return false;

            const code = verificationCodes[p.periodNum];  // Use periodNum as key
            return teacher && (!code || code.length !== 4);
        });

        if (periodsNeedingVerification.length > 0) {
            const subjectNames = periodsNeedingVerification.map(p => p.subjectName).join(', ');
            notify({
                message: `Please enter teacher PIN for: ${subjectNames}`,
                type: 'error'
            });
            return;
        }

        const formattedPeriods = periods.map((p) => ({
            periodNum: p.periodNum,
            subjectId: p.subjectId,
            subjectName: p.subjectName,
            absentRollNumbers: p.absentRollNumbers,
            verificationCode: verificationCodes[p.periodNum] !== '****' ? verificationCodes[p.periodNum] : ''  // Use periodNum
        }));

        try {
            const res = await api.post('/attendance/mark', {
                classId,
                date: selectedDate,
                periods: formattedPeriods
            });

            // Check if all periods with teachers were verified
            const savedPeriods = res.data.data.periods || [];
            const failedVerifications = savedPeriods.filter((p, idx) => {
                const teacher = getTeacherForSubject(p.subjectId);
                return teacher && !p.isVerified;
            });

            if (failedVerifications.length > 0) {
                const failedNames = failedVerifications.map(p => p.subjectName).join(', ');
                notify({
                    message: `Saved, but wrong PIN for: ${failedNames}`,
                    type: 'error'
                });
            } else {
                notify({ message: 'Attendance saved & verified!', type: 'success' });
            }

            setHasChanges(false);

            // Refresh
            api.get(`/attendance/dates/${classId}`)
                .then(datesRes => {
                    const formattedDates = (datesRes.data.dates || []).map(dateStr => {
                        return new Date(dateStr).toISOString().split('T')[0];
                    });
                    setAttendanceDates(formattedDates);
                })
                .catch(() => { });

            loadAttendanceForDate(selectedDate, classId);

        } catch (err) {
            notify({ message: 'Failed to save attendance', type: 'error' });
        }
    };

    // Format date for display
    const formatDateDisplay = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.getTime() === today.getTime()) return "Today";
        if (date.getTime() === yesterday.getTime()) return "Yesterday";

        return date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-white animate-pulse">Loading...</div>;
    }

    return (
        <>
            <Navbar isAdmin={true} onLogout={handleLogout} classId={classId} />
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
            />

            <div className="max-w-4xl mx-auto px-4 py-6 pb-28">

                {/* ─── Header with Quick Stats ─── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">Mark Attendance</h1>
                    <p className="text-[var(--text-dim)] text-sm">{className}</p>
                    {lastModified && (
                        <p className="text-xs text-[var(--text-dim)] mt-1">
                            Last saved: {lastModified.toLocaleString('en-US', {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </div>
                    )}
                </div>

                {/* Date Picker */}
                <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`w-full py-3 px-4 rounded-xl border transition text-sm font-medium flex items-center justify-between mb-4 ${showCalendar
                        ? 'bg-blue-900/20 border-blue-500/50 text-blue-400'
                        : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-white/50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDateDisplay(selectedDate)}</span>
                        {attendanceDates.includes(selectedDate) && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                </button>

                {showCalendar && (
                    <div className="mb-6 animate-fade-in">
                        <Calendar
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            attendanceDates={attendanceDates}
                        />
                    </div>
                )}

                {/* Periods List */}
                {periods.length === 0 && !showAddForm ? (
                    <div className="card text-center py-12">
                        <p className="text-[var(--text-dim)] mb-4">No periods recorded for this date</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Period
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {periods.map((period) => {
                            const teacher = getTeacherForSubject(period.subjectId);
                            const needsVerification = teacher && !period.isVerified;

                            return (
                                <div key={period.periodNum} className="card">
                                    {/* Period Header */}
                                    <div
                                        className="flex justify-between items-center cursor-pointer"
                                        onClick={() => setExpandedPeriod(
                                            expandedPeriod === period.periodNum ? null : period.periodNum
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-[var(--text-dim)]">
                                                P{period.periodNum}
                                            </span>
                                            <div>
                                                <h2 className="text-lg font-semibold">{period.subjectName}</h2>
                                                {teacher && (
                                                    <p className="text-xs text-[var(--text-dim)]">
                                                        Teacher: {teacher.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Verification Status */}
                                            {teacher && (
                                                period.isVerified ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-orange-400">
                                                        <Key className="w-3 h-3" />
                                                        Needs PIN
                                                    </span>
                                                )
                                            )}
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${period.absentRollNumbers.length > 0
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                {period.absentRollNumbers.length} absent
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deletePeriod(period.periodNum);
                                                }}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                            {expandedPeriod === period.periodNum
                                                ? <ChevronUp className="w-4 h-4" />
                                                : <ChevronDown className="w-4 h-4" />
                                            }
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedPeriod === period.periodNum && (
                                        <div className="mt-4 pt-4 border-t border-[var(--border)]">

                                            {/* Teacher PIN Input */}
                                            {teacher && !period.isVerified && (
                                                <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                                    <label className="text-xs text-orange-400 flex items-center gap-1 mb-2">
                                                        <Key className="w-3 h-3" />
                                                        Teacher Verification Required
                                                    </label>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            value={verificationCodes[period.periodNum] || ''}
                                                            onChange={(e) => handleCodeInput(period.periodNum, e.target.value)}
                                                            placeholder="Enter 4-digit PIN"
                                                            className="input flex-1 text-center text-xl tracking-widest font-mono"
                                                            maxLength={4}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className="text-xs text-[var(--text-dim)]">
                                                            Ask {teacher.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {teacher && period.isVerified && (
                                                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                                        <span className="text-sm text-green-400">
                                                            Verified by {teacher.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-green-400/60">
                                                        🔒 Locked
                                                    </span>
                                                </div>
                                            )}

                                            <p className="text-xs text-[var(--text-dim)] mb-3">
                                                {period.isVerified
                                                    ? 'This period is verified and locked. Changes not allowed.'
                                                    : 'Tap roll numbers to mark absent (red = absent)'
                                                }
                                            </p>
                                            <div className={`grid grid-cols-7 sm:grid-cols-10 gap-2 ${period.isVerified ? 'opacity-60' : ''}`}>
                                                {[...Array(classStrength)].map((_, i) => {
                                                    const roll = i + 1;
                                                    const isAbsent = period.absentRollNumbers.includes(roll);

                                                    return (
                                                        <button
                                                            key={roll}
                                                            onClick={() => !period.isVerified && toggleAbsent(period.periodNum, roll)}
                                                            disabled={period.isVerified}
                                                            className={`aspect-square rounded-lg text-sm font-medium transition-all ${period.isVerified
                                                                ? 'cursor-not-allowed'
                                                                : ''
                                                                } ${isAbsent
                                                                    ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                                                                    : 'bg-white/5 text-white/70 border border-white/10 hover:border-white/30'
                                                                }`}
                                                        >
                                                            {roll}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {period.absentRollNumbers.length > 0 && (
                                                <p className="text-sm text-[var(--text-dim)] mt-3">
                                                    Absent: {period.absentRollNumbers.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Period Form */}
                        {showAddForm ? (
                            <div className="card border-blue-500/30 bg-blue-900/10">
                                <h3 className="text-sm uppercase text-blue-400 mb-3">Add New Period</h3>
                                <div className="flex gap-2">
                                    {isCustomSubject ? (
                                        <input
                                            type="text"
                                            placeholder="Enter custom subject name..."
                                            value={newSubjectName}
                                            onChange={(e) => setNewSubjectName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addPeriod()}
                                            className="input flex-1"
                                            autoFocus
                                        />
                                    ) : (
                                        <CustomSelect
                                            options={subjects.map(s => ({
                                                value: s._id,
                                                label: s.name,
                                                subLabel: s.teacherName ? `Teacher: ${s.teacherName}` : 'No Teacher Assigned'
                                            }))}
                                            value={selectedSubjectId}
                                            onChange={(val) => {
                                                setSelectedSubjectId(val);
                                                const sub = subjects.find(s => s._id === val);
                                                setNewSubjectName(sub ? sub.name : '');
                                            }}
                                            placeholder="-- Select Subject --"
                                            className="flex-1 min-w-[200px]"
                                        />
                                    )}
                                    {isCustomSubject && (
                                        <button
                                            onClick={() => setIsCustomSubject(false)}
                                            className="btn btn-ghost px-3 text-xs"
                                            title="Back to list"
                                        >
                                            Use List
                                        </button>
                                    )}
                                    <button onClick={addPeriod} className="btn btn-primary px-4">
                                        Add
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setNewSubjectName('');
                                            setSelectedSubjectId('');
                                            setIsCustomSubject(false);
                                        }}
                                        className="btn btn-outline px-4"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-[var(--text-dim)] hover:border-white/40 hover:text-white transition flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Period
                            </button>
                        )}
                    </div>
                )}

                {/* Save Button */}
                {(periods.length > 0 || hasChanges) && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
                        <div className="max-w-4xl mx-auto">
                            <button
                                onClick={saveAttendance}
                                disabled={!hasChanges && periods.length === 0}
                                className={`btn w-full flex items-center justify-center gap-2 ${hasChanges
                                    ? 'btn-primary'
                                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                                    }`}
                            >
                                <Save className="w-4 h-4" />
                                {hasChanges ? 'Save & Verify' : 'No Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {showAddStudentModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="w-full max-w-sm glass-card !mb-0">
                            <h2 className="text-lg font-semibold mb-2">Add Student</h2>
                            <p className="text-sm text-[var(--text-dim)] mb-4">
                                Add one roll number to this class. Duplicate values are blocked.
                            </p>
                            <input
                                type="text"
                                className="input mb-4"
                                placeholder="Enter roll number"
                                value={newStudentRoll}
                                onChange={(e) => setNewStudentRoll(e.target.value)}
                                disabled={addingStudent}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddStudentModal(false);
                                        setNewStudentRoll('');
                                    }}
                                    className="px-4 py-2 rounded-lg border border-white/10 text-[var(--text-dim)] hover:text-white hover:border-white/20 transition"
                                    disabled={addingStudent}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={addStudentToClass}
                                    className="btn btn-primary !w-auto px-4 py-2"
                                    disabled={addingStudent}
                                >
                                    {addingStudent ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Adding...
                                        </span>
                                    ) : (
                                        'Add Student'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
