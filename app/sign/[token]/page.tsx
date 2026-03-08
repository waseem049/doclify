'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Document as PDFDoc, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Eraser, PenLine, Upload, Type, Calendar, CheckSquare, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RejectSchema, type RejectInput } from '@/lib/schemas';
import type { Signature } from '@/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PageState = 'loading' | 'ready' | 'signing' | 'done' | 'rejected' | 'error';

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

// ── Signature field overlay ─────────────────────────────────────
function SignatureField({ placement, onClick }: { placement: Signature; onClick?: (p: Signature) => void }) {
    const isFilled = placement.imageData || placement.value;
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClick?.(placement); }}
            style={{
                position: 'absolute',
                left: `${placement.xPercent}%`,
                top: `${placement.yPercent}%`,
                width: `${placement.widthPercent}%`,
                height: `${placement.heightPercent}%`,
            }}
            className={`border-[2px] ${isFilled ? 'border-transparent' : 'border-[#0f766e] bg-[#0f766e]/10'} rounded-lg flex items-center justify-center group z-10 cursor-pointer hover:border-[#0d5d56] hover:bg-[#0f766e]/20 transition-all shadow-sm`}>

            {!isFilled && (
                <>
                    <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-[#0f766e] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-30">
                        CLICK TO FILL
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
                </div>
            )}
        </div>
    );
}

