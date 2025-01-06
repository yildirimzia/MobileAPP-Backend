require('dotenv').config();
import { Response } from 'express';
import { IUser } from '../models/user.model';
import { redis } from '../utils/redis';
import jwt from 'jsonwebtoken';


interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}


export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: false
}

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: false
}

export const signAccessToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
        expiresIn: '5m',
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
        expiresIn: '3d',
    });

    // Add proper type assertion for Redis
    redis.set(user._id, JSON.stringify(user as Record<string, any>));

    // Cookie'leri ayarla
    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);

    // Sadece token'ları döndür, response'u gönderme
    return { accessToken, refreshToken };
}