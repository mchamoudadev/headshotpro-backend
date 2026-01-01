import { Router } from "express";



import AuthRouter from "./auth.routes";
import PaymentRouter from "./payment.routes";
import HeadshotRouter from "./headshot.routes";
import AdminUserRouter from "./admin.user.routes";
import AdminOrderRouter from "./admin.order.routes";
import CoursesRouter from "./courses.route";
const router = Router();


router.use('/auth', AuthRouter);
router.use('/payment', PaymentRouter);
router.use('/headshots', HeadshotRouter);
router.use('/admin/users', AdminUserRouter);
router.use('/admin/orders', AdminOrderRouter);
router.use('/courses', CoursesRouter);
export default router;