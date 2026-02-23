// Shadow Push Notification Service Worker

// Install immediately — don't wait for old SW to retire
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'You have a new update.',
            icon: data.icon || '/icon-192.png',
            badge: data.badge || '/icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            },
            actions: [
                { action: 'open', title: 'View' }
            ],
            tag: data.title || 'shadow-notification',
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Shadow', options)
        );
    } catch (err) {
        console.error('Push event error:', err);
    }
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If the app is already open, focus it
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return clients.openWindow(url);
        })
    );
});

// Activate immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
