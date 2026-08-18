import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: number;
}

const OtpSchema: Schema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Number, required: true },
});

export default mongoose.model<IOtp>('Otp', OtpSchema);
