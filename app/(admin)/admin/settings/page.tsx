'use client';

import React, { useEffect, useState } from 'react';
import { getAdminEmail } from '@/lib/admin-auth';

export default function AdminSettingsPage() {
    const [email, setEmail] = useState('');

    useEffect(() => {
        const run = async () => {
            const value = await getAdminEmail();
            setEmail(value ?? 'Unknown');
        };
        void run();
    }, []);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-brand-navy">Admin Settings</h1>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm">
                <p className="text-xs text-brand-gray">Signed in admin</p>
                <p className="font-bold text-brand-navy">{email}</p>
            </div>
        </div>
    );
}
