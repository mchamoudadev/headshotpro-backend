import { paymentController } from "@/controllers";
import { authenticate } from "@/middleware";
import { Router } from "express";

const router = Router();


// public routes

router.get('/packages', paymentController.getCreditPackages);

router.use(authenticate);


// process payment

router.post('/process', paymentController.processPayment);
// Paymnet history
router.get('/history', authenticate, paymentController.getPaymentHistory);

export default router;