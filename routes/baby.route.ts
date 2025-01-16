import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { createBaby, getBabies } from '../controllers/baby.controller';

const babyRouter = express.Router();

babyRouter.post('/baby/create', isAuthenticated, createBaby);
babyRouter.get('/baby/list', isAuthenticated, getBabies);

export default babyRouter;