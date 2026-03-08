'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Clock, User, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface AuditDetail {
    id: string;
    action: string;
    hasCorrectHash: boolean;
    hasCorrectLink: boolean;
    timestamp: string;
}

interface AuditVerifyResponse {
    isValid: boolean;
    details: AuditDetail[];
}

export default function AuditIntegrity({ docId }: { docId: string }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AuditVerifyResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/api/audit/verify/${docId}`);
                setData(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to verify audit trail');
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [docId]);

    if (loading) return <div className="animate-pulse flex items-center gap-2 text-slate-400 text-sm font-bold"><Clock className="w-4 h-4" /> Verifying cryptochain...</div>;
    if (error) return <div className="text-red-500 text-xs font-bold flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> {error}</div>;
    if (!data) return null;

    return (
        <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
            <div
                onClick={() => setExpanded(!expanded)}
                className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${data.isValid ? 'bg-emerald-50/50' : 'bg-red-50/50'}`}
            >
                <div className="flex items-center gap-3">
                    {data.isValid ? (
                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    ) : (
                        <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-wider ${data.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                            {data.isValid ? 'Audit Trail Verified' : 'Integrity Compromised'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Secure SHA-256 Cryptochain</p>
                    </div>
                </div>
                {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>

            {expanded && (
                <div className="border-t border-slate-100 p-2 space-y-1 bg-slate-50/30 max-h-[300px] overflow-y-auto">
                    {[...data.details].reverse().map((log, i) => (
                        <div key={log.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:border-slate-200 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-8 rounded-full ${log.hasCorrectHash && log.hasCorrectLink ? 'bg-emerald-400/50 group-hover:bg-emerald-400' : 'bg-red-500'}`} />
                                <div>
                                    <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${log.hasCorrectHash ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    Hash: {log.hasCorrectHash ? 'OK' : 'MISMATCH'}
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${log.hasCorrectLink ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    Link: {log.hasCorrectLink ? 'OK' : 'BROKEN'}
                                </div>
                            </div>
                        </div>
                    ))}
                    {data.details.length === 0 && <p className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">No signature logs found</p>}
                </div>
            )}
        </div>
    );
}
