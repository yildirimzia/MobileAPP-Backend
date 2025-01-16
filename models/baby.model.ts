import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBaby extends Document {
    name: string;
    gender: 'male' | 'female';
    birthDate: Date;
    weight: number;
    height: number;
    photo?: {
        public_id: string;
        url: string;
    };
    userId: string;
    vaccine_information: {
        vaccine_name: string;
        vaccine_date: Date;
        vaccine_notes?: string;
    }[];
}

const babySchema: Schema<IBaby> = new Schema({
    name: {
        type: String,
        required: [true, 'Lütfen bebeğin adını giriniz'],
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Lütfen bebeğin cinsiyetini giriniz'],
    },
    birthDate: {
        type: Date,
        required: [true, 'Lütfen doğum tarihini giriniz'],
    },
    weight: {
        type: Number,
        required: [true, 'Lütfen doğum kilosunu giriniz'],
    },
    height: {
        type: Number,
        required: [true, 'Lütfen doğum boyunu giriniz'],
    },
    photo: {
        public_id: String,
        url: String,
    },
    userId: {
        type: String,
        required: true,
    },
    vaccine_information: [{
        vaccine_name: { type: String, required: true },
        vaccine_date: { type: Date, required: true },
        vaccine_notes: { type: String }
    }]
}, { timestamps: true });

const Baby: Model<IBaby> = mongoose.model('Baby', babySchema);

export default Baby;