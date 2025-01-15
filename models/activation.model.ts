import mongoose, { Document, Model, Schema } from 'mongoose';
import crypto from 'crypto';

interface IActivationDocument extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'registration' | 'email_change' | 'password_reset';
    code: string;
    activationToken: string;
    email: string;
    gender: 'male' | 'female' | 'not_specified';
    expiresAt: Date;
    lastResendAt: Date;
    data: any;
    codeHash: string;
    compareCode(code: string): Promise<boolean>;
}

export interface IActivation {
    userId: mongoose.Types.ObjectId;
    type: 'registration' | 'email_change' | 'password_reset';
    code: string;
    activationToken: string;
    email: string;
    gender: 'male' | 'female' | 'not_specified';
    expiresAt: Date;
    lastResendAt: Date;
    data: any;
    codeHash: string;
    compareCode: (code: string) => Promise<boolean>;
}

const hashCode = (code: string): string => {
    return crypto
        .createHash('sha256')
        .update(code + process.env.ACTIVATION_SECRET)
        .digest('hex');
};

const activationSchema = new Schema<IActivationDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['registration', 'email_change', 'password_reset']
    },
    code: {
        type: String,
        required: true,
        select: false
    },
    codeHash: {
        type: String
    },
    activationToken: {
        type: String,
        required: function (this: IActivationDocument) {
            return this.type === 'registration';
        }
    },
    email: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'not_specified'],
        default: 'not_specified'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    lastResendAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    }
});

activationSchema.pre('save', async function (next) {
    if (this.isModified('code')) {
        this.codeHash = hashCode(this.code);
    }
    next();
});

activationSchema.methods.compareCode = async function (code: string): Promise<boolean> {
    return hashCode(code) === this.codeHash;
};

const Activation = mongoose.model<IActivationDocument>('Activation', activationSchema);
export default Activation; 