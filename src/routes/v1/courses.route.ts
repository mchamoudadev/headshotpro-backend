import { paymentController } from "@/controllers";
import { Router } from "express";

const router = Router();

// Temporray use paymentController for now

router.get('/:id', paymentController.getCourseById);


export default router;