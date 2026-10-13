import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: '', trim: true },
    notifications: {
      projectUpdates: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      clientMessages: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    language: { type: String, default: 'English', trim: true },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.model('User', userSchema);