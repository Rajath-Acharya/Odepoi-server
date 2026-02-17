import User from '../models/user.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.utils.js';
import { UserProfile } from '../types/user.types.js';

export const handleSocialLogin = async (profile: UserProfile) => {
  const { provider, providerId, email, username } = profile;
  let user = await User.findOne({ providerId, provider });

  if (!user) {
    user = await User.create({
      email,
      username,
      provider,
      providerId,
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};
