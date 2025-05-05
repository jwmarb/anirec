import { BACKEND_URL } from '$/constants';
import { useAuthStore } from '$/providers/auth/store';
import { useQuery } from '@tanstack/react-query';

export type User = {
  _id: string;
  email: string;
  avatar: string | null;
  username: string;
  password: string;
  about: string;
  interests: string[];
  favorites: string[];
  contentSettings: ContentSettings;
};

export type NsfwContentSetting = 'blur' | 'hide' | 'show';

export type ContentSettings = {
  nsfwContent: NsfwContentSetting;
  model: string | null;
};

export default function useUser() {
  const token = useAuthStore((s) => s.token);

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ['user', token],
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

  return [data, isLoading] as const;
}
