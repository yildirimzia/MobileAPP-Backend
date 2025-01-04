import { NextFunction, Request, Response } from "express";
import { CatcAsyncError } from "./catcAsyncError";
import ErrorHandler from "../utils/ErrorHandlers";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from "../utils/redis";

// Auth Authentication

export const isAuthenticated = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHandler('Lütfen önce giriş yapınız', 400));
    }

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
})

//Validate User Role

export const validateUserRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role)) {
            return next(new ErrorHandler(`Rol: ${req.user?.role} Kullanıcının bu kaynağa erişmesine izin verilmiyor`, 403));
        }
        next();
    }
}   