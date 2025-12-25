import { Router } from "express";
import { authController } from "@/controllers";
import { loginSchema, registerSchema, resendVerificationSchema, verifyEmailSchema } from "@/validators/auth.validator";

import { authenticate, validate, validateQuery } from "@/middleware";

const authRoute = Router();


authRoute.post('/register', validate(registerSchema), authController.register)
authRoute.get('/verify-email', validateQuery(verifyEmailSchema),authController.verifyEmail)

authRoute.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerificationEmail)

authRoute.post('/login', validate(loginSchema), authController.login)

authRoute.get('/me',authenticate, authController.getCurrentUser)

authRoute.post('/refresh-token', authController.refreshToken)

authRoute.post('/logout', authenticate, authController.logout)

export default authRoute;