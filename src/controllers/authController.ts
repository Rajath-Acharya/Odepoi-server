import { FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import * as authService from '../services/authService';
import { UserProfile } from '../types/user.types';
import { generateAccessToken } from '../utils/token.utils';
import logger from '../lib/logger';

interface GoogleLoginBody {
  token?: string;
}

export async function googleLogin(
  request: FastifyRequest<{ Body: GoogleLoginBody }>,
  reply: FastifyReply,
) {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const id_token = request.body?.token;
    if (!id_token) {
      return reply.status(400).send({ message: 'Authentication failed' });
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub || !payload.name) {
      return reply.status(400).send({ message: 'Invalid token payload' });
    }

    if (!payload.email_verified) {
      return reply.status(401).send({ message: 'Email not verified' });
    }

    const userProfile: UserProfile = {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      username: payload.name,
    };

    const { user, accessToken, refreshToken } =
      await authService.handleSocialLogin(userProfile);

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return reply.status(200).send({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    logger.error('Error during Google OAuth callback: %o', error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
}

export async function refreshToken(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies.refreshToken;
  if (!refreshToken) {
    return reply.status(401).send({ message: 'Refresh token not found' });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as { id: string };

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return reply.status(403).send({ message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user.id);

    return reply.status(200).send({ accessToken });
  } catch (error) {
    logger.error('Invalid refresh token: %o', error);
    return reply.status(403).send({ message: 'Invalid refresh token' });
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken = request.cookies.refreshToken;
  if (!refreshToken) {
    return reply.status(204).send();
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as { id: string };
    const user = await User.findById(decoded.id);

    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  } catch (error) {
    logger.error('Error during logout: %o', error);
  }

  reply.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
  return reply.status(200).send({ message: 'Logged out successfully' });
}
