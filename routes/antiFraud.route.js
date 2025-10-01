import { Router } from 'express';
import { checkCode, createAndSendCode, searchLead } from '../controllers/antiFraud.controller.js';

const router = Router();

// поиск по номеру телефона и email
router.get('/', searchLead);
router.get('/save-and-send-code', createAndSendCode);
router.post('/check-code', checkCode);

export default router;
