import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Live Hardware Price List',
  description: 'Instant live hardware shop price list with real-time stock and prices in Nepali Rupees (NPR).',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#D32F2F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#F4F5F7] text-[#1A1A1A] antialiased flex flex-col items-center">
        <div className="w-full max-w-xl min-h-screen bg-white flex flex-col shadow-lg relative">
          {children}
        </div>
      </body>
    </html>
  );
}
