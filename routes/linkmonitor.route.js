import { Router } from 'express';
import {
  addLink,
  createLink,
  deleteLink,
  getLinks,
  tgWebHook,
} from '../controllers/linkMonitor.controller.js';

const router = Router();

router.post('/create-link', createLink);
router.post('/tg-webhook', tgWebHook);
router.post('/add-link', addLink);
router.post('/get-links', getLinks);
router.delete('/delete', deleteLink);

export default router;
