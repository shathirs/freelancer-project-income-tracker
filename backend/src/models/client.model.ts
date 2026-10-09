import mongoose, { Schema } from 'mongoose';

const clientSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        company: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    },
    { timestamps: true },
);

export const Client = mongoose.model('Client', clientSchema);