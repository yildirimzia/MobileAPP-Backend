import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFeeding extends Document {
    babyId: string;
    feedingType: 'breast_milk' | 'formula' | 'solid_food' | 'water';
    startTime: Date;
    duration: number;
    breast?: 'left' | 'right';
    amount?: number; // ml veya gram cinsinden
    notes?: string;
}

const feedingSchema: Schema<IFeeding> = new Schema({
    babyId: {
        type: String,
        required: [true, 'Bebek ID gerekli'],
        ref: 'Baby'
    },
    feedingType: {
        type: String,
        required: [true, 'Beslenme tipi gerekli'],
        enum: ['breast_milk', 'formula', 'solid_food', 'water']
    },
    startTime: {
        type: Date,
        required: [true, 'Başlangıç zamanı gerekli']
    },
    duration: {
        type: Number,
        required: [true, 'Süre gerekli']
    },
    breast: {
        type: String,
        enum: ['left', 'right'],
        required: function (this: IFeeding) {
            return this.feedingType === 'breast_milk';
        }
    },
    amount: Number,
    notes: String
}, { timestamps: true });

const Feeding: Model<IFeeding> = mongoose.model('Feeding', feedingSchema);

export default Feeding;