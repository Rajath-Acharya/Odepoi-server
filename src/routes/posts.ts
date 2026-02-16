import { Router } from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  deletePost, 
  toggleLikePost 
} from '../controllers/postController.js';

import { authenticate } from '../middlewares/authHandler.js'; // Assuming you have auth
import multer from 'multer';
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: { fileSize: 6 * 1024 * 1024 } // Optional: limit to 5MB
});

const router = Router();

router.get('/', getPosts);
router.get('/:id', getPostById);

// Protected routes (require auth)
router.post('/',upload.single('file'), createPost);
router.delete('/:id', authenticate, deletePost);
router.patch('/:id/like', authenticate, toggleLikePost);

export default router;