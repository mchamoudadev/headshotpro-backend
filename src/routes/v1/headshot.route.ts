import { headshotController } from "@/controllers";
import { authenticate, validate } from "@/middleware";
import { upload } from "@/middleware/upload.middleware";
import { uploadPhotoSchema } from "@/validators/headshot.validator";
import { Router } from "express";

const router = Router();

// all routes are protected
router.use(authenticate);

// Get available styles
router.get('/styles', headshotController.getAvailableStyles);

// Generate headshot
router.post('/generate', upload.single('photo'), validate(uploadPhotoSchema), headshotController.generateHeadshot);

// Get headshots
router.get('/', headshotController.getHeadshots);

// Delete headshot
router.delete('/:id', headshotController.deleteHeadshot);


export default router;