import express from 'express';
import { getAiResponse } from '../controllers/ai.controller';

const router = express.Router();

router.post('/ai/response', getAiResponse);

export default router; 