import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  name: string;
  price: number;
  unit: string;
  tag: string;
  imageUrl: string;
  description?: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: 'piece',
      trim: true,
    },
    tag: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for fast search
ItemSchema.index({ name: 'text', tag: 'text' });

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
