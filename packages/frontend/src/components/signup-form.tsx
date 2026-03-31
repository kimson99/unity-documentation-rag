import type { RegisterDto } from '@/api/sdk';
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
import useAuth from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface RegisterFormData extends RegisterDto {
  confirmPassword: string;
}

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const { mutateRegister } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    disabled: mutateRegister.isPending,
  });

  const navigate = useNavigate();

  if (mutateRegister.isError) {
    toast.error('Registration failed. Please try again.');
  }

  const onSubmit = (data: RegisterFormData) => {
    mutateRegister.mutate(data);
  };

  useEffect(() => {
    if (mutateRegister.isSuccess) {
      navigate({
        pathname: '/login',
      });
      setTimeout(() => {
        toast.success('Registration successful! You can now log in.');
      }, 500);
    }
  }, [mutateRegister.isSuccess, navigate]);

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                {...register('displayName')}
              />
            </Field>
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
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <FieldDescription className="text-red-500">
                  {errors.email.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
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
                  pattern: {
                    value:
                      /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
                    message:
                      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
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
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                required
                {...register('confirmPassword', {
                  required: 'Password is required',
                  validate: (value) =>
                    value === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <FieldDescription className="text-red-500">
                  {errors.confirmPassword.message}
                </FieldDescription>
              )}
            </Field>
            <FieldGroup>
              <Field>
                <Button disabled={mutateRegister.isPending} type="submit">
                  Create Account
                </Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="#">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
