'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import api from '@/lib/api';
import { ResetPasswordSchema, type ResetPasswordInput } from '@/lib/schemas';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    const { register, handleSubmit, formState: { errors, isSubmitting } } =
        useForm<ResetPasswordInput>({ resolver: zodResolver(ResetPasswordSchema) });

    const onSubmit = async (data: ResetPasswordInput) => {
        try {
            setError('');
            await api.post('/api/auth/reset-password', { token, password: data.password });
            setSuccess(true);
            setTimeout(() => router.push('/'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Failed to reset password');
        }
    };

    if (!token) {
        return (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Link</h2>
                <p className="text-slate-500">This password reset link is invalid or expired.</p>
                <Link href="/forgot-password" className="inline-block mt-4 text-blue-600 hover:underline">
                    Request a new reset link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Password Reset!</h2>
                <p className="text-slate-500">Your password has been reset successfully. Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Reset Password</h1>
            <p className="text-slate-500 mb-8">Enter your new password</p>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input {...register('password')} type="password" placeholder="••••••••"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                    <input {...register('confirmPassword')} type="password" placeholder="••••••••"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" loading={isSubmitting} className="w-full">Reset Password</Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <Link href="/" className="text-blue-600 font-medium hover:underline">Sign in</Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 p-4">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <Spinner size="lg" />
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
