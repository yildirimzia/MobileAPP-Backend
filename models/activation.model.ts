import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IActivation extends Document {
    email: string;
    activationToken: string;
    activationCode: string;
    expiresAt: Date;
    lastResendAt: Date;
}

const activationSchema: Schema<IActivation> = new Schema({
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
    }
});

const Activation: Model<IActivation> = mongoose.model('Activation', activationSchema);
export default Activation; 