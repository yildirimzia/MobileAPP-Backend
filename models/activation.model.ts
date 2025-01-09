import mongoose, { Document, Model, Schema } from 'mongoose';

interface IActivationDocument extends Document {
    email: string;
    activationToken: string;
    activationCode: string;
    expiresAt: Date;
    lastResendAt: Date;
    gender: 'male' | 'female' | 'not_specified';
}

export interface IActivation {
    email: string;
    activationToken: string;
    activationCode: string;
    expiresAt: Date;
    lastResendAt: Date;
    gender: 'male' | 'female' | 'not_specified';
}

const activationSchema = new Schema<IActivationDocument>({
    email: {
        type: String,
        required: true,
    },
    activationToken: {
        type: String,
        required: true,
    },
    activationCode: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 120
    },
    lastResendAt: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'not_specified'] as const,
        default: 'not_specified'
    }
});

const Activation: Model<IActivationDocument> = mongoose.model('Activation', activationSchema);
export default Activation; 