import mongoose, { Schema } from 'mongoose';

/**
 * Local app profile for a Privy-authenticated user. MongoDB stores profile +
 * wallet address ONLY — never credentials (Privy is the source of identity).
 */
const userSchema = new Schema(
  {
    privyUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    walletAddress: { type: String },
  },
  { timestamps: true },
);

/** Plain (lean) shape returned by the repository. */
export interface UserRecord {
  _id: mongoose.Types.ObjectId | string;
  privyUserId: string;
  email?: string;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Guard against model re-compilation under tsx watch / vitest.
export const UserModel =
  (mongoose.models.User as mongoose.Model<UserRecord>) ??
  mongoose.model<UserRecord>('User', userSchema);
