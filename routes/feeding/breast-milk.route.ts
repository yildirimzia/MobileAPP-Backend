import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import { createBreastFeeding, getBreastFeedings } from '../../controllers/feeding/breast-milk.controller';

const breastMilkRouter = express.Router();

breastMilkRouter.post('/feeding/breast-milk/create', isAuthenticated, createBreastFeeding);
breastMilkRouter.get('/feeding/breast-milk/list', isAuthenticated, getBreastFeedings);

export default breastMilkRouter;

