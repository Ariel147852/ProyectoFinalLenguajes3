import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  prestamoId: Types.ObjectId;
  emisorId: Types.ObjectId;
  receptorId: Types.ObjectId;
  calificacion: number;
  comentario: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    prestamoId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true
    },
    emisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receptorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    calificacion: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comentario: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

ReviewSchema.index({ receptorId: 1 });

export const Review = model<IReview>('Review', ReviewSchema);

