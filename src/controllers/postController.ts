import { Request, Response } from 'express';
import { postService } from '../services/postService.js';
import { deleteObjectFromS3, uploadBufferToS3 } from '../lib/s3.js';

export async function createPost(req: Request, res: Response) {
  try {
    const { description, userId = 'testuser' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image required' });

    const s3Result = await uploadBufferToS3(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype,
    );

    const post = await postService.create({
      userId,
      description,
      imageUrl: s3Result.key,
    });

    res.status(201).json(post);
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
}

export async function getPosts(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await postService.findAll((page - 1) * limit, limit);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching feed' });
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const post = await postService.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Authorization Check
    if (post.user.toString() !== req.body?.userId?.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (post.imageUrl) await deleteObjectFromS3(post.imageUrl);
    await postService.delete(req.params.id);

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
}

export async function toggleLikePost(req: Request, res: Response) {
  try {
    const userId = req.body.userId || 'testuser';
    const result = await postService.toggleLike(req.params.id, userId);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.message === 'Post not found' ? 404 : 500).json({ error: err.message });
  }
}
