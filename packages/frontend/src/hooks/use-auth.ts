import { client } from '@/api/client';
import type { LoginDto, RegisterDto } from '@/api/sdk';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import useAuthToken from './stores/use-auth-token';
import useUser from './stores/use-user';

const useAuth = () => {
  const { accessToken, setAccessToken } = useAuthToken();
  const { user, setUser } = useUser();

  const mutateRegister = useMutation({
    mutationFn: async (dto: RegisterDto) => {
      return client.api.authControllerRegister(dto);
    },
  });

  const mutateLogin = useMutation({
    mutationFn: async (dto: LoginDto) => {
      return client.api.authControllerSignIn(dto);
    },
    onSuccess: ({ data }) => {
      if (data) {
        setAccessToken(data.accessToken);
      }
    },
  });

  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await client.api.userControllerGetMe({});
      setUser(user.data);
      return user;
    },
    enabled: !!accessToken,
    retry: 3,
    retryDelay: 1000,
  });

  const logout = () => {
    setAccessToken(null);
    setUser(null);
  };

  useEffect(() => {
    const error = userQuery.error;
    if (error && error instanceof AxiosError) {
      if (error.status === 401) {
        console.log('Unauthorized, logging out');
        logout();
      }
    }
  }, [userQuery.error]);

  return {
    isAuthenticated: !!accessToken,
    mutateRegister,
    mutateLogin,
    accessToken,
    setAccessToken,
    user,
    refetchUser: userQuery.refetch,
    isPendingUser: userQuery.isPending,
    logout,
  };
};

export default useAuth;
