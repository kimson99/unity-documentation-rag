import { client } from '@/api/client';
import type { LoginDto, RegisterDto } from '@/api/sdk';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import useAuthToken from './stores/use-auth-token';
import useUser from './stores/use-user';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        setIsAuthenticated(true);
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
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (accessToken) {
    }
  }, [accessToken]);

  useEffect(() => {
    console.log(accessToken);
    setIsAuthenticated(!!accessToken);
  }, []);

  return {
    isAuthenticated,
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
