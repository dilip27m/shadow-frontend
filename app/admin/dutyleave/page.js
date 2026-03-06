'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useNotification } from '@/app/components/Notification';
import api from '@/utils/api';

export default function DutyLeavePage() {
    const router = useRouter();
    const notify = useNotification();

    const [classId, setClassId] = useState(null);
    const [className, setClassName] = useState('');
    const [allRollNumbers, setAllRollNumbers] = useState([]);

    // All dates that have attendance marked (for the dropdown)
    const [attendanceDates, setAttendanceDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    // Attendance for the selected date
    const [periodsOnDate, setPeriodsOnDate] = useState([]);
    const [loadingDate, setLoadingDate] = useState(false);
    const [noAttendance, setNoAttendance] = useState(false);

    // Period selection
    const [wholeDay, setWholeDay] = useState(true);
    const [selectedPeriodNums, setSelectedPeriodNums] = useState([]);

    // Roll selection
    const [selectedRolls, setSelectedRolls] = useState([]);

    // Existing DL data { periodNum: Set<roll> }
    const [existingDLMap, setExistingDLMap] = useState({});

    const [saving, setSaving] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // ── Auth + class data ──────────────────────────────────────────────────
    useEffect(() => {
        const storedClassId = localStorage.getItem('adminClassId');
        if (!storedClassId) { router.push('/admin/login'); return; }
        setClassId(storedClassId);

        Promise.all([
            api.get(`/class/${storedClassId}`),
            api.get(`/attendance/dates/${storedClassId}`)
        ]).then(([classRes, datesRes]) => {
            setClassName(classRes.data.className || '');

            if (Array.isArray(classRes.data.rollNumbers) && classRes.data.rollNumbers.length > 0) {
                setAllRollNumbers(classRes.data.rollNumbers.map(String));
            } else if (classRes.data.totalStudents) {
                const count = Number(classRes.data.totalStudents);
                setAllRollNumbers(Array.from({ length: count }, (_, i) => String(i + 1)));
            }

            const dates = (datesRes.data.dates || [])
                .map(d => new Date(d).toISOString().split('T')[0])
                .sort((a, b) => b.localeCompare(a)); // newest first
            setAttendanceDates(dates);

            // Default to today if it has attendance, else the most recent date
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(dates.includes(today) ? today : (dates[0] || today));

            setPageLoading(false);
        }).catch(() => {
            notify({ message: 'Failed to load class data', type: 'error' });
            setPageLoading(false);
        });
    }, [router]);

    // ── Fetch attendance for selected date ─────────────────────────────────
    const fetchDateAttendance = useCallback(async (cId, date) => {
        if (!cId || !date) return;
        setLoadingDate(true);
        setPeriodsOnDate([]);
        setSelectedPeriodNums([]);
        setSelectedRolls([]);
        setExistingDLMap({});
        setNoAttendance(false);
        setWholeDay(true);

        try {
            const res = await api.get(`/attendance/by-date/${cId}/${date}`);
            const periods = res.data?.periods || [];
            if (periods.length === 0) {
                setNoAttendance(true);
            } else {
                setPeriodsOnDate(periods);
                const dlMap = {};
                periods.forEach(p => {
                    dlMap[p.periodNum] = new Set((p.dutyLeaveRollNumbers || []).map(String));
                });
                setExistingDLMap(dlMap);
            }
        } catch {
            setNoAttendance(true);
        } finally {
            setLoadingDate(false);
        }
    }, []);

    useEffect(() => {
        if (classId && selectedDate) fetchDateAttendance(classId, selectedDate);
    }, [classId, selectedDate, fetchDateAttendance]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const activePeriodNums = wholeDay ? periodsOnDate.map(p => p.periodNum) : selectedPeriodNums;

    const rollHasDLOnAll = (roll) =>
        activePeriodNums.length > 0 &&
        activePeriodNums.every(pNum => existingDLMap[pNum]?.has(String(roll)));

    const rollHasDLOnSome = (roll) =>
        !rollHasDLOnAll(roll) &&
        activePeriodNums.some(pNum => existingDLMap[pNum]?.has(String(roll)));

    const toggleRoll = (roll) =>
        setSelectedRolls(prev => prev.includes(roll) ? prev.filter(r => r !== roll) : [...prev, roll]);

    const togglePeriod = (pNum) =>
        setSelectedPeriodNums(prev => prev.includes(pNum) ? prev.filter(n => n !== pNum) : [...prev, pNum]);

    const formatDateLabel = (dateStr) => {
        if (!dateStr) return 'Select date';
        const d = new Date(dateStr + 'T00:00:00');
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (dateStr === today) return `Today · ${label}`;
        if (dateStr === yesterday) return `Yesterday · ${label}`;
        return label;
    };

    const handleLogout = () => {
        localStorage.removeItem('adminClassId');
        localStorage.removeItem('token');
        router.push('/');
    };

    // ── Save ───────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!classId) return;
        if (activePeriodNums.length === 0) { notify({ message: 'Select at least one period', type: 'error' }); return; }
        if (selectedRolls.length === 0) { notify({ message: 'Select at least one roll number', type: 'error' }); return; }

        setSaving(true);
        try {
            const res = await api.post('/attendance/duty-leave', {
                classId, date: selectedDate,
                periodNums: activePeriodNums,
                rollNumbers: selectedRolls
            });

            const action = res.data.action;
            const updatedPeriods = res.data.data?.periods || [];
            const dlMap = {};
            updatedPeriods.forEach(p => {
                dlMap[p.periodNum] = new Set((p.dutyLeaveRollNumbers || []).map(String));
            });
            setExistingDLMap(dlMap);
            setSelectedRolls([]);

            notify({
                message: action === 'removed'
                    ? `Duty Leave removed for ${selectedRolls.length} roll(s)`
                    : `Duty Leave applied for ${selectedRolls.length} roll(s)`,
                type: 'success'
            });
        } catch (err) {
            notify({ message: err.response?.data?.error || 'Failed to save Duty Leave', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────
    if (pageLoading) {
        return (
            <>
                <Navbar isAdmin={true} onLogout={handleLogout} />
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="skeleton h-8 w-40 mb-2 rounded-lg"></div>
                    <div className="skeleton h-4 w-24 mb-8 rounded-lg"></div>
                    <div className="skeleton h-14 w-full rounded-2xl mb-4"></div>
                    <div className="skeleton h-36 w-full rounded-2xl mb-4"></div>
                    <div className="skeleton h-64 w-full rounded-2xl"></div>
                </div>
            </>
        );
    }

    const allSelectedAlreadyDL = selectedRolls.length > 0 && selectedRolls.every(r => rollHasDLOnAll(r));
    const hasDLOnDate = Object.values(existingDLMap).some(s => s.size > 0);

    return (
        <>
            <Navbar isAdmin={true} onLogout={handleLogout} />

            <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">

                {/* Header */}
                <div className="mb-6">
                    <h1>Duty Leave</h1>
                    <p>{className} — Mark students present despite absence</p>
                </div>

                {/* ── Date Selector (dropdown style like attendance page) ── */}
                <div className="relative mb-4">
                    <button
                        onClick={() => setShowDateDropdown(prev => !prev)}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] hover:border-[#333] transition text-left"
                    >
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-[var(--text-dim)]" />
                            <span className="text-sm font-medium text-white">
                                {formatDateLabel(selectedDate)}
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-[var(--text-dim)] transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDateDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                            <div className="max-h-64 overflow-y-auto">
                                {attendanceDates.length === 0 ? (
                                    <p className="text-center text-[var(--text-dim)] text-sm py-6">No attendance records found</p>
                                ) : (
                                    attendanceDates.map(date => {
                                        const isSelected = date === selectedDate;
                                        return (
                                            <button
                                                key={date}
                                                onClick={() => { setSelectedDate(date); setShowDateDropdown(false); }}
                                                className={`w-full text-left px-5 py-3 text-sm transition border-b border-[var(--border)] last:border-0 ${isSelected
                                                    ? 'bg-white/8 text-white font-medium'
                                                    : 'text-[var(--text-dim)] hover:bg-white/4 hover:text-white'
                                                    }`}
                                            >
                                                {formatDateLabel(date)}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Loading state ── */}
                {loadingDate && (
                    <div className="space-y-3 mb-4">
                        <div className="skeleton h-32 w-full rounded-2xl"></div>
                        <div className="skeleton h-64 w-full rounded-2xl"></div>
                    </div>
                )}

                {/* ── No attendance ── */}
                {!loadingDate && noAttendance && (
                    <div className="card text-center py-12 mb-4">
                        <p className="text-3xl mb-3">📭</p>
                        <p className="text-[var(--text-dim)] text-sm">No attendance marked for this date.</p>
                        <p className="text-xs text-[var(--text-dim)] mt-1 opacity-60">Mark attendance first, then apply Duty Leave.</p>
                    </div>
                )}

                {/* ── Periods ── */}
                {!loadingDate && !noAttendance && periodsOnDate.length > 0 && (
                    <>
                        {/* Period card */}
                        <div className="card mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 style={{ marginBottom: 0 }}>Periods</h2>
                                <button
                                    onClick={() => { setWholeDay(p => !p); setSelectedPeriodNums([]); }}
                                    className={`text-xs px-4 py-2 rounded-full font-semibold border transition ${wholeDay
                                        ? 'bg-amber-900/30 text-amber-300 border-amber-500/40'
                                        : 'bg-[var(--bg)] text-[var(--text-dim)] border-[var(--border)] hover:border-[#444]'
                                        }`}
                                >
                                    {wholeDay ? '✓ Whole Day' : 'Whole Day'}
                                </button>
                            </div>

                            {wholeDay ? (
                                <div className="flex flex-wrap gap-2">
                                    {periodsOnDate.map(p => (
                                        <span key={p.periodNum}
                                            className="text-xs px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-500/20 text-amber-400">
                                            P{p.periodNum} · {p.subjectName}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {periodsOnDate.map(p => {
                                        const isSel = selectedPeriodNums.includes(p.periodNum);
                                        return (
                                            <button key={p.periodNum} onClick={() => togglePeriod(p.periodNum)}
                                                className={`p-3 rounded-xl border text-left transition ${isSel
                                                    ? 'bg-amber-900/25 border-amber-500/40 text-amber-300'
                                                    : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-dim)] hover:border-[#444]'
                                                    }`}>
                                                <div className="text-xs font-bold mb-0.5">P{p.periodNum}</div>
                                                <div className="text-xs truncate opacity-70">{p.subjectName}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Roll number grid */}
                        <div className="card mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 style={{ marginBottom: 0 }}>
                                    Roll Numbers
                                    {selectedRolls.length > 0 && (
                                        <span className="ml-2 text-sm text-amber-400 font-normal">
                                            {selectedRolls.length} selected
                                        </span>
                                    )}
                                </h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedRolls([...allRollNumbers])}
                                        className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-dim)] hover:border-[#444] transition">
                                        All
                                    </button>
                                    <button onClick={() => setSelectedRolls([])}
                                        className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-dim)] hover:border-[#444] transition">
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 mb-4 text-xs text-[var(--text-dim)]">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-amber-900/40 border border-amber-500/50 inline-block"></span>
                                    Selected
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-amber-900/20 border border-amber-500/25 inline-block"></span>
                                    Already DL
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-[var(--card-bg)] border border-[var(--border)] inline-block"></span>
                                    Normal
                                </span>
                            </div>

                            <div className="grid grid-cols-7 gap-1.5">
                                {allRollNumbers.map(roll => {
                                    const isSelected = selectedRolls.includes(roll);
                                    const hasDLAll = rollHasDLOnAll(roll);
                                    const hasDLSome = rollHasDLOnSome(roll);

                                    let cls = 'grid-box relative ';
                                    if (isSelected) {
                                        cls += 'bg-amber-900/40 border-amber-500/60 !text-amber-200';
                                    } else if (hasDLAll) {
                                        cls += 'bg-amber-900/20 border-amber-500/30 !text-amber-400';
                                    } else if (hasDLSome) {
                                        cls += 'bg-[var(--card-bg)] border-amber-500/20 !text-[var(--text-dim)]';
                                    } else {
                                        cls += 'present';
                                    }

                                    return (
                                        <button key={roll} onClick={() => toggleRoll(roll)} className={cls}>
                                            {roll}
                                            {hasDLAll && !isSelected && (
                                                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 pointer-events-none"></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            disabled={saving || selectedRolls.length === 0 || activePeriodNums.length === 0}
                            className={`btn ${allSelectedAlreadyDL ? 'btn-danger' : 'btn-primary'} mb-4`}
                            style={{ opacity: (saving || selectedRolls.length === 0 || activePeriodNums.length === 0) ? 0.4 : 1 }}
                        >
                            {saving ? 'Saving...' : allSelectedAlreadyDL ? 'Remove Duty Leave' : 'Apply Duty Leave'}
                        </button>

                        {/* Current DL summary */}
                        {hasDLOnDate && (
                            <div className="card">
                                <h2 style={{ marginBottom: '0.75rem' }}>Active DL on this date</h2>
                                <div className="space-y-2">
                                    {periodsOnDate.map(p => {
                                        const dlRolls = [...(existingDLMap[p.periodNum] || [])].sort((a, b) => Number(a) - Number(b));
                                        if (dlRolls.length === 0) return null;
                                        return (
                                            <div key={p.periodNum}
                                                className="flex items-start gap-3 p-3 rounded-xl bg-amber-900/10 border border-amber-500/15">
                                                <span className="text-xs font-bold text-amber-400 mt-0.5 shrink-0 w-6">P{p.periodNum}</span>
                                                <div>
                                                    <p className="text-xs text-[var(--text-dim)] mb-1.5">{p.subjectName}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {dlRolls.map(roll => (
                                                            <span key={roll}
                                                                className="text-xs px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-500/25 text-amber-300">
                                                                {roll}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}