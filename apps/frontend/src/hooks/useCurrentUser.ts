import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const fetchCurrentUser = async () => {
  const res = await apiFetch('/api/users/me');
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    retry: 1,
  });
};
