'use client';
import { clsx } from 'clsx';
import Spinner from './Spinner';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export default function Button({ 
    variant = 'primary', 
    size = 'md',
    loading, 
    children, 
    className, 
    disabled, 
    ...rest 
}: Props) {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
    
    const variants = {
        primary: 'bg-[#0f766e] text-white hover:bg-[#0d5d56] hover:shadow-lg',
        accent: 'bg-[#f97316] text-white hover:bg-[#ea580c] hover:shadow-lg',
        outline: 'border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-base',
    };

    return (
        <button 
            className={clsx(base, variants[variant], sizes[size], className)} 
            disabled={disabled || loading} 
            {...rest} 
            suppressHydrationWarning
        >
            {loading && <Spinner size="sm" />}
            {children}
        </button>
    );
}
