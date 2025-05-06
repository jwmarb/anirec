import { BACKEND_URL } from '$/constants';
import { User } from '$/hooks/useUser';
import { useAuthStore } from '$/providers/auth/store';
import { useQuery } from '@tanstack/react-query';
import React, { JSX } from 'react';
import { Navigate } from 'react-router';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function withProtectedRoute<T extends JSX.IntrinsicAttributes>(WrappedComponent: React.ComponentType<T>) {
  return function ProtectedRoute(props: T) {
    const token = useAuthStore((s) => s.token);

    const { data, isLoading } = useQuery<User | null>({
      queryKey: [token],
      queryFn: async () => {
        try {
          if (!token) return null;
          const res = await fetch(`${BACKEND_URL}/api/user`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          const r = await res.json();
          if (r.data.success) {
            return r.data.user;
          }
          return null;
        } catch {
          return null;
        }
      },
    });
    if (!data && !isLoading) {
      return <Navigate to='/' replace />;
    }

    return <WrappedComponent {...props} />;
  };
}
