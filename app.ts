import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ErrorMiddleware from './middleware/error';
import userRouter from './routes/user.route';
import babyRouter from './routes/baby.route';
import breastMilkRouter from './routes/feeding/breast-milk.route';
import { setupCleanupJobs } from './utils/cleanup';
import formulaRouter from './routes/feeding/formula.route';
import solidFoodRouter from './routes/feeding/solid-food.route';
import waterRouter from './routes/feeding/water.route';
import supplementRouter from './routes/feeding/supplement.route';
import snacksRouter from './routes/feeding/snacks.route';
import growthRouter from './routes/growth.route';
import aiRouter from './routes/ai.route';

dotenv.config();

export const app = express();

const allowedOrigins = [
    'http://localhost:8081',
    'http://192.168.1.198:8081',
    'http://192.168.1.172:8081',  // iOS simülatör
    'http://localhost:8000',
    process.env.ORIGIN || 'http://lc4wo0gss4w848kc08o080sw.140.245.14.249.sslip.io'
];

// CORS options
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['set-cookie'],
    sameSite: 'none',
    secure: false // Development için false, production'da true olmalı
};

// Middleware sıralaması önemli
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/v1', userRouter);
app.use('/api/v1', babyRouter);
app.use('/api/v1', breastMilkRouter);
app.use('/api/v1', formulaRouter);
app.use('/api/v1', solidFoodRouter);
app.use('/api/v1', waterRouter);
app.use('/api/v1', supplementRouter);
app.use('/api/v1', snacksRouter);
app.use('/api/v1', growthRouter);
app.use('/api/v1', aiRouter);
// Test route
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: 'API is working'
    });
});

// 404 handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});

// Error handling middleware - should be last
app.use(ErrorMiddleware);

// Cleanup jobs'ı başlat
setupCleanupJobs();

export default app;
