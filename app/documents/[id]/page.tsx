'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Document as PDFDoc, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ArrowLeft, PenLine, Trash2, Send, Download, Type, Calendar, CheckSquare, Upload, Eraser, Move, Settings, CheckCircle2, Users, History } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useEditorStore } from '@/stores/editor.store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShareSchema, type ShareInput } from '@/lib/schemas';
import type { Signature } from '@/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Premium iLovePDF Action Button
const BrandButton = ({ children, onClick, loading, icon, disabled, className = '' }: any) => (
    <button
        disabled={disabled || loading}
        onClick={onClick}
        className={`flex items-center justify-center gap-2 w-full py-4 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className || 'bg-[#0f766e] hover:bg-[#0d5d56]'}`}
    >
        {loading ? <Spinner size="sm" className="text-white" /> : icon}
        {children}
    </button>
);

function SignatureField({ placement, onDelete, onClick, onDragStart }: {
    placement: Signature;
    onDelete: (id: string) => void,
    onClick: (p: Signature) => void,
    onDragStart: (e: React.MouseEvent, p: Signature) => void
}) {
    const isFilled = placement.imageData || placement.value;
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClick(placement); }}
            onMouseDown={(e) => {
                if (e.button === 0) { // Left click only
                    onDragStart(e, placement);
                }
            }}
            style={{
                position: 'absolute', left: `${placement.xPercent}%`, top: `${placement.yPercent}%`,
                width: `${placement.widthPercent}%`, height: `${placement.heightPercent}%`,
            }}
            className={`border-[2px] ${isFilled ? 'border-transparent' : 'border-[#0f766e] bg-[#0f766e]/10'} rounded-lg flex items-center justify-center group z-10 cursor-move hover:border-[#0d5d56] hover:bg-[#0f766e]/20 transition-all shadow-sm active:scale-[0.98]`}>

            {/* Fake resize handles for aesthetics */}
            {!isFilled && (
                <>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[#0f766e] rounded-full hidden group-hover:block pointer-events-none" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[#0f766e] rounded-full hidden group-hover:block pointer-events-none" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[#0f766e] rounded-full hidden group-hover:block pointer-events-none" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#0f766e] rounded-full hidden group-hover:block pointer-events-none" />
                    <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-[#0f766e] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md hidden group-hover:block pointer-events-none whitespace-nowrap z-30">
                        {placement.type.toUpperCase()}
                    </div>
                </>
            )}

            {placement.imageData ? (
                <img src={placement.imageData} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md" />
            ) : placement.value ? (
                <span className="font-semibold text-slate-800 pointer-events-none text-base px-2 truncate w-full flex items-center justify-center h-full drop-shadow-sm">{placement.value}</span>
            ) : (
                <div className="flex flex-col items-center pointer-events-none text-[#0f766e] font-bold">
                    {placement.type === 'text' ? <Type className="w-6 h-6 mb-1" /> :
                        placement.type === 'date' ? <Calendar className="w-6 h-6 mb-1" /> :
                            placement.type === 'initials' ? <CheckSquare className="w-6 h-6 mb-1" /> :
                                <PenLine className="w-6 h-6 mb-1" />}
                    <span className="text-[11px] tracking-wide hidden md:block opacity-80">
                        {placement.assignedTo ? placement.assignedTo : 'CONFIGURE FIELD'}
                    </span>
                </div>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onDelete(placement._id); }}
                className="absolute -top-3 -right-3 hidden group-hover:flex w-7 h-7 bg-white border border-slate-200 shadow-md rounded-full items-center justify-center z-20 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
            </button>
        </div>
    );
}

