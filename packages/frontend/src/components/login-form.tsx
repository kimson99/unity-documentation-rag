import type { LoginDto } from '@/api/sdk';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/providers/auth-provider';
import { emailRegex } from '@/utils/regex';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { mutateLogin, user, isAuthenticated } = useAuthContext();

  const { register, handleSubmit, formState } = useForm<LoginDto>({
    disabled: mutateLogin?.isPending ?? false,
  });

  const { errors } = formState;

  useEffect(() => {
    if (!mutateLogin?.error) return;

    if (mutateLogin.error instanceof AxiosError) {
      toast.error(mutateLogin.error.response?.data?.message);
      return;
    }

    toast.error(
      mutateLogin.error?.message || 'An error occurred while logging in',
    );
  }, [mutateLogin?.error]);

  const navigate = useNavigate();

  const onSubmit = (data: LoginDto) => {
    console.log('Submitting login form with data:', {
      email: data.email,
      password: '*'.repeat(data.password.length),
    });
    mutateLogin?.mutate(data);
  };

  useEffect(() => {
    if (mutateLogin?.isSuccess && user && isAuthenticated) {
      console.log('Login successful, navigating to home page');
      navigate({
        pathname: '/',
      });
      setTimeout(() => {
        toast.success('Login successful!');
      }, 500);
    }
  }, [mutateLogin?.isSuccess, navigate, isAuthenticated, user]);

  if (!mutateLogin) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: emailRegex,
                      message: 'Invalid email address',
                    },
                  })}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                {errors.password && (
                  <FieldDescription className="text-red-500">
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                <Button variant="outline" type="button">
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
