import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../middleware/catcAsyncError';
import ErrorHandler from '../utils/ErrorHandlers';
import Baby from '../models/baby.model';
import mongoose from 'mongoose';

export const addGrowthRecord = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, date, weight, height, notes } = req.body;
        console.log('Received data:', req.body); // Debug için

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const newRecord = {
            _id: new mongoose.Types.ObjectId().toString(),
            date: new Date(date),
            weight: Number(weight),
            height: Number(height),
            notes
        };

        // growth_tracking array'ini kontrol et ve oluştur
        if (!baby.growth_tracking) {
            baby.growth_tracking = [];
        }

        baby.growth_tracking.push(newRecord);
        await baby.save();

        console.log('Saved record:', newRecord); // Debug için

        res.status(201).json({
            success: true,
            record: newRecord
        });
    } catch (error: any) {
        console.error('Error saving growth record:', error); // Debug için
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getRecords = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId } = req.params;
        const baby = await Baby.findById(babyId);

        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        res.status(200).json({
            success: true,
            records: baby.growth_tracking || []  // records array'i döndürüyoruz
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const deleteGrowthRecord = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId, recordId } = req.params;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        const updateResult = await Baby.updateOne(
            { _id: babyId },
            { $pull: { growth_tracking: { _id: recordId } } }
        );

        if (updateResult.modifiedCount === 0) {
            return next(new ErrorHandler('Büyüme kaydı bulunamadı', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Büyüme kaydı başarıyla silindi'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
}); 