import express from 'express';
import { create, getAll, getById, update, remove, seedSampleData } from '../controllers/chargingStation.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', protect as express.RequestHandler, create as express.RequestHandler);
router.get('/', protect as express.RequestHandler, getAll as express.RequestHandler);
router.get('/:id', protect as express.RequestHandler, getById as express.RequestHandler);
router.put('/:id', protect as express.RequestHandler, update as express.RequestHandler);
router.delete('/:id', protect as express.RequestHandler, remove as express.RequestHandler);
router.post('/seed', seedSampleData as express.RequestHandler);

export default router;