export default function DocumentEditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();
    const { document, placements, currentPage, totalPages, fileUrl, editorMode, fieldType,
        setDocument, setPlacements, addPlacement, removePlacement, updatePlacement,
        setPage, setTotalPages, setFileUrl, setEditorMode, setFieldType, reset } = useEditorStore();

    const pageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [shareOpen, setShareOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    // Modal constraints for fields
    const [activeField, setActiveField] = useState<Signature | null>(null);
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    // Sign Modal Forms
    const [signMode, setSignMode] = useState<'draw' | 'upload' | 'type'>('draw');
    const [drawing, setDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [uploadedImg, setUploadedImg] = useState<string | null>(null);
    const [typedValue, setTypedValue] = useState('');

    const [assignEmail, setAssignEmail] = useState('');

    // Draggable state
    const [draggingField, setDraggingField] = useState<Signature | null>(null);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0, fieldX: 0, fieldY: 0 });

    const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset: resetShare } =
        useForm<ShareInput>({ resolver: zodResolver(ShareSchema) });

    useEffect(() => {
        if (!user) {
            setEditorMode('self');
        }
    }, [user, setEditorMode]);

    useEffect(() => {
        reset();
        Promise.all([
            api.get(`/api/docs/${id}`),
            api.get(`/api/signatures/${id}`)
        ]).then(([docRes, sigRes]) => {
            const doc = docRes.data.data;
            setDocument(doc);

            // Construct full preview URL
            let previewUrl = doc.fileUrl;
            if (previewUrl && !previewUrl.startsWith('http')) {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                previewUrl = `${apiBase}${previewUrl}`;
            }
            setFileUrl(previewUrl);

            setPlacements(sigRes.data.data);
        }).finally(() => setLoading(false));
    }, [id]);

    const handlePageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!pageRef.current || document?.status !== 'pending') return;
        const rect = pageRef.current.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
        const widthPercent = 22;
        const heightPercent = 8;
        const clampedX = Math.max(0, Math.min(xPercent - widthPercent / 2, 100 - widthPercent));
        const clampedY = Math.max(0, Math.min(yPercent - heightPercent / 2, 100 - heightPercent));

        try {
            const res = await api.post('/api/signatures', {
                documentId: id,
                page: currentPage,
                xPercent: clampedX,
                yPercent: clampedY,
                widthPercent,
                heightPercent,
                type: fieldType
            });
            addPlacement(res.data.data);
            if (editorMode === 'self') openFieldModal(res.data.data);
        } catch { }
    };

    const handleDragStart = (e: React.MouseEvent, field: Signature) => {
        if (document?.status !== 'pending') return;
        e.stopPropagation();
        setDraggingField(field);
        setDragStartPos({
            x: e.clientX,
            y: e.clientY,
            fieldX: field.xPercent,
            fieldY: field.yPercent
        });
    };

    const handleDragMove = (e: MouseEvent) => {
        if (!draggingField || !pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();

        const deltaX = ((e.clientX - dragStartPos.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStartPos.y) / rect.height) * 100;

        const newX = Math.max(0, Math.min(dragStartPos.fieldX + deltaX, 100 - draggingField.widthPercent));
        const newY = Math.max(0, Math.min(dragStartPos.fieldY + deltaY, 100 - draggingField.heightPercent));

        updatePlacement(draggingField._id, { xPercent: newX, yPercent: newY });
    };

    const handleDragEnd = async () => {
        if (!draggingField) return;
        const finalField = placements.find(p => p._id === draggingField._id);
        if (finalField) {
            try {
                await api.patch(`/api/signatures/${finalField._id}`, {
                    xPercent: finalField.xPercent,
                    yPercent: finalField.yPercent
                });
            } catch {
                // Revert on failure if needed, but for now just log
                console.error('Failed to sync drag position');
            }
        }
        setDraggingField(null);
    };

    useEffect(() => {
        if (draggingField) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
        } else {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };
    }, [draggingField, dragStartPos, placements]);

    const handleDelete = async (sigId: string) => {
        await api.delete(`/api/signatures/${sigId}`).catch(() => { });
        removePlacement(sigId);
    };

    const openFieldModal = (field: Signature) => {
        setActiveField(field);
        if (editorMode === 'self') {
            if (field.type === 'text' || field.type === 'date') {
                setSignMode('type'); setTypedValue(field.value || ''); setIsEmpty(!field.value);
            } else {
                setSignMode('draw'); setUploadedImg(field.imageData || null); setIsEmpty(!field.imageData);
            }
            setSignModalOpen(true);
        } else {
            setAssignEmail(field.assignedTo || ''); setAssignModalOpen(true);
        }
    };

    const closeSignModal = () => { setSignModalOpen(false); setActiveField(null); };
    const closeAssignModal = () => { setAssignModalOpen(false); setActiveField(null); };

    // Drawing logic
    const getCtx = () => canvasRef.current?.getContext('2d')!;
    const startDraw = (e: React.MouseEvent) => {
        const ctx = getCtx();
        ctx.strokeStyle = '#222222'; ctx.lineWidth = 3.5;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setDrawing(true); setIsEmpty(false);
    };
    const draw = (e: React.MouseEvent) => {
        if (!drawing) return;
        getCtx().lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        getCtx().stroke();
    };
    const stopDraw = () => setDrawing(false);
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) getCtx().clearRect(0, 0, canvas.width, canvas.height);
        setUploadedImg(null); setTypedValue(''); setIsEmpty(true);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setUploadedImg(ev.target?.result as string); setIsEmpty(false); };
        reader.readAsDataURL(file);
    };

    const handleApplySelfSignField = () => {
        if (!activeField) return;
        let updates: Partial<Signature> = {};
        if (signMode === 'type') { updates.value = typedValue; }
        else if (signMode === 'upload' && uploadedImg) { updates.imageData = uploadedImg; }
        else if (signMode === 'draw') { updates.imageData = canvasRef.current!.toDataURL('image/png'); }

        updatePlacement(activeField._id, updates);
        closeSignModal();
    };

    const handleApplyAssignField = async () => {
        if (!activeField || !assignEmail) return;
        try {
            await api.patch(`/api/signatures/assign/${activeField._id}`, { assignedTo: assignEmail });
            updatePlacement(activeField._id, { assignedTo: assignEmail });
            closeAssignModal();
        } catch (err: any) { alert(err.response?.data?.message || 'Assignment failed'); }
    };

    const handleDownload = async () => {
        if (!document) return;
        setDownloading(true);
        try {
            const res = await api.get(`/api/docs/${document._id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = window.document.createElement('a');
            link.href = url;
            link.setAttribute('download', `signed-${document.originalName}`);
            window.document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert('Download failed. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleSelfSignAndDownload = async () => {
        if (!document) return;
        const filledFields = placements.filter(p => p.imageData || p.value);
        if (filledFields.length === 0) {
            alert('Please complete at least one field first.');
            return;
        }

        setDownloading(true);
        try {
            const fieldsToSubmit = filledFields.map(p => ({
                fieldId: p._id, imageData: p.imageData, value: p.value
            }));
            await api.post('/api/signatures/self-sign', {
                documentId: document._id,
                fields: fieldsToSubmit
            });

            // Re-fetch to get 'signed' status
            const updatedDoc = await api.get(`/api/docs/${document._id}`);
            setDocument(updatedDoc.data.data);

            // Trigger download after successful sign
            await handleDownload();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to sign document');
        } finally {
            setDownloading(false);
        }
    };

    const onShare = async (data: ShareInput) => {
        try {
            const emails = data.signerEmail.split(',').map(e => e.trim()).filter(Boolean);
            if (emails.length === 0) {
                setError('signerEmail', { message: 'At least one valid email required' });
                return;
            }

            await api.post(`/api/signatures/share/${id}`, { signerEmail: emails });
            setShareOpen(false); resetShare();
            alert(`Signing request sent to ${emails.length} signer(s): ${emails.join(', ')}`);
            const res = await api.get(`/api/docs/${id}`);
            setDocument(res.data.data);
        } catch (err: any) {
            setError('signerEmail', { message: err.response?.data?.message ?? 'Failed to send' });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Spinner size="lg" className="text-[#0f766e]" /></div>;

    const currentPlacements = placements.filter(p => p.pageNumber === currentPage);

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-[#0f766e] to-[#0d9488] px-6 flex items-center justify-between shrink-0 shadow-lg h-16 sticky top-0 z-30">
                <div className="flex items-center gap-4 text-white">
                    <button onClick={() => router.push(user ? '/dashboard' : '/')} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg tracking-wide hidden md:block">Sign PDF</span>
                        <span className="text-white/40 hidden md:block">|</span>
                        <span className="font-medium truncate max-w-[200px] md:max-w-md" title={document?.originalName}>
                            {document?.originalName ?? 'Document'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/audit/${id}`)}
                        className="bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm font-semibold"
                        title="View Audit Trail"
                    >
                        <History className="w-4 h-4" /> <span className="hidden sm:inline">Audit Trail</span>
                    </button>
                    {document?.status === 'signed' ? (
                        <Button onClick={handleDownload} loading={downloading} className="bg-white text-[#0f766e] hover:bg-slate-100 flex items-center gap-2 font-bold shadow-sm">
                            <Download className="w-4 h-4" /> Final PDF
                        </Button>
                    ) : (
                        <Badge status={document?.status || 'pending'} className="bg-white/20 text-white border-white/20" />
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ── Left Sidebar (Tools) ── */}
                {document?.status === 'pending' && (
                    <div className="w-[100px] bg-white border-r border-slate-200 shadow-sm flex flex-col py-6 items-center gap-6 z-20 overflow-y-auto">
                        <div className="text-[10px] font-extrabold text-[#0f766e] uppercase tracking-widest px-2 text-center">Fields</div>

                        <button onClick={() => setFieldType('signature')} className={`flex flex-col items-center gap-2 w-20 py-3 rounded-2xl transition-all ${fieldType === 'signature' ? 'bg-[#0f766e]/10 text-[#0f766e] scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                            <PenLine strokeWidth={1.5} className="w-7 h-7" />
                            <span className="text-[10px] font-bold tracking-wide">Signature</span>
                        </button>

                        <button onClick={() => setFieldType('initials')} className={`flex flex-col items-center gap-2 w-20 py-3 rounded-2xl transition-all ${fieldType === 'initials' ? 'bg-[#0f766e]/10 text-[#0f766e] scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                            <CheckSquare strokeWidth={1.5} className="w-7 h-7" />
                            <span className="text-[10px] font-bold tracking-wide">Initials</span>
                        </button>

                        <button onClick={() => setFieldType('text')} className={`flex flex-col items-center gap-2 w-20 py-3 rounded-2xl transition-all ${fieldType === 'text' ? 'bg-[#0f766e]/10 text-[#0f766e] scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                            <Type strokeWidth={1.5} className="w-7 h-7" />
                            <span className="text-[10px] font-bold tracking-wide">Text</span>
                        </button>

                        <button onClick={() => setFieldType('date')} className={`flex flex-col items-center gap-2 w-20 py-3 rounded-2xl transition-all ${fieldType === 'date' ? 'bg-[#0f766e]/10 text-[#0f766e] scale-105' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                            <Calendar strokeWidth={1.5} className="w-7 h-7" />
                            <span className="text-[10px] font-bold tracking-wide">Date</span>
                        </button>
                    </div>
                )}

                {/* ── Central PDF Canvas ── */}
                <div className="flex-1 overflow-auto bg-slate-200 flex flex-col items-center py-10 pb-40 relative">
                    {fileUrl ? (
                        <div className="flex flex-col items-center w-full px-8 drop-shadow-2xl">
                            {/* Top page nav */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-3 bg-white/90 backdrop-blur rounded-full px-4 py-2 border border-slate-200 shadow-sm text-sm text-slate-600 font-bold mb-6">
                                    <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="disabled:opacity-30 hover:text-[#0f766e] transition-colors p-1">◀</button>
                                    <span>{currentPage} / {totalPages}</span>
                                    <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="disabled:opacity-30 hover:text-[#0f766e] transition-colors p-1">▶</button>
                                </div>
                            )}

                            <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] ring-1 ring-slate-200/50">
                                <PDFDoc file={fileUrl} onLoadSuccess={({ numPages }) => setTotalPages(numPages)} loading={<Spinner />}>
                                    <div className="relative group cursor-crosshair" onClick={handlePageClick}>
                                        <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={800} />
                                        <div ref={pageRef} className="absolute inset-0">
                                            {currentPlacements.map(p => (
                                                <SignatureField key={p._id} placement={p} onDelete={handleDelete} onClick={openFieldModal} onDragStart={handleDragStart} />
                                            ))}
                                        </div>
                                    </div>
                                </PDFDoc>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 font-medium my-auto">Failed to load PDF preview.</p>
                    )}
                </div>

                {/* ── Right Sidebar (Options & Actions) ── */}
                {document?.status === 'pending' && (
                    <div className="w-[320px] bg-white border-l border-slate-200 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] flex flex-col z-20">

                        {/* Document Options Top */}
                        <div className="px-6 py-8 border-b border-slate-100 flex-1">
                            <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Sign settings</h2>

                            <label className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3 block">Signing Mode</label>
                            <div className="flex flex-col gap-3">
                                <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 outline-none transition-all ${editorMode === 'self' ? 'border-[#0f766e] bg-[#0f766e]/5' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input type="radio" name="editor_mode" value="self" className="sr-only" checked={editorMode === 'self'} onChange={() => setEditorMode('self')} />
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                                                <PenLine className="w-4 h-4 text-slate-500" /> Only Me
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium mt-1">Sign the document yourself instantly.</span>
                                        </div>
                                        {editorMode === 'self' && <CheckCircle2 className="w-6 h-6 text-[#0f766e]" />}
                                    </div>
                                </label>

                                <label
                                    className={`relative flex cursor-pointer rounded-xl border-2 p-4 outline-none transition-all ${!user ? 'opacity-60 cursor-not-allowed border-dashed bg-slate-50' : editorMode === 'request' ? 'border-[#0f766e] bg-[#0f766e]/5' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="editor_mode"
                                        value="request"
                                        className="sr-only"
                                        disabled={!user}
                                        checked={editorMode === 'request'}
                                        onChange={() => setEditorMode('request')}
                                    />
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                                                <Users className="w-4 h-4 text-slate-500" /> Request Signatures
                                                {!user && <span className="bg-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ml-1">Account Needed</span>}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium mt-1">Prepare fields and send via email.</span>
                                        </div>
                                        {editorMode === 'request' && <CheckCircle2 className="w-6 h-6 text-[#0f766e]" />}
                                    </div>
                                </label>
                            </div>

                            <div className="mt-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-500">FIELDS PLACED</span>
                                    <span className="text-lg font-black text-[#0f766e]">{placements.length}</span>
                                </div>
                                {placements.length === 0 && (
                                    <p className="text-[11px] text-slate-400 font-medium">Select a tool on the left and click the page to add fields.</p>
                                )}
                            </div>

                            <div className="mt-8">
                                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3 block">Privacy</label>
                                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{document?.isPublic ? 'Public Mode' : 'Private Mode'}</span>
                                        <span className="text-[10px] text-slate-500 font-medium">{document?.isPublic ? 'Visible to everyone' : 'Only for participants'}</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const newPublic = !document?.isPublic;
                                            // We need an endpoint for this too
                                            await api.patch(`/api/docs/${id}`, { isPublic: newPublic });
                                            setDocument({ ...document!, isPublic: newPublic });
                                        }}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${document?.isPublic ? 'bg-green-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${document?.isPublic ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic px-1">
                                    "Only Me" signatures are typically public for verification.
                                </p>
                            </div>
                        </div>

                        {/* Sticky Action Bottom */}
                        <div className="p-6 bg-slate-50/80 backdrop-blur border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                            {editorMode === 'self' ? (
                                <>
                                    <p className="text-[11px] text-slate-500 font-medium mb-3 text-center">Please make sure to click your placed fields and fill them out before signing.</p>
                                    <BrandButton onClick={handleSelfSignAndDownload} loading={downloading} icon={<CheckSquare className="w-5 h-5" />}>
                                        Sign & Download
                                    </BrandButton>
                                </>
                            ) : (
                                <>
                                    <p className="text-[11px] text-slate-500 font-medium mb-3 text-center">Ensure all fields are assigned to the correct email before sending.</p>
                                    <BrandButton onClick={() => setShareOpen(true)} icon={<Send className="w-5 h-5" />}>
                                        Send to Signers
                                    </BrandButton>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Send Document">
                <p className="text-sm text-slate-500 font-medium mb-6">
                    You have placed <strong className="text-slate-800">{placements.length}</strong> fields. Enter one or more email addresses below (comma-separated) to dispatch the document.
                </p>
                <form onSubmit={handleSubmit(onShare)} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Signer Email(s)</label>
                        <input {...register('signerEmail')} placeholder="jane@company.com, bob@org.com, ..."
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base font-medium focus:border-[#e5322d] focus:ring-0 outline-none transition-colors" />
                        {errors.signerEmail && <p className="text-xs font-bold text-red-500">{errors.signerEmail.message}</p>}
                    </div>
                    <BrandButton type="submit" loading={isSubmitting} icon={<Send className="w-4 h-4" />}>
                        Dispatch Secure Link
                    </BrandButton>
                </form>
            </Modal>

            {/* Self-Sign Input Tool Modal */}
            <Modal open={signModalOpen} onClose={closeSignModal} title={<span className="font-extrabold text-xl">{activeField?.type === 'text' || activeField?.type === 'date' ? `Fill ${activeField?.type}` : 'Create Signature'}</span>}>
                <div className="space-y-6 pt-2">
                    {activeField?.type === 'text' || activeField?.type === 'date' ? (
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest object-bottom mb-2 block">{activeField?.type === 'date' ? 'Select Date' : 'Enter Text'}</label>
                            <input type={activeField?.type === 'date' ? 'date' : 'text'}
                                value={typedValue} onChange={e => { setTypedValue(e.target.value); setIsEmpty(!e.target.value.trim()); }}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-lg font-bold text-slate-800 focus:border-[#e5322d] focus:ring-0 outline-none transition-colors shadow-inner bg-slate-50" autoFocus />
                        </div>
                    ) : (
                        <>
                            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                <button onClick={() => { setSignMode('draw'); setUploadedImg(null); setIsEmpty(true); }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${signMode === 'draw' ? 'bg-white text-slate-800 shadow shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    Draw Pen
                                </button>
                                <button onClick={() => { setSignMode('upload'); clearCanvas(); setIsEmpty(true); }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${signMode === 'upload' ? 'bg-white text-slate-800 shadow shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    Upload Image
                                </button>
                            </div>
                            <div className="border-2 border-slate-200 rounded-2xl bg-white relative h-48 flex items-center justify-center overflow-hidden shadow-inner cursor-crosshair">
                                {signMode === 'draw' ? (
                                    <>
                                        <span className="absolute inset-0 flex items-center justify-center text-slate-200 font-extrabold text-4xl select-none pointer-events-none tracking-widest opacity-40">SIGN HERE</span>
                                        <canvas ref={canvasRef} width={500} height={192} className="w-full h-full absolute inset-0 mix-blend-multiply"
                                            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
                                    </>
                                ) : (
                                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="file" ref={fileInputRef} accept="image/png,image/jpeg" onChange={handleUpload} className="hidden" />
                                        {uploadedImg ? <img src={uploadedImg} alt="Preview" className="max-h-40 max-w-full object-contain pointer-events-none drop-shadow-md" /> :
                                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 hover:border-[#e5322d] hover:text-[#e5322d] transition-colors"><Upload className="w-8 h-8 mb-2" /><span className="text-sm font-bold">Select File from Device</span></div>}
                                    </div>
                                )}
                            </div>
                            <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 uppercase tracking-wider mx-auto"><Eraser className="w-3.5 h-3.5" /> Clear pad</button>
                        </>
                    )}
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <Button onClick={closeSignModal} variant="outline" className="flex-1 text-slate-500 border-slate-300 bg-slate-50 font-bold hover:bg-slate-100">Cancel</Button>
                        <Button onClick={handleApplySelfSignField} disabled={isEmpty} className="flex-1 bg-slate-800 text-white font-bold hover:bg-black">Apply Content</Button>
                    </div>
                </div>
            </Modal>

            {/* Request Signatures Assigner Modal */}
            <Modal open={assignModalOpen} onClose={closeAssignModal} title={<span className="font-extrabold text-xl">Assign Field</span>}>
                <div className="space-y-6 pt-2">
                    <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl mb-4">
                        <p className="text-sm text-slate-600 font-medium">Specify the exact email address of the person required to interact with this specific <strong>{activeField?.type}</strong> field.</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Assignee Email</label>
                        <input type="email" value={assignEmail} onChange={e => setAssignEmail(e.target.value)}
                            placeholder="signer@company.com"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base font-medium focus:border-blue-500 focus:ring-0 outline-none transition-colors bg-slate-50" autoFocus />
                    </div>
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <Button onClick={closeAssignModal} variant="outline" className="flex-1 text-slate-500 border-slate-300 bg-slate-50 font-bold hover:bg-slate-100">Cancel</Button>
                        <Button onClick={handleApplyAssignField} disabled={!assignEmail} className="flex-1 bg-blue-600 text-white font-bold hover:bg-blue-700">Save Assignment</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
