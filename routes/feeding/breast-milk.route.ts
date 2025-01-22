import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import {
    createBreastFeeding,
    getBreastFeedings,
    deleteBreastFeeding
} from '../../controllers/feeding/breast-milk.controller';

const breastMilkRouter = express.Router();

breastMilkRouter.post('/feeding/breast-milk/create', isAuthenticated, createBreastFeeding);
breastMilkRouter.get('/feeding/breast-milk/list', isAuthenticated, getBreastFeedings);
breastMilkRouter.delete('/feeding/breast-milk/:babyId/:feedingId', isAuthenticated, deleteBreastFeeding);

export default breastMilkRouter;

