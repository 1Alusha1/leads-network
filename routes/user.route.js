import { Router } from 'express';
import {
  checkAuth,
  getUser,
  login,
  register,
} from '../controllers/user.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/checkAuth', checkAuth);
router.post('/getUser', getUser);

export default router;
