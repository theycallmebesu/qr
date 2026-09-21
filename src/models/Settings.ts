import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettings extends Document {
  shopName: string;
  phoneNumber: string;
  pricesLastUpdated: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    shopName: {
      type: String,
      default: 'KATHMANDU HARDWARE & SANITARY',
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '+977-9841234567',
      trim: true,
    },
    pricesLastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
