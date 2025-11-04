import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email?: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

type UserModel = mongoose.Model<IUser>;

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allow multiple null values
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
