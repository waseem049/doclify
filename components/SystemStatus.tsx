'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';

export default function SystemStatus() {
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [dbState, setDbState] = useState<string>('unknown');

    const checkHealth = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const { data } = await axios.get(`${apiUrl}/health`);
            setStatus(data.status);
            setDbState(data.database);
        } catch (err) {
            setStatus('error');
            setDbState('disconnected');
        }
    };

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (status === 'ok') return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top duration-500">
            <div className="bg-[#e5322d] text-white px-4 py-3 shadow-2xl flex items-center justify-center gap-3">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
                    <span className="font-bold text-sm sm:text-base">System Alert: Database Disconnected</span>
                    <span className="text-xs sm:text-sm font-medium opacity-90 hidden sm:inline">Registration and login are unavailable until resolved.</span>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="ml-4 bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
                    title="Retry Connection"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
            <div className="bg-white/95 backdrop-blur-sm border-b border-teal-100 p-4 text-center">
                <p className="text-slate-600 text-sm font-bold flex items-center justify-center gap-2">
                    <Database className="w-4 h-4 text-[#0f766e]" />
                    Action Required: Please check your <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0f766e]">server/.env</code> file for a valid MONGODB_URI.
                </p>
            </div>
        </div>
    );
}
