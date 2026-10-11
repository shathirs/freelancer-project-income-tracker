import mongoose, { Schema } from 'mongoose';

const incomeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, enum: ['Payment', 'Invoice'], default: 'Payment' },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    date: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Income = mongoose.model('Income', incomeSchema);