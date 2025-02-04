import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../middleware/catcAsyncError';
import ErrorHandler from '../utils/ErrorHandlers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export const getAiResponse = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, babyAge, babyGender } = req.body;

        const prompt = `Sen bir pediatri uzmanısın. ${babyAge} aylık ${babyGender === 'female' ? 'kız' : 'erkek'} 
        bebeği olan bir ebeveyne yanıt veriyorsun.
        Soru: ${question}
        Lütfen kısa, net ve bilimsel kaynaklara dayanan bir yanıt ver.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.status(200).json({
            success: true,
            response
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
}); 