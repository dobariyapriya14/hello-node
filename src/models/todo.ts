import mongoose, { Schema, Document } from 'mongoose';
export interface ITodo extends Document {
  title: string;
  description?: string;
  completed: boolean;
  mode?: boolean;
  image?: string;
  pdf?: string;
  createdAt: Date;
}

const TodoSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    mode: { type: Boolean, default: false },
    image: { type: String },
    pdf: { type: String },
  },
  { timestamps: true }
);
export default mongoose.model<ITodo>('Todo', TodoSchema);