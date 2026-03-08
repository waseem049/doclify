'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, ShieldCheck, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { useEditorStore } from '@/stores/editor.store';

export default function HomeHero() {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const setDocument = useEditorStore(s => s.setDocument);

    const handleUpload = async (file: File) => {
        if (!file || file.type !== 'application/pdf') return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('pdfs', file);
            const res = await api.post('/api/docs/upload', formData);
            setDocument(res.data.data);
            router.push(`/documents/${res.data.data._id}`);
        } catch (err) {
            console.error('Upload failed', err);
            setIsUploading(false);
        }
    };

    const features = [
        { icon: ShieldCheck, text: 'Bank-level security' },
        { icon: Zap, text: 'Sign in seconds' },
        { icon: FileText, text: 'Legal compliance' },
    ];

    return (
        <section className="relative pt-28 pb-20 px-6 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 pattern-dots opacity-40" />
            <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-teal-50 to-orange-50 rounded-full blur-3xl opacity-60 -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-50 to-teal-50 rounded-full blur-3xl opacity-50 -z-10" />

            <div className="max-w-5xl mx-auto relative">
                {/* Badge */}
                <div className="flex justify-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-slate-600">Free for individual users</span>
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-12 animate-slide-up">
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                        Sign PDFs 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f766e] to-[#14b8a6]"> effortlessly</span>
                        <br />in seconds
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                        The simplest way to sign, edit, and manage your documents. 
                        Professional tools with enterprise-grade security.
                    </p>
                </div>

                {/* Upload Area */}
                <div 
                    className="animate-scale-in"
                    style={{ animationDelay: '200ms' }}
                >
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files[0];
                            if (file) handleUpload(file);
                        }}
                        className={`
                            relative group max-w-xl mx-auto p-10 rounded-3xl border-2 transition-all duration-300 cursor-pointer
                            ${isDragging
                                ? 'border-[#0f766e] bg-teal-50/50 scale-[1.02] shadow-xl'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xl'
                            }
                        `}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                            className="hidden"
                            accept=".pdf"
                        />

                        <div className="flex flex-col items-center">
                            <div className={`
                                w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg transition-all duration-500
                                ${isDragging ? 'bg-[#0f766e]' : 'bg-gradient-to-br from-[#0f766e] to-[#14b8a6]'}
                            `}>
                                <Upload className="w-7 h-7 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {isDragging ? 'Drop your PDF here' : 'Upload your document'}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6">
                                or drag and drop anywhere on this page
                            </p>

                            <Button 
                                variant="primary"
                                size="lg"
                                loading={isUploading}
                                className="bg-[#0f766e] hover:bg-[#0d5d56]"
                            >
                                Select PDF file
                                <ArrowRight className="w-4 h-4" />
                            </Button>

                            <p className="text-xs text-slate-400 mt-4 font-medium">
                                Supports PDF files up to 20 MB
                            </p>
                        </div>

                        {isUploading && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20">
                                <div className="w-10 h-10 border-4 border-[#0f766e] border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-slate-600 font-semibold">Uploading your document...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trust indicators */}
                <div className="mt-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <div className="flex flex-wrap justify-center gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-slate-600">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <feature.icon className="w-4 h-4 text-[#0f766e]" />
                                </div>
                                <span className="text-sm font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
