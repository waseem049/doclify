'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import Spinner from './Spinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isHydrated && !user) router.push('/');
    }, [isHydrated, user, router]);

    if (!isHydrated) return (
        <div className="min-h-screen flex items-center justify-center">
            <Spinner size="lg" />
        </div>
    );

    if (!user) return null;
    return <>{children}</>;
}
