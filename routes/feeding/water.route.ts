
import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import { createWaterFeeding, getWaterFeedings, deleteWaterFeeding } from '../../controllers/feeding/water.controller';

const waterRouter = express.Router();

waterRouter.post('/feeding/water/create', isAuthenticated, createWaterFeeding);
waterRouter.get('/feeding/water/list', isAuthenticated, getWaterFeedings);
waterRouter.delete('/feeding/water/:babyId/:feedingId', isAuthenticated, deleteWaterFeeding);

export default waterRouter;     // This is the only difference between the two files. The other differences are in the import statements and the function calls.        