import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import * as authService from "../services/authService.js";
import { UserProfile } from "../types/user.types.js";
import { generateAccessToken } from "../utils/token.utils.js";
import logger from "../lib/logger.js";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const id_token = req.body.token as string;
    if (!id_token) {
      return res.status(400).json({ message: "Authentication failed" });
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub || !payload.name) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    if (!payload.email_verified) {
      return res.status(401).json({ message: "Email not verified" });
    }

    const userProfile: UserProfile = {
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      username: payload.name,
    };

    const { user, accessToken, refreshToken } =
      await authService.handleSocialLogin(userProfile);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    logger.error("Error during Google OAuth callback: %o", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string };

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken(user.id);

    res.status(200).json({ accessToken });
  } catch (error) {
    logger.error("Invalid refresh token: %o", error);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(204).send(); // No content
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string };
    const user = await User.findById(decoded.id);

    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  } catch (error) {
    logger.error("Error during logout: %o", error);
    // If token is invalid, just clear the cookie
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
