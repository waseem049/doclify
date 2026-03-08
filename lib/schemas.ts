import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password required'),
});

export const RegisterSchema = z.object({
    name: z.string().min(2, 'Min 2 characters').max(80),
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Min 8 characters')
        .regex(/[A-Z]/, 'Needs an uppercase letter')
        .regex(/[0-9]/, 'Needs a digit'),
});

export const ShareSchema = z.object({
    signerEmail: z.string().email("Enter the signer's email"),
});

export const RejectSchema = z.object({
    reason: z.string().min(10, 'Min 10 characters').max(500),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email('Valid email required'),
});

export const ResetPasswordSchema = z.object({
    password: z.string().min(8, 'Min 8 characters')
        .regex(/[A-Z]/, 'Needs an uppercase letter')
        .regex(/[a-z]/, 'Needs a lowercase letter')
        .regex(/[0-9]/, 'Needs a digit'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ShareInput = z.infer<typeof ShareSchema>;
export type RejectInput = z.infer<typeof RejectSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
