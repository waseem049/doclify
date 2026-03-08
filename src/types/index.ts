export type DocStatus = 'pending' | 'partially_signed' | 'signed' | 'rejected';
export type SigStatus = 'pending' | 'signed' | 'rejected';

export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface DocSummary {
    pending: number;
    signed: number;
    rejected: number;
}

export interface Document {
    _id: string;
    originalName: string;
    fileSize: number;
    pageCount?: number;
    status: DocStatus;
    isPublic: boolean;
    signerEmail?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Signature {
    _id: string;
    documentId: string;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    pageNumber: number;
    status: SigStatus;
    type: 'signature' | 'text' | 'date' | 'initials';
    assignedTo?: string;
    imageData?: string;
    value?: string;
    signedAt?: string;
}

export interface AuditLog {
    _id: string;
    action: string;
    ipAddress: string;
    metadata: Record<string, any>;
    createdAt: string;
    userId?: { name: string; email: string };
    documentId?: { originalName: string; status: string };
}
