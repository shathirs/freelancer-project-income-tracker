import { Router } from 'express';
import {
  changePassword,
  login,
  me,
  register,
  updatePreferences,
  updateProfile,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, changePassword);
router.put('/preferences', requireAuth, updatePreferences);

export default router;