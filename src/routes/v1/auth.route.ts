import { Router } from "express";
import { register } from "@/controllers";
import { registerSchema } from "@/validators/auth.validator";
import { validate } from "@/middleware/validation.middleware";

const authRoute = Router();


authRoute.post('/register', validate(registerSchema), register)

authRoute.get('/logout', (req, res) => {
    res.json({
        message: "Logged out",
    })
})

export default authRoute;