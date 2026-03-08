import type { Metadata } from 'next';
import './globals.css';
import SystemStatus from '@/components/SystemStatus';

export const metadata: Metadata = {
  title: 'DocSign — Digital Document Signing',
  description: 'Sign documents securely online',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <SystemStatus />
        {children}
      </body>
    </html>
  );
}
