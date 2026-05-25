import { User, IUser } from '../models/User';
import { Subscription } from '../models/Subscription';
import { AppError } from '../middlewares/errorHandler';
import { IUserResponse } from '../interfaces';

export class UserService {
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(400, `${field} already exists`);
      }
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return (await User.findOne({ email }).select('+password')) as IUser | null;
  }

  async updateUser(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser> {
    delete (updateData as any).password;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await Subscription.deleteOne({ userId });
  }

  async addFavouritePlace(userId: string, place: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favouritePlaces: place } },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  async removeFavouritePlace(userId: string, place: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favouritePlaces: place } },
      { new: true }
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  formatUserResponse(user: IUser): IUserResponse {
    return {
      id: user._id.toString(),
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePic: user.profilePic,
      age: user.age,
      isVerified: user.isVerified,
      favouritePlaces: user.favouritePlaces,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userService = new UserService();
