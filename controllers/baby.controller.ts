import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../middleware/catcAsyncError';
import ErrorHandler from '../utils/ErrorHandlers';
import Baby from '../models/baby.model';
import cloudinary from 'cloudinary';

// Bebek ekleme
export const createBaby = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, gender, birthDate, weight, height, photo } = req.body;
        const userId = req.user._id;

        let photoData = undefined;

        if (photo) {
            const myCloud = await cloudinary.v2.uploader.upload(photo, {
                folder: 'babies',
                width: 150,
                height: 150,
                crop: "fill",
                quality: 70
            });

            photoData = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        }

        const baby = await Baby.create({
            name,
            gender,
            birthDate,
            weight,
            height,
            photo: photoData,
            userId
        });

        res.status(201).json({
            success: true,
            message: 'Bebek başarıyla eklendi',
            baby
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Kullanıcının bebeklerini getirme
export const getBabies = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const babies = await Baby.find({ userId })
            .select('name birthDate gender weight height photo vaccine_information')
            .lean();

        console.log('Babies from DB:', babies);

        res.status(200).json({
            success: true,
            babies
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getBabyById = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const baby = await Baby.findById(req.params.id);
    if (!baby) {
        return next(new ErrorHandler('Bebek bulunamadı', 404));
    }
    res.json({ success: true, baby });
});

export const deleteBaby = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.id;

    const baby = await Baby.findOne({ _id: id, parent: userId });

    if (!baby) {
        return next(new ErrorHandler('Bebek bulunamadı veya bu işlem için yetkiniz yok', 404));
    }

    await Baby.findByIdAndDelete(id);
    res.json({ success: true, message: 'Bebek başarıyla silindi' });
});

export const addVaccineInformation = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const vaccineInfo = req.body;

        const baby = await Baby.findById(id);

        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        // Kullanıcının bu bebeğe erişim yetkisi var mı kontrol et
        if (baby.userId.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler('Bu işlem için yetkiniz yok', 403));
        }

        const updatedBaby = await Baby.findByIdAndUpdate(
            id,
            { $push: { vaccine_information: vaccineInfo } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            baby: updatedBaby
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const deleteVaccineInformation = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, vaccineId } = req.params;

        const baby = await Baby.findById(id);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        // Kullanıcının yetkisi var mı kontrol et
        if (baby.userId.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler('Bu işlem için yetkiniz yok', 403));
        }

        // Aşı kaydını sil
        await Baby.findByIdAndUpdate(id, {
            $pull: { vaccine_information: { _id: vaccineId } }
        });

        res.status(200).json({
            success: true,
            message: 'Aşı kaydı başarıyla silindi'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});