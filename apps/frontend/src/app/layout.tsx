import '../styles/tailwind.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { SessionProvider } from 'next-auth/react';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import { Geist } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';


const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-geist',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ByteArena — Compete. Code. Conquer.',
  description:
    'ByteArena is a premium competitive coding platform for students and institutions — real-time contests, deep analytics, and intelligent proctoring in one place.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className={`${geist.className} bg-background text-foreground antialiased min-h-screen`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SessionProvider>
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}