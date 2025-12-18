'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ClientLoadingScreen } from './ClientLoadingScreen';

interface ClientPageWrapperProps {
  children: React.ReactNode;
}

export function ClientPageWrapper({ children }: ClientPageWrapperProps) {
  const { status } = useSession();
  const router = useRouter();

  // Only show loading screen during initial authentication check
  // Once authenticated, don't show loading screen anymore
  if (status === 'loading') {
    return <ClientLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return <ClientLoadingScreen />;
  }

  // User is authenticated, show content immediately
  return <>{children}</>;
}

