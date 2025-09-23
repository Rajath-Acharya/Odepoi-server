import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  provider: string;
  refreshToken?: string;
  providerId?: string;
  profile: {
    dateOfBirth?: Date;
    hobbies?: string[];
    place?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
    },
    provider: {
      type: String,
      required: true,
    },
    providerId: {
      type: String,
      unique: true,
      sparse: true, // Use sparse index for unique but optional fields
    },
    profile: {
      dateOfBirth: {
        type: Date,
      },
      hobbies: {
        type: [String],
      },
      place: {
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        country: {
          type: String,
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
