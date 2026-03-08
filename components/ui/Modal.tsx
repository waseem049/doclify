'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-xl font-bold text-slate-800">{title}</div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
