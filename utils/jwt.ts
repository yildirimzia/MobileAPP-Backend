require('dotenv').config();
import { Response } from 'express';
import { IUser } from '../models/user.model';
import { redis } from '../utils/redis';


interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}

const refreshTokenExpire = "7d";

const accessTokenExpire = "1d";

export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
}

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
}

export const signAccessToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // Add proper type assertion for Redis
    redis.set(user._id, JSON.stringify(user as Record<string, any>));


    if (process.env.NODE_ENV !== 'production') {
        accessTokenOptions.secure = true
    }

    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
}