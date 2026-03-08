'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Clock, CheckCircle, XCircle, Upload, LogOut, History, Plus, FileSignature } from 'lucide-react';
import AuthGuard from '@/components/ui/AuthGuard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { Document, DocSummary, DocStatus } from '@/types';

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [docs, setDocs] = useState<Document[]>([]);
    const [summary, setSummary] = useState<DocSummary>({ pending: 0, signed: 0, rejected: 0 });
    const [filter, setFilter] = useState<DocStatus | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const [docsRes, summaryRes] = await Promise.all([
                api.get(`/api/docs${params}`),
                api.get('/api/docs/summary'),
            ]);
            setDocs(docsRes.data.data.docs);
            setSummary(summaryRes.data.data);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filter]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFiles(Array.from(files));
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            if (file.type !== 'application/pdf') {
                alert(`"${file.name}" is not a PDF`);
                return false;
            }
            if (file.size > 20 * 1024 * 1024) {
                alert(`"${file.name}" exceeds 20 MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        try {
            const form = new FormData();
            validFiles.forEach(file => {
                form.append('pdfs', file);
            });
            await api.post('/api/docs/upload', form);
            fetchData();
        } catch { alert('Upload failed. Try again.'); }
        finally { setUploading(false); setSelectedFiles([]); e.target.value = ''; }
    };

    const handleLogout = async () => {
        await api.post('/api/auth/logout').catch(() => { });
        logout();
        router.push('/');
    };

    const handleDelete = async (docId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this document?')) return;
        await api.delete(`/api/docs/${docId}`).catch(() => { });
        fetchData();
    };

    const filters: { label: string; value: DocStatus | 'all'; count?: number }[] = [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending', count: summary.pending },
        { label: 'Signed', value: 'signed', count: summary.signed },
        { label: 'Rejected', value: 'rejected', count: summary.rejected },
    ];

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                {/* Navbar */}
                <nav className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-[#0f766e] to-[#14b8a6] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                D
                            </div>
                            <span className="text-xl font-bold text-slate-800">DocSign</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 hidden sm:block">Welcome, {user?.name}</span>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => { handleFileSelect(e); handleUpload(e); }}
                                />
                                <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0f766e] text-white hover:bg-[#0d5d56] cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md">
                                    {uploading ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />} Upload
                                </span>
                            </label>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="w-4 h-4" /> 
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </nav>

                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Pending', count: summary.pending, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', Icon: Clock },
                            { label: 'Signed', count: summary.signed, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', Icon: CheckCircle },
                            { label: 'Rejected', count: summary.rejected, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', Icon: XCircle },
                        ].map(({ label, count, color, bg, border, Icon }) => (
                            <div key={label} className={`${bg} ${border} border rounded-2xl p-5 flex items-center gap-4`}>
                                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${color}`} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">{count}</p>
                                    <p className="text-sm font-medium text-slate-500">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {filters.map(f => (
                            <button 
                                key={f.value} 
                                onClick={() => setFilter(f.value)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                                    filter === f.value
                                        ? 'bg-[#0f766e] text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                {f.label}
                                {f.count !== undefined && (
                                    <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                                        {f.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Document grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileSignature className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-lg font-semibold text-slate-700 mb-2">No documents yet</p>
                            <p className="text-sm text-slate-500 mb-6">Upload your first PDF to get started</p>
                            <label className="cursor-pointer inline-flex">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleUpload}
                                />
                                <span className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#0f766e] text-white hover:bg-[#0d5d56] cursor-pointer transition-all">
                                    <Upload className="w-4 h-4" /> Upload PDF
                                </span>
                            </label>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {docs.map(doc => (
                                <div 
                                    key={doc._id}
                                    onClick={() => router.push(`/documents/${doc._id}`)}
                                    className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-[#0f766e]" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); router.push(`/audit/${doc._id}`); }}
                                                className="p-2 text-slate-400 hover:text-[#0f766e] hover:bg-slate-50 rounded-lg transition-all"
                                                title="View Audit Trail"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>
                                            <Badge status={doc.status} />
                                            <button
                                                onClick={(e) => handleDelete(doc._id, e)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete document"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-slate-800 text-sm truncate mb-2">{doc.originalName}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span>{doc.pageCount} pages</span>
                                        <span>•</span>
                                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                        <span>•</span>
                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {doc.signerEmail && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <p className="text-xs text-slate-500 truncate">Signer: {doc.signerEmail}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
