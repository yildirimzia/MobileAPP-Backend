import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import {
    addGrowthRecord,
    getRecords,
    deleteGrowthRecord
} from '../controllers/growth.controller';

const growthRouter = express.Router();

growthRouter.post('/growth/add', isAuthenticated, addGrowthRecord);
growthRouter.get('/growth/:babyId', isAuthenticated, getRecords);
growthRouter.delete('/growth/:babyId/:recordId', isAuthenticated, deleteGrowthRecord);

export default growthRouter; 