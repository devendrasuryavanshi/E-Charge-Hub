import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IChargingStation extends Document {
  name: string;
  coordinates: {
    latitude: Number,
    longitude: Number,
  };
  status: 'Active' | 'Inactive' | 'Maintenance';
  powerOutput: number;
  connectorType: 'Type1' | 'Type2' | 'CCS' | 'CHAdeMO' | 'CHAdeMO' | 'GB/T';
  createdBy: mongoose.Types.ObjectId;
}

const ChargingStationSchema: Schema<IChargingStation> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Maintenance'],
      required: true,
    },
    powerOutput: {
      type: Number,
      required: true,
    },
    connectorType: {
      type: String,
      enum: ['Type1', 'Type2', 'CCS', 'CHAdeMO', 'CHAdeMO', 'GB/T'],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IChargingStation>('ChargingStation', ChargingStationSchema);