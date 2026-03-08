'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import api from '@/lib/api';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/lib/schemas';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
    const [success, setSuccess] = useState(false);
    
    const { register, handleSubmit, formState: { errors, isSubmitting } } =
        useForm<ForgotPasswordInput>({ resolver: zodResolver(ForgotPasswordSchema) });

    const onSubmit = async (data: ForgotPasswordInput) => {
        try {
            await api.post('/api/auth/forgot-password', { email: data.email });
            setSuccess(true);
        } catch { }
    };

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="text-5xl mb-4">📧</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h2>
                    <p className="text-slate-500 mb-6">
                        If an account exists with this email, we've sent password reset instructions.
                    </p>
                    <Link href="/" className="text-blue-600 font-medium hover:underline">
                        Back to Sign In
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">Forgot Password?</h1>
                <p className="text-slate-500 mb-8">Enter your email to reset your password</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input {...register('email')} type="email" placeholder="you@example.com"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" loading={isSubmitting} className="w-full">Send Reset Link</Button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Remember your password?{' '}
                    <Link href="/" className="text-blue-600 font-medium hover:underline">Sign in</Link>
                </p>
            </div>
        </main>
    );
}
