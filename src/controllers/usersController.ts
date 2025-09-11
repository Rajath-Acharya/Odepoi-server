import { Request, Response, NextFunction } from "express";
import { connectToDatabase, UserModel } from "../lib/db";

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function getMe(_req: Request, res: Response) {
  // Placeholder until auth is added
  res.status(501).json({ error: "Not implemented" });
}
