import { Router } from 'express';
import { signup, login, verifyToken } from '../controllers/userAuthHandler.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify', verifyToken);

export default router;
