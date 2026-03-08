'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import AuditIntegrity from '@/components/AuditIntegrity';
import api from '@/lib/api';
import type { AuditLog } from '@/types';

const actionLabels: Record<string, { label: string; color: string }> = {
    'doc:uploaded': { label: 'Document uploaded', color: 'bg-blue-500' },
    'doc:viewed': { label: 'Document viewed', color: 'bg-slate-400' },
    'sig:placed': { label: 'Signature field placed', color: 'bg-purple-500' },
    'link:generated': { label: 'Signing link generated', color: 'bg-amber-500' },
    'link:accessed': { label: 'Signing link opened', color: 'bg-yellow-400' },
    'sig:finalized': { label: 'Document signed', color: 'bg-green-500' },
    'sig:rejected': { label: 'Document rejected', color: 'bg-red-500' },
};

export default function AuditPage() {
    const { docId } = useParams<{ docId: string }>();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/api/audit/${docId}`)
            .then(r => setLogs(r.data.data))
            .finally(() => setLoading(false));
    }, [docId]);

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 py-8">
                    <button onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-[#e5322d] mb-8 font-bold transition-colors group">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to document
                    </button>

                    <div className="mb-10">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Audit Trail</h1>
                        <p className="text-slate-500 font-medium">Complete cryptographic history of this document</p>
                    </div>

                    <div className="mb-10">
                        <AuditIntegrity docId={docId} />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                    ) : logs.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No audit events found.</p>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                            <ul className="space-y-6 pl-12">
                                {logs.map(log => {
                                    const meta = actionLabels[log.action] ?? { label: log.action, color: 'bg-slate-400' };
                                    return (
                                        <li key={log._id} className="relative">
                                            <span className={`absolute -left-8 w-4 h-4 rounded-full ${meta.color} border-2 border-white shadow`} />
                                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-slate-800 text-sm">{meta.label}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 space-y-0.5">
                                                    <p>IP: {log.ipAddress}</p>
                                                    {log.userId && <p>By: {log.userId.name} ({log.userId.email})</p>}
                                                    {Object.keys(log.metadata).length > 0 && (
                                                        <p className="font-mono text-slate-400">{JSON.stringify(log.metadata)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
