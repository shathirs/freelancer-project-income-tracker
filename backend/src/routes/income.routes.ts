import { Router } from 'express';
import {
  createIncome,
  deleteIncome,
  listIncome,
  updateIncome,
} from '../controllers/income.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listIncome);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;
