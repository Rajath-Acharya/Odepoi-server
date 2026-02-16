import { Request, Response } from 'express';
import { PostModel } from '../models/post.js';
import { uploadBufferToS3 } from '../lib/s3.js';

export async function createPost(req: Request, res: Response) {
    try {
        const userId = req.body.userId || 'testuser'; // Adjust based on your auth
        const { description } = req.body;
        const file = req.file;

        if (!file || !description) {
            return res.status(400).json({ error: 'Image and description are required.' });
        }

        // Upload image to S3
        const s3Result = await uploadBufferToS3(file.originalname, file.buffer, file.mimetype);

        // Create post in DB
        const post = await PostModel.create({
            user: userId,
            imageUrl: s3Result.key,
            description,
        });

        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create post', details: err });
        // import { deleteFromS3 } from '../lib/s3.js'; // Good practice to cleanup S3
    }
}

// 1. Get Feed (with Pagination)
export async function getPosts(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const posts = await PostModel.find()
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit)
            .populate('user', 'username profilePic'); // Only bring necessary user info

        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching feed' });
    }
}

// 2. Get Single Post
export async function getPostById(req: Request, res: Response) {
    try {
        const post = await PostModel.findById(req.params.id).populate('user', 'username');
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Invalid post ID' });
    }
}

// 3. Delete Post
export async function deletePost(req: Request, res: Response) {
    try {
        const post = await PostModel.findById(req.params.id);

        // Safety check: Only the owner can delete
        if (post?.user.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // TODO: Call your S3 delete function here to save space/money
        await post.deleteOne();
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
}

// 4. Like / Unlike Toggle
export async function toggleLikePost(req: Request, res: Response) {
    try {
        const post = await PostModel.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (!post.likes) {
            post.likes = []; // Safety initialization
        }

        const userId = req.user._id;
        const isLiked = post.likes.includes(userId ?? false);

        if (isLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.status(200).json({ likesCount: post.likes.length, isLiked: !isLiked });
    } catch (err) {
        res.status(500).json({ error: 'Toggle like failed' });
    }
}
