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
        const babies = await Baby.find({ userId: req.user?._id })
            .populate('formula')  // Formülü populate edelim
            .select('+formula'); // Formula alanını seçelim

        console.log('Backend babies:', JSON.stringify(babies, null, 2)); // Debug için

        res.status(200).json({
            success: true,
            babies: babies
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

export const addAllergyInformation = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId } = req.params;
        const { allergy_name, discovery_date, symptoms } = req.body;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        if (!baby.allergy_information) {
            baby.allergy_information = [];
        }

        const newAllergy = {
            allergy_name,
            discovery_date,
            symptoms
        };

        baby.allergy_information.push(newAllergy);
        await baby.save();

        res.status(200).json({
            success: true,
            message: 'Alerji bilgisi başarıyla eklendi',
            allergy: newAllergy
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const deleteAllergyInformation = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, allergyId } = req.params;

        const baby = await Baby.findById(id);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        // Kullanıcının yetkisi var mı kontrol et
        if (baby.userId.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler('Bu işlem için yetkiniz yok', 403));
        }

        // Alerji kaydını sil
        await Baby.findByIdAndUpdate(id, {
            $pull: { allergy_information: { _id: allergyId } }
        });

        res.status(200).json({
            success: true,
            message: 'Alerji kaydı başarıyla silindi'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const addTeethInformation = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { babyId } = req.params;
        const { tooth_id, tooth_name, tooth_type, date } = req.body;

        const baby = await Baby.findById(babyId);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        if (!baby.teeth_information) {
            baby.teeth_information = [];
        }

        const newTooth = {
            tooth_id,
            tooth_name,
            tooth_type,
            date
        };

        baby.teeth_information.push(newTooth);
        await baby.save();

        res.status(200).json({
            success: true,
            message: 'Diş bilgisi başarıyla eklendi',
            tooth: newTooth
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const deleteTeethInformation = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, teethId } = req.params;

        const baby = await Baby.findById(id);
        if (!baby) {
            return next(new ErrorHandler('Bebek bulunamadı', 404));
        }

        // Kullanıcının yetkisi var mı kontrol et
        if (baby.userId.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler('Bu işlem için yetkiniz yok', 403));
        }

        // Diş kaydını sil
        await Baby.findByIdAndUpdate(id, {
            $pull: { teeth_information: { _id: teethId } }
        });

        res.status(200).json({
            success: true,
            message: 'Diş kaydı başarıyla silindi'
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});