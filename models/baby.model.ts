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
    allergy_information?: {
        allergy_name: string;
        discovery_date: Date;
        symptoms?: string;
    }[];
    teeth_information: {
        tooth_id: string;
        tooth_name: string;
        tooth_type: string;
        date: Date;
    }[];
    breast_milk: {
        startTime: Date;
        duration: number;
        breast: 'left' | 'right';
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
        vaccine_notes: String
    }],
    allergy_information: [{
        allergy_name: { type: String, required: true },
        discovery_date: { type: Date, required: true },
        symptoms: String
    }],
    teeth_information: [{
        tooth_id: { type: String, required: true },
        tooth_name: { type: String, required: true },
        tooth_type: { type: String, required: true },
        date: { type: Date, required: true }
    }],
    breast_milk: [{
        startTime: {
            type: Date,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        breast: {
            type: String,
            enum: ['left', 'right'],
            required: true
        },
        _id: {
            type: Schema.Types.ObjectId,
            auto: true
        }
    }]
}, { timestamps: true });

const Baby: Model<IBaby> = mongoose.model('Baby', babySchema);

export default Baby;