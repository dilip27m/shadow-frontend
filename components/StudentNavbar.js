'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function StudentNavbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="border-b border-[var(--border)] p-4 sticky top-0 bg-black/80 backdrop-blur-md z-50">
            <div className="max-w-2xl mx-auto flex justify-between items-center">

                <Link href="/" className="text-lg font-bold tracking-tight">
                    SHADOW
                </Link>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex flex-col gap-1"
                >
                    <span className={`w-5 h-0.5 bg-white transition-transform ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                    <span className={`w-5 h-0.5 bg-white transition-opacity ${isOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`w-5 h-0.5 bg-white transition-transform ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </button>
            </div>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-3">
                    <Link href="/" onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white">
                        Home
                    </Link>
                    <Link href="/admin/login" onClick={() => setIsOpen(false)} className="text-sm text-[var(--text-dim)] hover:text-white">
                        Admin Login
                    </Link>
                </div>
            )}
        </nav>
    );
}
