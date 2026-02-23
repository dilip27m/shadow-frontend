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

    useEffect(() => {
        // Check if push notifications are supported
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setSupported(isSupported);

        if (isSupported) {
            setPermission(Notification.permission);

            // Check if already subscribed
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub);
                });
            });
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!supported || loading) return;
        setLoading(true);

        try {
            // Request permission
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                setLoading(false);
                return;
            }

            // Get VAPID public key from backend
            const keyRes = await api.get('/push/vapid-key');
            const vapidPublicKey = keyRes.data.publicKey;

            // Subscribe via Push API
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Send subscription to backend
            await api.post('/push/subscribe', {
                classId,
                rollNumber,
                subscription: subscription.toJSON()
            });

            setIsSubscribed(true);
        } catch (err) {
            console.error('Push subscription error:', err);
        } finally {
            setLoading(false);
        }
    }, [classId, rollNumber, supported, loading]);

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
    );
}
