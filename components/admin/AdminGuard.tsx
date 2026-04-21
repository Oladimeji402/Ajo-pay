'use client';

import React, { useEffect, useState } from 'react';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const authStatus = await isAdminAuthenticated();
            if (!authStatus) {
                window.location.href = '/admin-login';
            } else {
                setIsAuthenticated(true);
            }
        };

        void checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light">
                <div className="w-16 h-16 bg-brand-navy rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-brand-navy/20">
                    <span className="text-white font-bold text-2xl">A</span>
                </div>
                <div className="flex items-center gap-2 text-brand-navy font-semibold">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying admin session...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
