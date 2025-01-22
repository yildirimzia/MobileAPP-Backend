import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../../middleware/catcAsyncError';
import ErrorHandler from '../../utils/ErrorHandlers';
import Feeding from '../../models/feeding.model';
import Baby from '../../models/baby.model';
import { calculateBreastFeedingStats } from '../../utils/stats'; // Ensure this path is correct



export const createBreastFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, startTime, duration, breast } = req.body;

        // Bebeği bul
        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        // Emzirme kaydını bebeğin verilerine ekle
        const newFeeding = {
            startTime: new Date(startTime),
            duration,
            breast
        };

        baby.breast_milk = baby.breast_milk || [];
        baby.breast_milk.push(newFeeding);
        await baby.save();

        res.status(201).json({
            success: true,
            feeding: newFeeding
        });
    } catch (error: any) {
        console.error('Hata:', error);
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getBreastFeedings = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId } = req.query;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const feedings = baby.breast_milk || [];

        // İstatistikleri hesapla
        const stats = calculateBreastFeedingStats(feedings);

        res.status(200).json({
            success: true,
            feedings,
            stats
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
}); 