import { UserModel, type UserRecord } from '../../models/user.model.js';

/** Thin data-access layer over the User model (mocked in service tests). */

export async function findByPrivyUserId(privyUserId: string): Promise<UserRecord | null> {
  return UserModel.findOne({ privyUserId }).lean<UserRecord>().exec();
}

export async function createUser(data: {
  privyUserId: string;
  email?: string;
  walletAddress?: string;
}): Promise<UserRecord> {
  const doc = await UserModel.create(data);
  return doc.toObject() as UserRecord;
}

export async function updateByPrivyUserId(
  privyUserId: string,
  patch: Partial<Pick<UserRecord, 'email' | 'walletAddress'>>,
): Promise<UserRecord | null> {
  return UserModel.findOneAndUpdate({ privyUserId }, { $set: patch }, { new: true })
    .lean<UserRecord>()
    .exec();
}
