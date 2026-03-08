'use client';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import Button from '@/components/ui/Button';

export default function HomeNavbar() {
    const { user, logout } = useAuthStore();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/60">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#0f766e] to-[#14b8a6] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <span className="text-white font-bold text-lg">D</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800">DocSign</span>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    {[
                        { label: 'Features', href: '#features' },
                        { label: 'Pricing', href: '#pricing' },
                        { label: 'Business', href: '#business' },
                    ].map((item) => (
                        <Link 
                            key={item.label} 
                            href={item.href}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-all"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="text-slate-600">Dashboard</Button>
                            </Link>
                            <Button onClick={logout} variant="outline" size="sm">Logout</Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="text-slate-600">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-[#0f766e] hover:bg-[#0d5d56] text-white shadow-md hover:shadow-lg">
                                    Sign Up Free
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
