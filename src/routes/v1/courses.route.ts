import { paymentController } from "@/controllers";
import { authenticate } from "@/middleware";
import { Router } from "express";

const router = Router();


// public routes

// Temporray use paymentController for now

router.get('/:id', paymentController.getCourseById);


export default router;