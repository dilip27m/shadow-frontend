import './globals.css';
import NotificationProvider from './components/Notification';

// 1. Separate Viewport export (Next.js 14+ best practice for PWA)
export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on inputs like a native app
};

// 2. Metadata with Manifest link
export const metadata = {
  title: 'Shadow',
  description: 'Minimal attendance tracker',
  manifest: '/manifest.json', // Links to the file in /public
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shadow',
  },
  icons: {
    icon: '/logo.png',
    apple: '/icon-192.png', // Icon for iPhone home screen
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}