import React from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminRouteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            <AdminLayout>
                {children}
            </AdminLayout>
        </AdminGuard>
    );
}
