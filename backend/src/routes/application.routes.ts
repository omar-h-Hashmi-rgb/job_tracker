import { Router } from 'express';
import * as applicationController from '../controllers/application.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All application routes are protected
router.use(authMiddleware);

router.get('/', applicationController.getApplications);
router.post('/', applicationController.createApplication);
router.put('/:id', applicationController.updateApplication);
router.delete('/:id', applicationController.deleteApplication);
router.post('/parse', applicationController.parseJD);
router.post('/stream-bullets', applicationController.streamBullets);

export default router;
