import type {
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  UserDto,
} from '@/api/sdk';
import useAuth from '@/hooks/use-auth';
import type {
  QueryObserverResult,
  RefetchOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  user: UserDto | null; // Replace with your user type
  mutateLogin:
    | UseMutationResult<
        AxiosResponse<LoginResponseDto, any, {}>,
        Error,
        LoginDto,
        unknown
      >
    | undefined; // Replace with the actual type of your mutateLogin function
  mutateRegister:
    | UseMutationResult<
        AxiosResponse<void, any, {}>,
        Error,
        RegisterDto,
        unknown
      >
    | undefined; // Replace with the actual type of your mutateRegister function
  isPendingUser: boolean;
  refetchUser:
    | ((
        options?: RefetchOptions | undefined,
      ) => Promise<QueryObserverResult<AxiosResponse<UserDto, any, {}>, Error>>)
    | undefined; // Replace with the actual type of your refetchUser function,
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  accessToken: '',
  isAuthenticated: false,
  setAccessToken: () => {},
  user: null,
  mutateLogin: undefined,
  mutateRegister: undefined,
  isPendingUser: false,
  refetchUser: undefined,
  logout: () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const contextVal = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!contextVal.isAuthenticated) {
      console.log('User is not authenticated, redirecting to login page');
      navigate({
        pathname: '/login',
      });
    }
  }, [contextVal.isAuthenticated]);

  return (
    <AuthContext.Provider value={contextVal}>{children}</AuthContext.Provider>
  );
};
