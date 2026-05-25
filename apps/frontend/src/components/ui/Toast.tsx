'use client';
import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(13, 13, 20, 0.95)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          color: '#F1F0FF',
          backdropFilter: 'blur(20px)',
          fontFamily: 'var(--font-geist), sans-serif',
          fontSize: '14px',
        },
      }}
      theme="dark"
    />
  );
}