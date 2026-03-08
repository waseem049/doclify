import { clsx } from 'clsx';
import type { DocStatus } from '@/types';

const config: Record<DocStatus, { label: string; classes: string }> = {
    pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border border-amber-100' },
    partially_signed: { label: 'Partially Signed', classes: 'bg-blue-50 text-blue-700 border border-blue-100' },
    signed: { label: 'Signed', classes: 'bg-teal-50 text-teal-700 border border-teal-100' },
    rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border border-red-100' },
};

export default function Badge({ status, className }: { status: DocStatus; className?: string }) {
    const { label, classes } = config[status];
    return (
        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold', classes, className)}>
            {label}
        </span>
    );
}
