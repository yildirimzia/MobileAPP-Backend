import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { createBaby, getBabies, getBabyById, deleteBaby } from '../controllers/baby.controller';

const babyRouter = express.Router();

babyRouter.post('/create', isAuthenticated, createBaby);
babyRouter.get('/list', isAuthenticated, getBabies);
babyRouter.get('/detail/:id', isAuthenticated, getBabyById);
babyRouter.delete('/:id', isAuthenticated, deleteBaby);

export default babyRouter;