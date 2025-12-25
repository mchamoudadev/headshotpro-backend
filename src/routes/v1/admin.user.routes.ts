import { adminUserController } from "@/controllers";
import { getAllUsers } from "@/controllers/admin.user.controller";
import { authenticate, authorize } from "@/middleware";
import { UserRole } from "@/models/User.model";
import { Router } from "express";


const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/', adminUserController.getAllUsers);
router.put('/role', adminUserController.updateUserRole);
router.delete('/:userId', adminUserController.deleteUser);
router.post('/credits', adminUserController.addCredits);

export default router;