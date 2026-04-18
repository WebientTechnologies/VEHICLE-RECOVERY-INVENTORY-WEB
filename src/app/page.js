"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        if (user.role === 'yard-staff') {
          router.push('/yard-staff');
        } else if (user.role === 'office-staff') {
          router.push('/office-staff');
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <div className="loader">Loading...</div>
    </div>
  );
}
