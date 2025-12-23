import { paymentController } from "@/controllers";
import { authenticate } from "@/middleware";
import { Router } from "express";

const router = Router();


// public routes

router.get('/packages', paymentController.getCreditPackages);

router.use(authenticate);


// process payment

router.post('/process', paymentController.processPayment)


export default router;