import { AuthLayout } from '@/components/layout/AuthLayout';
import { ReactNode } from 'react';

export default function AuthenticationLayout({ children }: { children: ReactNode }) {
    return (
        <AuthLayout>
            {children}
        </AuthLayout>
    );
}
