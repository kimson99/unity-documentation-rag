import { useAuthContext } from '@/providers/auth-provider';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User is not authenticated, redirecting to login page');
      window.location.href = '/login';
    }
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col h-full justify-end items-center p-4"></div>
  );
}
