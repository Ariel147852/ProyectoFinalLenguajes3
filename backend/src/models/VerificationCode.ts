import { Schema, model, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    code: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Expira automáticamente en MongoDB
    }
  },
  {
    timestamps: true
  }
);

VerificationCodeSchema.index({ email: 1 });

export const VerificationCode = model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
