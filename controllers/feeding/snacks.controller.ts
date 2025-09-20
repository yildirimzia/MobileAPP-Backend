import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../../middleware/catcAsyncError';
import ErrorHandler from '../../utils/ErrorHandlers';
import Baby from '../../models/baby.model';
import mongoose from 'mongoose';

export const createSnackFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, startTime, snackType, amount, notes } = req.body;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const newFeeding = {
            _id: new mongoose.Types.ObjectId().toString(),
            startTime: new Date(startTime),
            snackType,
            amount,
            notes
        };

        baby.snacks = baby.snacks || [];
        baby.snacks.push(newFeeding);
        await baby.save();


        res.status(201).json({
            success: true,
            feeding: newFeeding
        });
    } catch (error: any) {
        console.error('Error in createSnackFeeding:', error);
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getSnackFeedings = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId } = req.query;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const feedings = (baby.snacks || []).sort((a, b) => {
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });


        res.status(200).json({
            success: true,
            feedings
        });
    } catch (error: any) {
        console.error('Error in getSnackFeedings:', error);
        return next(new ErrorHandler(error.message, 400));
    }
});

export const deleteSnackFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, feedingId } = req.params;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const updateResult = await Baby.updateOne(
            { _id: babyId },
            { $pull: { snacks: { _id: feedingId } } }
        );

        if (updateResult.modifiedCount === 0) {
            return next(new ErrorHandler('Atıştırmalık kaydı bulunamadı', 404));
        }


        res.status(200).json({
            success: true,
            message: 'Atıştırmalık kaydı başarıyla silindi'
        });
    } catch (error: any) {
        console.error('Error in deleteSnackFeeding:', error);
        return next(new ErrorHandler(error.message, 400));
    }
}); 