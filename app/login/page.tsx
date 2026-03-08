'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { FileSignature, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { LoginSchema, type LoginInput } from '@/lib/schemas';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await api.post('/api/auth/login', data);
      setAuth(res.data.data.user, res.data.data.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError('root', { message: err.response?.data?.message ?? 'Login failed' });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pattern-dots opacity-30" />
      <div className="fixed top-20 left-20 w-[300px] h-[300px] bg-gradient-to-br from-teal-100 to-white rounded-full blur-3xl opacity-50 -z-10" />
      <div className="fixed bottom-20 right-20 w-[400px] h-[400px] bg-gradient-to-tl from-orange-50 to-white rounded-full blur-3xl opacity-50 -z-10" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0f766e] to-[#14b8a6] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              D
            </div>
            <span className="text-2xl font-bold text-slate-800">DocSign</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Log in to manage your documents</p>
        </div>

        {errors.root && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-semibold border border-red-100">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                {...register('email')} 
                type="email" 
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#0f766e]/10 focus:border-[#0f766e] focus:bg-white outline-none transition-all font-medium" 
              />
            </div>
            {errors.email && <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                {...register('password')} 
                type="password" 
                placeholder="Enter your password"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#0f766e]/10 focus:border-[#0f766e] focus:bg-white outline-none transition-all font-medium" 
              />
            </div>
            {errors.password && <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>}
          </div>
          
          <Button 
            type="submit" 
            loading={isSubmitting} 
            className="w-full bg-[#0f766e] hover:bg-[#0d5d56] py-4 rounded-xl font-semibold text-base shadow-lg shadow-teal-200"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <Link href="/forgot-password" className="block text-sm font-medium text-slate-500 hover:text-[#0f766e] transition-colors">
            Forgot your password?
          </Link>
          <p className="text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#0f766e] font-semibold hover:underline">Create for free</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
