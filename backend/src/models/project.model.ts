import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['In Progress', 'Completed', 'On Hold'],
      default: 'In Progress',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    fee: { type: Number, required: true, min: 0 },
    feeNote: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

export const Project = mongoose.model('Project', projectSchema);