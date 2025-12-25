import { adminOrderController } from "@/controllers";
import { authenticate, authorize } from "@/middleware";
import { UserRole } from "@/models/User.model";
import { Router } from "express";


const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));


router.get('/', adminOrderController.getAllOrders);
router.post('/manual', adminOrderController.createManualOrder);
router.get('/packages', adminOrderController.getPackages);


export default router;