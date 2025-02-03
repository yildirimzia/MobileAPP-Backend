import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import { createSupplementFeeding, getSupplementFeedings, deleteSupplementFeeding } from '../../controllers/feeding/supplement.controller';

const supplementRouter = express.Router();

supplementRouter.post('/feeding/supplement/create', isAuthenticated, createSupplementFeeding);
supplementRouter.get('/feeding/supplement/list', isAuthenticated, getSupplementFeedings);
supplementRouter.delete('/feeding/supplement/:babyId/:feedingId', isAuthenticated, deleteSupplementFeeding);

export default supplementRouter; 