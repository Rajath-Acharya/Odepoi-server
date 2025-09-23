import { Router } from "express";
import {
  googleLogin,
  logout,
  refreshToken,
} from "@/controllers/authController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and session management
 */

/**
 * @swagger
 * /auth/google/login:
 *   post:
 *     summary: Authenticate user with Google OAuth
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: The Google ID token obtained from the client.
 *     responses:
 *       200:
 *         description: Successfully authenticated. Returns user info and access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *       400:
 *         description: Bad request (e.g., token is missing).
 *       401:
 *         description: Unauthorized (e.g., email not verified).
 *       409:
 *         description: Conflict (e.g., email already in use with another provider).
 *       500:
 *         description: Internal server error.
 */
router.post("/google/login", googleLogin);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh the access token
 *     tags: [Authentication]
 *     description: Obtains a new access token by sending the refreshToken cookie.
 *     responses:
 *       200:
 *         description: A new access token is returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Unauthorized (refresh token is missing).
 *       403:
 *         description: Forbidden (refresh token is invalid).
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the user
 *     tags: [Authentication]
 *     description: Clears the refresh token from the database and the client's cookies.
 *     responses:
 *       200:
 *         description: Successfully logged out.
 *       204:
 *         description: No content (user was not logged in).
 */


export default router;
