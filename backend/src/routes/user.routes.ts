import express from 'express';
import { register, login, logout } from '../controllers/user.controller';

const router = express.Router();

router.post('/register', register as express.RequestHandler);
router.post('/login', login as express.RequestHandler);
router.post('/logout', logout as express.RequestHandler);

export default router;