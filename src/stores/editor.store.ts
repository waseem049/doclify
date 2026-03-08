import { create } from 'zustand';
import type { Document, Signature } from '@/types';

interface EditorState {
    document: Document | null;
    placements: Signature[];
    currentPage: number;
    totalPages: number;
    fileUrl: string | null;
    editorMode: 'self' | 'request';
    fieldType: 'signature' | 'text' | 'date' | 'initials';
    setDocument: (doc: Document) => void;
    setPlacements: (sigs: Signature[]) => void;
    addPlacement: (sig: Signature) => void;
    removePlacement: (id: string) => void;
    updatePlacement: (id: string, updates: Partial<Signature>) => void;
    setPage: (n: number) => void;
    setTotalPages: (n: number) => void;
    setFileUrl: (url: string) => void;
    setEditorMode: (mode: 'self' | 'request') => void;
    setFieldType: (type: 'signature' | 'text' | 'date' | 'initials') => void;
    reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    document: null,
    placements: [],
    currentPage: 1,
    totalPages: 1,
    fileUrl: null,
    editorMode: 'self',
    fieldType: 'signature',
    setDocument: (document) => set({ document }),
    setPlacements: (placements) => set({ placements }),
    addPlacement: (sig) => set(s => ({ placements: [...s.placements, sig] })),
    removePlacement: (id) => set(s => ({ placements: s.placements.filter(p => p._id !== id) })),
    updatePlacement: (id, updates) => set(s => ({ placements: s.placements.map(p => p._id === id ? { ...p, ...updates } : p) })),
    setPage: (currentPage) => set({ currentPage }),
    setTotalPages: (totalPages) => set({ totalPages }),
    setFileUrl: (fileUrl) => set({ fileUrl }),
    setEditorMode: (editorMode) => set({ editorMode }),
    setFieldType: (fieldType) => set({ fieldType }),
    reset: () => set({ document: null, placements: [], currentPage: 1, totalPages: 1, fileUrl: null, editorMode: 'self', fieldType: 'signature' }),
}));
