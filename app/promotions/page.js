"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Megaphone, PlusCircle, ArrowLeft,
    ExternalLink, CheckCircle, AlertTriangle, Loader2, User, ArrowUp
} from 'lucide-react';
import BubbleButton from '../components/BubbleButton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function PromotionsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'submit'
    const [userId, setUserId] = useState('');

    useEffect(() => {
        let uid = localStorage.getItem('studentRoll');
        if (!uid) {
            uid = localStorage.getItem('shadow_device_id');
            if (!uid) {
                uid = 'anon_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
                localStorage.setItem('shadow_device_id', uid);
            }
        }
        setUserId(uid);
    }, []);

    // Discover State
    const [promotions, setPromotions] = useState([]);
    const [loadingPromotions, setLoadingPromotions] = useState(true);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        linkUrl: '',
        imageUrl: '',
        contactDetails: '',
        submittedBy: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // My Pitches State
    const [myPitches, setMyPitches] = useState([]);
    const [loadingMyPitches, setLoadingMyPitches] = useState(false);
    const [myPitchesError, setMyPitchesError] = useState('');

    useEffect(() => {
        if (activeTab === 'discover') {
            fetchPromotions();
        } else if (activeTab === 'mypitches') {
            fetchMyPitches();
        }
    }, [activeTab]);

    const fetchPromotions = async () => {
        setLoadingPromotions(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/promotions/active`);
            if (!res.ok) throw new Error('Failed to load promotions');
            const data = await res.json();
            setPromotions(data.data || []);
        } catch (err) {
            setError(err.message || 'Error loading data');
        } finally {
            setLoadingPromotions(false);
        }
    };

    const fetchMyPitches = async () => {
        setLoadingMyPitches(true);
        setMyPitchesError('');
        try {
            const savedIds = JSON.parse(localStorage.getItem('shadow_my_promotions') || '[]');
            if (savedIds.length === 0) {
                setMyPitches([]);
                setLoadingMyPitches(false);
                return;
            }

            const res = await fetch(`${API_BASE}/promotions/my-pitches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: savedIds })
            });
            if (!res.ok) throw new Error('Failed to load your pitches');
            const data = await res.json();
            setMyPitches(data.data || []);
        } catch (err) {
            setMyPitchesError(err.message || 'Error loading data');
        } finally {
            setLoadingMyPitches(false);
        }
    };

    const handleUpvote = async (promoId) => {
        if (!userId) return;

        const updateArray = (prev) => prev.map(p => {
            if (p._id === promoId) {
                const hasUpvoted = p.upvotes?.includes(userId);
                let newUpvotes = [...(p.upvotes || [])];
                if (hasUpvoted) {
                    newUpvotes = newUpvotes.filter(id => id !== userId);
                } else {
                    newUpvotes.push(userId);
                }
                return { ...p, upvotes: newUpvotes };
            }
            return p;
        });

        // Optimistic UI update across both tabs
        setPromotions(updateArray);
        setMyPitches(updateArray);

        try {
            await fetch(`${API_BASE}/promotions/${promoId}/upvote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
        } catch (err) {
            console.error('Failed to toggle upvote', err);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingImage(true);
        setSubmitError('');

        const data = new FormData();
        data.append('image', file);

        try {
            const res = await fetch(`${API_BASE}/upload/image`, {
                method: 'POST',
                body: data
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.message || 'Failed to upload image');

            setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
        } catch (err) {
            setSubmitError(err.message || 'Error uploading image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError('');

        try {
            const res = await fetch(`${API_BASE}/promotions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to submit request');

            setSubmitSuccess(true);

            // Save ID to localStorage
            if (data.data && data.data._id) {
                const savedIds = JSON.parse(localStorage.getItem('shadow_my_promotions') || '[]');
                if (!savedIds.includes(data.data._id)) {
                    savedIds.push(data.data._id);
                    localStorage.setItem('shadow_my_promotions', JSON.stringify(savedIds));
                }
            }

            setFormData({ title: '', description: '', linkUrl: '', imageUrl: '', contactDetails: '', submittedBy: '' });
            setTimeout(() => {
                setSubmitSuccess(false);
                setActiveTab('mypitches');
            }, 3000);
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] text-white overflow-y-auto pb-20">
            {/* ── Header ── */}
            <div className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-md border-b border-white/8">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"
                        >
                            <ArrowLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-violet-400" /> Campus Discover
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-6">

                <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10 overflow-x-auto hide-scrollbar">
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`flex-1 py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-xl transition-all ${activeTab === 'discover'
                            ? 'bg-white/10 shadow-lg text-white font-bold'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Explore Apps
                    </button>
                    <button
                        onClick={() => setActiveTab('mypitches')}
                        className={`flex-1 py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'mypitches'
                            ? 'bg-white/10 shadow-lg text-white font-bold'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <User className="w-4 h-4" /> My Pitches
                    </button>
                    <button
                        onClick={() => setActiveTab('submit')}
                        className={`flex-1 py-2.5 px-4 whitespace-nowrap text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'submit'
                            ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 text-fuchsia-100 shadow-lg shadow-violet-900/10'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <PlusCircle className="w-4 h-4" /> Pitch App
                    </button>
                </div>

                {/* ── Discover Tab ── */}
                {activeTab === 'discover' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {loadingPromotions && (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500/50" />
                                <p className="text-sm">Finding new things...</p>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex items-center gap-3 text-red-400">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">Failed to load</p>
                                    <p className="text-xs opacity-80 mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        {!loadingPromotions && !error && promotions.length === 0 && (
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
                                <Megaphone className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-300">It's quiet here</h3>
                                <p className="text-sm text-gray-500 mt-1">Be the first to promote something to the campus!</p>
                            </div>
                        )}

                        {!loadingPromotions && promotions.map(promo => (
                            <div key={promo._id} className="group flex flex-col relative rounded-2xl border border-white/10 bg-[#0f0f13] overflow-hidden hover:border-white/20 transition-all duration-500 shadow-2xl shadow-black/80">
                                {promo.imageUrl && (
                                    <div className="w-full h-56 bg-zinc-900 overflow-hidden shrink-0">
                                        <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    </div>
                                )}
                                <div className="p-6 relative z-20 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-3 gap-4">
                                        <h2 className="font-bold text-xl text-white tracking-wide">
                                            {promo.title}
                                        </h2>
                                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/5 px-2.5 py-1 rounded-md text-gray-400 border border-white/10 shrink-0">By {promo.submittedBy}</span>
                                    </div>
                                    <p className={`text-sm leading-relaxed mb-6 ${promo.imageUrl ? 'text-gray-300' : 'text-gray-400'}`}>
                                        {promo.description}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 block">
                                            <BubbleButton
                                                onClick={() => handleUpvote(promo._id)}
                                                active={promo.upvotes?.includes(userId)}
                                                baseColor="bg-white/5"
                                                activeColor="bg-emerald-500/20"
                                                className={`rounded-xl border shadow-md w-full ${promo.upvotes?.includes(userId)
                                                    ? 'border-emerald-500/40 text-emerald-400 shadow-emerald-900/20'
                                                    : 'border-white/10 text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                <ArrowUp className={`w-4 h-4 ${promo.upvotes?.includes(userId) ? 'stroke-[3px]' : ''}`} />
                                                <span className="ml-1">{promo.upvotes?.length || 0} Upvotes</span>
                                            </BubbleButton>
                                        </div>
                                        {promo.linkUrl && (
                                            <a
                                                href={promo.linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block shrink-0"
                                            >
                                                <BubbleButton
                                                    baseColor="bg-white/10"
                                                    activeColor="bg-white/20"
                                                    className="border border-white/10 px-6"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </BubbleButton>
                                            </a>
                                        )}
                                    </div>
                                    {promo.contactDetails && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-xs text-gray-500 font-medium mb-1">Contact:</p>
                                            <p className="text-sm text-fuchsia-300 font-mono">{promo.contactDetails}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── My Pitches Tab ── */}
                {activeTab === 'mypitches' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {loadingMyPitches && (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500/50" />
                                <p className="text-sm">Fetching your pitches...</p>
                            </div>
                        )}

                        {myPitchesError && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex items-center gap-3 text-red-400">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">Failed to load</p>
                                    <p className="text-xs opacity-80 mt-1">{myPitchesError}</p>
                                </div>
                            </div>
                        )}

                        {!loadingMyPitches && !myPitchesError && myPitches.length === 0 && (
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
                                <User className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-300">No pitches yet</h3>
                                <p className="text-sm text-gray-500 mt-1">Submit a pitch to see it tracked here.</p>
                                <BubbleButton
                                    onClick={() => setActiveTab('submit')}
                                    baseColor="bg-white/10"
                                    activeColor="bg-white/20"
                                    className="mt-4 mx-auto w-fit text-sm"
                                >
                                    Pitch an App
                                </BubbleButton>
                            </div>
                        )}

                        {!loadingMyPitches && myPitches.map(promo => (
                            <div key={promo._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="font-bold text-lg text-white">{promo.title}</h2>
                                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${promo.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        promo.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            promo.status === 'Inactive' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                        {promo.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">{promo.description}</p>
                                <div className="mt-auto flex justify-between items-center text-xs text-gray-500 border-t border-white/5 pt-3">
                                    <div className="flex items-center gap-3">
                                        <span>Submitted: {new Date(promo.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1 font-semibold text-emerald-400"><ArrowUp className="w-3 h-3 stroke-[3px]" /> {promo.upvotes?.length || 0}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="truncate max-w-[150px] text-fuchsia-300/70">{promo.contactDetails}</span>
                                        <span className="truncate max-w-[150px]">{promo.linkUrl}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Submit Tab ── */}
                {activeTab === 'submit' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {submitSuccess ? (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-100">Request Submitted!</h3>
                                <p className="text-sm text-emerald-400/80 mt-2 max-w-sm">
                                    Your promotion request has been sent to the Admin for review. It will appear in Discover once approved.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/8 bg-[#0f0f13] p-6 shadow-2xl">
                                <div>
                                    <h2 className="text-base font-bold text-white">Create Promotion Request</h2>
                                    <p className="text-xs text-gray-500 mt-1">Share your project, app, or event with the campus.</p>
                                </div>

                                {submitError && (
                                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {submitError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">App/Event Name *</label>
                                        <input
                                            required
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleFormChange}
                                            placeholder="e.g. My Cool Campus App"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Short Pitch (Max 200 chars) *</label>
                                        <textarea
                                            required
                                            maxLength={200}
                                            name="description"
                                            value={formData.description}
                                            onChange={handleFormChange}
                                            placeholder="Why should students check this out?"
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition resize-none"
                                        />
                                        <div className="text-right mt-1.5 mr-1 text-[10px] text-gray-600 font-mono">
                                            {formData.description.length}/200
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Destination URL/Link (Optional)</label>
                                        <input
                                            type="url"
                                            name="linkUrl"
                                            value={formData.linkUrl}
                                            onChange={handleFormChange}
                                            placeholder="https://yourapp.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Banner Image (Optional)</label>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="flex-1 w-full">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={isUploadingImage}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20 disabled:opacity-50 transition"
                                                />
                                                {isUploadingImage && <p className="text-xs text-violet-400 mt-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading image...</p>}
                                                {formData.imageUrl && !isUploadingImage && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Image uploaded successfully</p>}
                                            </div>
                                            {formData.imageUrl && !isUploadingImage && (
                                                <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/40 shadow-inner group flex items-center justify-center">
                                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                await fetch(`${API_BASE}/upload/image`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ imageUrl: formData.imageUrl })
                                                                });
                                                            } catch (err) {
                                                                console.error("Failed to delete image:", err);
                                                            } finally {
                                                                setFormData(prev => ({ ...prev, imageUrl: '' }));
                                                            }
                                                        }}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                                        title="Remove Image"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Submitted By (Name & ID) *</label>
                                        <input
                                            required
                                            type="text"
                                            name="submittedBy"
                                            value={formData.submittedBy}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Dilip (1234567)"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition"
                                        />
                                        <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Your identity will be visible to the Admin.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Contact Details (Optional)</label>
                                        <input
                                            type="text"
                                            name="contactDetails"
                                            value={formData.contactDetails}
                                            onChange={handleFormChange}
                                            placeholder="Email, WhatsApp, or Twitter..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition"
                                        />
                                        <p className="text-[10px] text-gray-600 mt-1.5 ml-1">How can people reach out to you about this pitch?</p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                                    {submitting ? 'Submitting Request...' : 'Submit Request for Review'}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
