import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-5">
                            <div className="w-9 h-9 bg-gradient-to-br from-[#0f766e] to-[#14b8a6] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                D
                            </div>
                            <span className="text-xl font-bold text-white">DocSign</span>
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-400 mb-6">
                            Making PDF signing easy. Sign, edit and manage your documents with professional-grade security and speed.
                        </p>
                        <div className="flex gap-4">
                            {['twitter', 'linkedin', 'github'].map((social) => (
                                <a 
                                    key={social} 
                                    href="#" 
                                    className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                                >
                                    <span className="sr-only">{social}</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-semibold mb-5">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Enterprise</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-semibold mb-5">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-semibold mb-5">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
                        </ul>
                    </div>
                </div>
                
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p>© 2026 DocSign. All rights reserved.</p>
                    <p className="text-slate-500">Built with security in mind</p>
                </div>
            </div>
        </footer>
    );
}
