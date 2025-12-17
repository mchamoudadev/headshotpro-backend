
import {z} from "zod";


export const registerSchema= z.object({

    email: z.email({error: "Invalid email address"}).trim().toLowerCase(),
    password: z.string()
    .min(8, {message: "Password must be at least 8 characters long"})
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

    name: z.string().trim().optional()


})


/**
 * Verify email schema - validates req.query
 */
export const verifyEmailSchema = z.object({
    token: z.string({ error: 'Verification token is required' }).min(1),
});

export const resendVerificationSchema = z.object({
    email: z.email({ error: 'Email is required' }).trim().toLowerCase(),
});

export const loginSchema = z.object({
    email: z.email({ error: 'Email is required' }).trim().toLowerCase(),
    password: z.string({ error: 'Password is required' }).min(1),
});


export type registerInput = z.infer<typeof registerSchema>;
export type verifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type resendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type loginInput = z.infer<typeof loginSchema>;