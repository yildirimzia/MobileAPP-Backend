import { NextFunction, Request, Response } from "express";
import { CatcAsyncError } from "./catcAsyncError";
import ErrorHandler from "../utils/ErrorHandlers";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from "../utils/redis";

// Auth Authentication

export const isAuthenticated = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    // Cookie'den veya Authorization header'dan token'ı al
    const access_token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

    if (!access_token) {
        return next(new ErrorHandler('Lütfen önce giriş yapınız', 400));
    }

    try {
        const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

        if (!decoded) {
            return next(new ErrorHandler('Erişim reddedildi', 400));
        }

        const user = await redis.get(decoded.id);

        if (!user) {
            return next(new ErrorHandler('Erişim reddedildi', 400));
        }

        req.user = JSON.parse(user);
        next();
    } catch (error) {
        return next(new ErrorHandler('Geçersiz veya süresi dolmuş token', 401));
    }
});

//Validate User Role

export const validateUserRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role)) {
            return next(new ErrorHandler(`Rol: ${req.user?.role} Kullanıcının bu kaynağa erişmesine izin verilmiyor`, 403));
        }
        next();
    }
}   