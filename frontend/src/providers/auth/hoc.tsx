import { BACKEND_URL } from '$/constants';
import { useAuthStore } from '$/providers/auth/store';
import { UserState } from '$/providers/user/store';
import { useQuery } from '@tanstack/react-query';
import React, { JSX } from 'react';
import { Navigate } from 'react-router';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function withProtectedRoute<T extends JSX.IntrinsicAttributes>(WrappedComponent: React.ComponentType<T>) {
  return function ProtectedRoute(props: T) {
    const { token } = useAuthStore();

    const { data, isLoading } = useQuery({
      queryKey: ['auth', token],
      queryFn: () => {
        if (token == null)
          return {
            isAuthenticated: false,
          };
        return fetch(`${BACKEND_URL}/api/auth/verify`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => d.data as { isAuthenticated: false } | ({ isAuthenticated: true } & UserState));
      },
      enabled: token != null,
      retry: false,
    });
    if (isLoading) {
      return null;
    }
    if (!data?.isAuthenticated) {
      return <Navigate to='/' replace />;
    }
    return <WrappedComponent {...props} />;
  };
}
