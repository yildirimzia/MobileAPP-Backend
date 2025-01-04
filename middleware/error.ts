import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/ErrorHandlers';

const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';
    
    if(err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    if(err.name === 'JsonWebTokenError'){
        const message = `Json Web Token is invalid, try again`;
        err = new ErrorHandler(message, 400);
    }

    if(err.name === 'TokenExpiredError'){
        const message = `Json Web Token is expired, try again`;
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
}

export default ErrorMiddleware;