import { client } from '@/api/client';
import type { LoginDto, RegisterDto } from '@/api/sdk';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mutateRegister = useMutation({
    mutationFn: async (dto: RegisterDto) => {
      return client.api.authControllerRegister(dto);
    },
  });

  const mutateLogin = useMutation({
    mutationFn: async (dto: LoginDto) => {
      return client.api.authControllerSignIn(dto);
    },
    onSuccess: () => {
      setIsAuthenticated(true);
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  return {
    isAuthenticated,
    mutateRegister,
    mutateLogin,
  };
};

export default useAuth;
