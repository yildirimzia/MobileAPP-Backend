import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import {
    createSnackFeeding,
    getSnackFeedings,
    deleteSnackFeeding
} from '../../controllers/feeding/snacks.controller';

const snacksRouter = express.Router();

snacksRouter.post('/feeding/snacks/create', isAuthenticated, createSnackFeeding);
snacksRouter.get('/feeding/snacks/list', isAuthenticated, getSnackFeedings);
snacksRouter.delete('/feeding/snacks/:babyId/:feedingId', isAuthenticated, deleteSnackFeeding);

export default snacksRouter;
