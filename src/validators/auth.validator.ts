
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


export type registerInput = z.infer<typeof registerSchema>;