import { Router } from 'express';
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from '../controllers/client.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;