export default function SigningPage() {
    const { token } = useParams<{ token: string }>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [pageState, setPageState] = useState<PageState>('loading');
    const [docInfo, setDocInfo] = useState<any>(null);
    const [signatureFields, setSignatureFields] = useState<Signature[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [numPages, setNumPages] = useState<number>(0);
    const [showReject, setShowReject] = useState(false);

    // Modal state
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [activeField, setActiveField] = useState<Signature | null>(null);
    const [signMode, setSignMode] = useState<'draw' | 'upload' | 'type'>('draw');
    const [drawing, setDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [uploadedImg, setUploadedImg] = useState<string | null>(null);
    const [typedValue, setTypedValue] = useState('');

    const { register, handleSubmit, formState: { errors } } =
        useForm<RejectInput>({ resolver: zodResolver(RejectSchema) });

    useEffect(() => {
        Promise.all([
            api.get(`/api/docs/sign/${token}`),
            api.get(`/api/signatures/public/${token}`)
        ])
            .then(([docRes, sigRes]) => {
                const doc = docRes.data.data;

                // Construct full preview URL
                let previewUrl = doc.fileUrl;
                if (previewUrl && !previewUrl.startsWith('http')) {
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                    previewUrl = `${apiBase}${previewUrl}`;
                }
                doc.fileUrl = previewUrl;

                setDocInfo(doc);
                setSignatureFields(sigRes.data.data);
                setTotalPages(doc.pageCount || 1);
                setNumPages(doc.pageCount || 1);
                setPageState('ready');
            })
            .catch(() => setPageState('error'));
    }, [token]);

    const allFieldsFilled = signatureFields.every(f => f.imageData || f.value);

    // ── Field Filling Modal ──────────────────────────────────────────

    const openSignModal = (field: Signature) => {
        setActiveField(field);
        if (field.type === 'text' || field.type === 'date') {
            setSignMode('type');
            setTypedValue(field.value || '');
            setIsEmpty(!field.value);
        } else {
            setSignMode('draw');
            setUploadedImg(field.imageData || null);
            setIsEmpty(!field.imageData);
        }
        setSignModalOpen(true);
    };

    const closeSignModal = () => {
        setSignModalOpen(false);
        setActiveField(null);
    };

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
        setUploadedImg(null);
        setTypedValue('');
        setIsEmpty(true);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setUploadedImg(ev.target?.result as string);
            setIsEmpty(false);
        };
        reader.readAsDataURL(file);
    };

    const handleApplyField = () => {
        if (!activeField) return;
        let updates: Partial<Signature> = {};

        if (signMode === 'type') {
            updates.value = typedValue;
        } else if (signMode === 'upload' && uploadedImg) {
            updates.imageData = uploadedImg;
        } else if (signMode === 'draw') {
            updates.imageData = canvasRef.current!.toDataURL('image/png');
        }

        setSignatureFields(prev => prev.map(p => p._id === activeField._id ? { ...p, ...updates } : p));
        closeSignModal();
    };

    // ── Submission ──────────────────────────────────────────────────

    const handleSign = async () => {
        if (!allFieldsFilled) return;
        setPageState('signing');

        const fieldsToSubmit = signatureFields.map(p => ({
            fieldId: p._id,
            imageData: p.imageData,
            value: p.value
        }));

        try {
            await api.post('/api/signatures/finalize', { token, fields: fieldsToSubmit });
            setPageState('done');
        } catch (err: any) {
            alert(err.response?.data?.message ?? 'Signing failed');
            setPageState('ready');
        }
    };

    const handleReject = async (data: RejectInput) => {
        try {
            await api.put('/api/signatures/reject', { token, reason: data.reason });
            setPageState('rejected');
        } catch { alert('Failed to reject. Try again.'); }
    };

    // ── Terminal states ────────────────────────────────────────────
    if (pageState === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f9]"><Spinner size="lg" className="text-[#0f766e]" /></div>
    );
    if (pageState === 'error') return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-4 font-sans">
            <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-lg w-full text-center">
                <div className="w-24 h-24 bg-red-50 text-[#0f766e] rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Link Expired</h2>
                <p className="text-slate-500 font-medium">This secure signing link is no longer valid or has already been completed. Please contact the sender if you still need to sign.</p>
            </div>
        </div>
    );
    if (pageState === 'done') return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-4 font-sans">
            <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-lg w-full text-center border-t-8 border-[#0f766e]">
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircle2 className="w-14 h-14" />
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">All Done!</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Thank you for signing <strong>{docInfo?.originalName}</strong>. The document has been secured and returned to the sender. You may safely close this window.
                </p>
            </div>
        </div>
    );
    if (pageState === 'rejected') return (
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-4 font-sans">
            <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-lg w-full text-center">
                <div className="text-6xl mb-6">❌</div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Document Declined</h2>
                <p className="text-slate-500 font-medium">You have declined to sign this document. The sender has been notified of your decision.</p>
            </div>
        </div>
    );

    // ── Main UI ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans">
            {/* Top Bar */}
            <div className="bg-[#0f766e] px-6 py-4 flex flex-col md:flex-row items-center justify-between shadow-md sticky top-0 z-30 min-h-16">
                <div className="flex items-center gap-4 text-white mb-4 md:mb-0 w-full md:w-auto overflow-hidden">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg tracking-wide hidden md:block whitespace-nowrap">Signature Request</span>
                        <span className="text-white/40 hidden md:block">|</span>
                        <span className="font-medium truncate max-w-[200px] md:max-w-md" title={docInfo?.originalName}>
                            {docInfo?.originalName}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={() => setShowReject(true)} className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white flex-1 md:flex-none font-bold">
                        Decline
                    </Button>
                    <BrandButton onClick={handleSign} disabled={!allFieldsFilled} loading={pageState === 'signing'} className="flex-1 md:flex-none bg-white text-[#0f766e] hover:bg-slate-100 shadow-none px-6 py-2.5 !w-auto">
                        {allFieldsFilled ? <><CheckSquare className="w-5 h-5" /> Submit Document</> : <span className="text-sm">{signatureFields.filter(f => f.imageData || f.value).length} / {signatureFields.length} Completed</span>}
                    </BrandButton>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#e6e6e6] py-10 px-4 flex justify-center pb-40 relative">
                <div className="flex flex-col items-center max-w-5xl w-full">

                    {numPages > 1 && (
                        <div className="flex items-center gap-3 bg-white/90 backdrop-blur rounded-full px-4 py-2 border border-slate-200 shadow-sm text-sm text-slate-600 font-bold mb-6">
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                                className="disabled:opacity-30 hover:text-[#0f766e] transition-colors p-1">◀</button>
                            <span>{currentPage} / {numPages}</span>
                            <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages}
                                className="disabled:opacity-30 hover:text-[#0f766e] transition-colors p-1">▶</button>
                        </div>
                    )}

                    <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] ring-1 ring-slate-200/50 rounded-sm">
                        <PDFDoc file={docInfo?.fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<Spinner />}>
                            <div className="relative">
                                <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={800} />

                                {/* Signature field indicators */}
                                {signatureFields.filter(f => f.pageNumber === currentPage).map((field, idx) => (
                                    <SignatureField
                                        key={idx}
                                        placement={field}
                                        onClick={openSignModal}
                                    />
                                ))}
                            </div>
                        </PDFDoc>
                    </div>
                </div>
            </div>

            {/* Bottom sticky banner if not complete */}
            {!allFieldsFilled && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20 flex justify-center">
                    <div className="flex items-center gap-4 text-slate-700 font-medium">
                        <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                        Please click all the highlighted fields on the document to fill them out. Complete {signatureFields.length - signatureFields.filter(f => f.imageData || f.value).length} more to finish.
                    </div>
                </div>
            )}

            {/* Rejection form Modal */}
            <Modal open={showReject} onClose={() => setShowReject(false)} title={<span className="font-extrabold text-xl">Decline to Sign</span>}>
                <div className="space-y-6 pt-2">
                    <div className="bg-red-50 p-4 border border-red-100 rounded-xl mb-4">
                        <p className="text-sm text-slate-600 font-medium">Warning: This action will reject the entire document and notify the sender.</p>
                    </div>
                    <form onSubmit={handleSubmit(handleReject)} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Reason for declining</label>
                            <textarea {...register('reason')} rows={4}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-medium focus:border-red-500 focus:ring-0 outline-none transition-colors bg-slate-50"
                                placeholder="State your reason..." />
                            {errors.reason && <p className="text-xs font-bold text-red-500">{errors.reason.message}</p>}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <Button variant="outline" onClick={() => setShowReject(false)} className="flex-1 text-slate-500 border-slate-300 bg-slate-50 font-bold hover:bg-slate-100">Cancel</Button>
                            <BrandButton type="submit" className="flex-1 bg-red-600 hover:bg-red-700">Decline Document</BrandButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Provide Input Modal */}
            <Modal open={signModalOpen} onClose={closeSignModal} title={<span className="font-extrabold text-xl">{activeField?.type === 'text' || activeField?.type === 'date' ? `Fill ${activeField?.type}` : 'Provide Signature'}</span>}>
                <div className="space-y-6 pt-2">
                    {activeField?.type === 'text' || activeField?.type === 'date' ? (
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest object-bottom mb-2 block">{activeField?.type === 'date' ? 'Select Date' : 'Enter Text'}</label>
                            <input
                                type={activeField?.type === 'date' ? 'date' : 'text'}
                                value={typedValue}
                                onChange={e => { setTypedValue(e.target.value); setIsEmpty(!e.target.value.trim()); }}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-lg font-bold text-slate-800 focus:border-[#0f766e] focus:ring-0 outline-none transition-colors shadow-inner bg-slate-50"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <>
                            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => { setSignMode('draw'); setUploadedImg(null); setIsEmpty(true); }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${signMode === 'draw' ? 'bg-white text-slate-800 shadow shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Draw Pen
                                </button>
                                <button
                                    onClick={() => { setSignMode('upload'); clearCanvas(); setIsEmpty(true); }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${signMode === 'upload' ? 'bg-white text-slate-800 shadow shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Upload Image
                                </button>
                            </div>
                            <div className="border-2 border-slate-200 rounded-2xl bg-white relative h-48 flex items-center justify-center overflow-hidden shadow-inner cursor-crosshair">
                                {signMode === 'draw' ? (
                                    <>
                                        <span className="absolute inset-0 flex items-center justify-center text-slate-200 font-extrabold text-4xl select-none pointer-events-none tracking-widest opacity-40">SIGN HERE</span>
                                        <canvas
                                            ref={canvasRef} width={500} height={192}
                                            className="w-full h-full absolute inset-0 mix-blend-multiply"
                                            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                                        />
                                    </>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                                    >
                                        <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/svg+xml" onChange={handleUpload} className="hidden" />
                                        {uploadedImg ? (
                                            <img src={uploadedImg} alt="Preview" className="max-h-40 max-w-full object-contain pointer-events-none drop-shadow-md" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 hover:border-[#e5322d] hover:text-[#e5322d] transition-colors"><Upload className="w-8 h-8 mb-2" /><span className="text-sm font-bold">Select File from Device</span></div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button onClick={clearCanvas} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 uppercase tracking-wider mx-auto">
                                <Eraser className="w-3.5 h-3.5" /> Clear pad
                            </button>
                        </>
                    )}
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <Button onClick={closeSignModal} variant="outline" className="flex-1 text-slate-500 border-slate-300 bg-slate-50 font-bold hover:bg-slate-100">Cancel</Button>
                        <Button onClick={handleApplyField} disabled={isEmpty} className="flex-1 bg-slate-800 text-white font-bold hover:bg-black">Apply Content</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
