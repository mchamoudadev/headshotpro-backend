import { Router } from "express";


import router from "./auth.route";
import paymentRoute from "./payment.route";


router.use('/auth', router);
router.use('/payment', paymentRoute);


export default router;