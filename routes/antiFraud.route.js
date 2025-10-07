import { Router } from 'express';
import {
  checkCode,
  createAndSendCode,
  searchLead,
  sendToCrm,
} from '../controllers/antiFraud.controller.js';

const router = Router();

// поиск по номеру телефона и email
router.get('/', searchLead);
router.get('/save-and-send-code', createAndSendCode);
router.post('/check-code', checkCode);
router.post('/send-to-crm', sendToCrm);

export default router;
