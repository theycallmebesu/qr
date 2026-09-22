import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  createdAt: Date;
}

const TagSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);
