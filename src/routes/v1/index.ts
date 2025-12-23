import { Router } from "express";


import router from "./auth.route";
import paymentRoute from "./payment.route";
import headshotRoute from "./headshot.route";


router.use('/auth', router);
router.use('/payment', paymentRoute);
router.use('/headshots', headshotRoute);

export default router;