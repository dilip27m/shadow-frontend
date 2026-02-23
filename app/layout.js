import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import NotificationProvider from './components/Notification';
import { ConfirmProvider } from './components/ConfirmDialog';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Viewport config (Next.js 14+ best practice for PWA)
export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// SEO & PWA Metadata
export const metadata = {
  title: 'Shadow — Smart Attendance Tracker',
  description: 'Track attendance, plan leaves intelligently, and stay on top of academic requirements. Built for students, by students.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shadow',
  },
  icons: {
    icon: '/logo_92.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Shadow — Smart Attendance Tracker',
    description: 'Track attendance, plan leaves intelligently, and stay on top of academic requirements.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <NotificationProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </NotificationProvider>
        <Analytics />
        <Script id="register-sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(function(err) {
              console.log('SW registration failed:', err);
            });
          }
        `}</Script>
      </body>
    </html>
  );
}