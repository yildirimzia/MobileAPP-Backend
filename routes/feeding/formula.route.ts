import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import {
    createFormulaFeeding,
    getFormulaFeedings,
    deleteFormulaFeeding
} from '../../controllers/feeding/formula.controller';

const formulaRouter = express.Router();

formulaRouter.post('/feeding/formula/create', isAuthenticated, createFormulaFeeding);
formulaRouter.get('/feeding/formula/list', isAuthenticated, getFormulaFeedings);
formulaRouter.delete('/feeding/formula/:babyId/:feedingId', isAuthenticated, deleteFormulaFeeding);

export default formulaRouter; 