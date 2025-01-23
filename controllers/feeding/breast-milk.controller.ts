import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../../middleware/catcAsyncError';
import ErrorHandler from '../../utils/ErrorHandlers';
import Feeding from '../../models/feeding.model';
import Baby from '../../models/baby.model';
import { calculateBreastFeedingStats } from '../../utils/stats'; // Ensure this path is correct



export const createBreastFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, startTime, duration, breast } = req.body;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        // Tarih verisini ISO string'e çevir
        const newFeeding = {
            startTime: new Date(startTime).toISOString(),
            duration,
            breast
        };

        baby.breast_milk = baby.breast_milk || [];
        baby.breast_milk.push(newFeeding as any);
        await baby.save();

        // Güncel listeyi döndür
        const updatedBaby = await Baby.findById(babyId);

        res.status(201).json({
            success: true,
            feeding: newFeeding,
            breast_milk: updatedBaby?.breast_milk || []
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

        // Tarihleri yerel saat dilimine göre sırala
        const feedings = (baby.breast_milk || []).sort((a, b) => {
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });

        res.status(200).json({
            success: true,
            feedings,
            stats: calculateBreastFeedingStats(feedings)
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const deleteBreastFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, feedingId } = req.params;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        // breast_milk array'inden feeding'i kaldır
        const updateResult = await Baby.updateOne(
            { _id: babyId },
            { $pull: { breast_milk: { _id: feedingId } } }
        );

        if (updateResult.modifiedCount === 0) {
            return next(new ErrorHandler('Emzirme kaydı bulunamadı', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Emzirme kaydı başarıyla silindi'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});     