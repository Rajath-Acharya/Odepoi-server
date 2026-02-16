import { Router } from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  deletePost, 
  toggleLikePost 
} from '../controllers/postController.js';

import { authenticate } from '../middlewares/authHandler.js'; // Assuming you have auth


const router = Router();

// Public/Feed routes
/**
 * @swagger
 * /files/test:
 *   get:
 *     summary: get all posts
 *     tags: [Posts]
 *     description: >
 *       get all posts
 *     responses:
 *       200:
 *         description: Posts retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       404:
 *         description: No posts found.
 *       500:
 *         description: Internal server error while fetching .
 */
router.get('/', getPosts);
router.get('/:id', getPostById);

// Protected routes (require auth)
router.post('/', authenticate, createPost);
router.delete('/:id', authenticate, deletePost);
router.patch('/:id/like', authenticate, toggleLikePost);

export default router;