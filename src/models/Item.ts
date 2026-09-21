import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IItem extends Document {
  name: string;
  price: number;
  unit: string;
  category?: string;
  imageUrl?: string;
  imagePublicId?: string;
  priority: number;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
      set: (v: string) => (v ? v.trim().toUpperCase() : v),
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
      set: (v: number) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v),
    },
    unit: {
      type: String,
      default: 'PIECE',
      trim: true,
      uppercase: true,
      set: (v: string) => (v ? v.trim().toUpperCase() : 'PIECE'),
    },
    category: {
      type: String,
      default: 'GENERAL',
      trim: true,
      uppercase: true,
      set: (v: string) => (v ? v.trim().toUpperCase() : 'GENERAL'),
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    priority: {
      type: Number,
      default: 100,
      index: true,
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for default sort (priority asc, name asc)
ItemSchema.index({ priority: 1, name: 1 });
// Text index on name for rapid search
ItemSchema.index({ name: 'text' });

const Item: Model<IItem> = mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);

export default Item;
