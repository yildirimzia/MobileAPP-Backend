
import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import {
    createSolidFoodFeeding,
    getSolidFoodFeedings,
    deleteSolidFoodFeeding
} from '../../controllers/feeding/solid-food.controller';

const solidFoodRouter = express.Router();

solidFoodRouter.post('/feeding/solid-food/create', isAuthenticated, createSolidFoodFeeding);
solidFoodRouter.get('/feeding/solid-food/list', isAuthenticated, getSolidFoodFeedings);
solidFoodRouter.delete('/feeding/solid-food/:babyId/:feedingId', isAuthenticated, deleteSolidFoodFeeding);

export default solidFoodRouter; 