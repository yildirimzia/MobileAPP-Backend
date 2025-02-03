import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../../middleware/catcAsyncError';
import ErrorHandler from '../../utils/ErrorHandlers';
import Baby from '../../models/baby.model';
import mongoose from 'mongoose';

export const createSupplementFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, startTime, supplementType, amount, notes } = req.body;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const newFeeding = {
            _id: new mongoose.Types.ObjectId().toString(),
            startTime: new Date(startTime),
            supplementType,
            amount,
            notes
        };

        baby.supplement = baby.supplement || [];
        baby.supplement.push(newFeeding);
        await baby.save();

        res.status(201).json({
            success: true,
            feeding: newFeeding
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getSupplementFeedings = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId } = req.query;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const feedings = baby.supplement || [];

        res.status(200).json({
            success: true,
            feedings
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const deleteSupplementFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, feedingId } = req.params;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const updateResult = await Baby.updateOne(
            { _id: babyId },
            { $pull: { supplement: { _id: feedingId } } }
        );

        if (updateResult.modifiedCount === 0) {
            return next(new ErrorHandler('Takviye kaydı bulunamadı', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Takviye kaydı başarıyla silindi'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
