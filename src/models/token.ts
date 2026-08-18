import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
}

const RefreshTokenSchema: Schema = new Schema({
  token: { type: String, required: true, unique: true },
});

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
