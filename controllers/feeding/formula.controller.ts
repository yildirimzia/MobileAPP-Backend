import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../../middleware/catcAsyncError';
import ErrorHandler from '../../utils/ErrorHandlers';
import Baby from '../../models/baby.model';

export const createFormulaFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, startTime, amount, brand, notes } = req.body;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const newFeeding = {
            startTime: new Date(startTime),
            amount, // ml cinsinden
            brand,
            notes
        };

        baby.formula_milk = baby.formula_milk || [];
        baby.formula_milk.push(newFeeding);
        await baby.save();

        res.status(201).json({
            success: true,
            feeding: newFeeding
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getFormulaFeedings = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId } = req.query;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const feedings = baby.formula_milk || [];

        res.status(200).json({
            success: true,
            feedings
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const deleteFormulaFeeding = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, feedingId } = req.params;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const updateResult = await Baby.updateOne(
            { _id: babyId },
            { $pull: { formula_milk: { _id: feedingId } } }
        );

        if (updateResult.modifiedCount === 0) {
            return next(new ErrorHandler('Mama kaydı bulunamadı', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Mama kaydı başarıyla silindi'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
}); 