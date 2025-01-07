require('dotenv').config();
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    };
    role: string;
    isVerified: boolean;
    resetPasswordToken: string | null;
    comparePassword: (password: string) => Promise<boolean>;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
}


const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true, 'Lütfen isminizi giriniz'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'Lütfen e-posta adresinizi giriniz'],
        unique: true,
        validate: {
            validator: function (value: string) {
                return emailRegexPattern.test(value);
            },
            message: 'Lütfen geçerli bir e-posta adresi giriniz'
        },
    },
    password: {
        type: String,
        // required: [true, 'Lütfen şifrenizi giriniz'],
        minLength: [6, 'Şifreniz en az 6 karakter olmalıdır'],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: { type: String, default: 'user' },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: {
        type: String,
        default: null
    }
}, { timestamps: true })


userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//Sign Access Token
userSchema.methods.SignAccessToken = function () {
    const accessToken = jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN as string, { expiresIn: '5m' });
    return accessToken;
}

//Sign Refresh Token
userSchema.methods.SignRefreshToken = function () {
    const refreshToken = jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN as string, { expiresIn: '3d' });
    return refreshToken;
}

const User: Model<IUser> = mongoose.model('User', userSchema);

export default User;