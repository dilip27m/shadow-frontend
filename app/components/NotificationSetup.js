"use client";
import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import api from '@/utils/api';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationSetup({ classId, rollNumber }) {
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [supported, setSupported] = useState(false);
    const [vapidKey, setVapidKey] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if push notifications are supported
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setSupported(isSupported);

        if (isSupported) {
            setPermission(Notification.permission);

            // Pre-fetch VAPID key so subscribe() doesn't need a network call mid-gesture
            api.get('/push/vapid-key')
                .then(res => {
                    if (res.data.publicKey) {
                        setVapidKey(res.data.publicKey);
                    } else {
                        console.error("VAPID key missing from response:", res.data);
                        setError("Push not configured on server.");
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch VAPID key:", err);
                    const msg = err.response?.data?.error || "Could not connect to push service.";
                    setError(msg);
                });

            // Register SW eagerly so it's active when user clicks Enable
            navigator.serviceWorker.register('/sw.js')
                .then(() => navigator.serviceWorker.ready)
                .then(registration => {
                    return registration.pushManager.getSubscription();
                })
                .then(sub => {
                    setIsSubscribed(!!sub);
                })
                .catch(err => console.error("SW init error:", err));
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!supported || loading) return;
        setError(null);

        if (!vapidKey) {
            setError("Push service still loading. Please wait a moment and try again.");
            return;
        }

        setLoading(true);

        try {
            // 1. Request permission first (must be in direct user-gesture context)
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                setLoading(false);
                return;
            }

            // 2. Ensure the SW is fully active — .ready guarantees an active worker
            const registration = await navigator.serviceWorker.ready;

            // 3. Subscribe via Push API (VAPID key was pre-fetched, no network delay here)
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            // 4. Send subscription to backend
            await api.post('/push/subscribe', {
                classId,
                rollNumber,
                subscription: subscription.toJSON()
            });

            setIsSubscribed(true);
        } catch (err) {
            console.error('Push subscription error:', err);
            setError("Failed to enable notifications. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [classId, rollNumber, supported, loading, vapidKey]);

    const unsubscribe = useCallback(async () => {
        if (!supported || loading) return;
        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                await api.post('/push/unsubscribe', {
                    classId,
                    endpoint: subscription.endpoint
                });
            }

            setIsSubscribed(false);
        } catch (err) {
            console.error('Push unsubscribe error:', err);
        } finally {
            setLoading(false);
        }
    }, [classId, supported, loading]);

    // Don't render if not supported
    if (!supported) return null;

    // Permission denied — can't do anything
    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <BellOff className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Notifications blocked. Enable in browser settings.</span>
            </div>
        );
    }

    if (isSubscribed) {
        return (
            <button
                onClick={unsubscribe}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:bg-emerald-500/15 transition"
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Bell className="w-3.5 h-3.5" />
                )}
                <span>Notifications On</span>
            </button>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={subscribe}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/15 transition animate-fade-in"
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Bell className="w-3.5 h-3.5" />
                )}
                <span>Enable Notifications</span>
            </button>
            {error && (
                <span className="text-[10px] text-red-400 max-w-[200px] text-right">{error}</span>
            )}
        </div>
    );
}
