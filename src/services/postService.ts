import { getPresignedDownloadUrl } from '../lib/s3.js';
import { PostModel, Post } from '../models/post.js';
import { Types } from 'mongoose';

// Define the interface for creating a post to ensure type safety
export interface CreatePostInput {
  userId: string;
  imageUrl: string;
  description: string;
}

export const postService = {
  async create(data: CreatePostInput): Promise<Post> {
    return await PostModel.create({
      user: data.userId,
      imageUrl: data.imageUrl,
      description: data.description,
    });
  },

  async findAll(skip: number, limit: number): Promise<any[]> {
    const posts = await PostModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePic')
      .lean(); // Use lean() for faster read and to allow modifying the object

    // Map through posts to attach temporary URLs
    return await Promise.all(
      posts.map(async (post) => {
        if (post.imageUrl) {
          // Replace the key with a real temporary URL
          post.imageUrl = await getPresignedDownloadUrl(post.imageUrl);
        }
        return post;
      }),
    );
  },

  async findById(id: string): Promise<any | null> {
    const post = await PostModel.findById(id).populate('user', 'username').lean();
    if (post?.imageUrl) {
      post.imageUrl = await getPresignedDownloadUrl(post.imageUrl);
    }
    return post;
  },

  async delete(id: string): Promise<Post | null> {
    const post = await PostModel.findById(id);
    if (post) {
      await post.deleteOne();
    }
    return post;
  },

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ likesCount: number; isLiked: boolean }> {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error('Post not found');
    if (!post.likes) {
      post.likes = []; // Safety initialization
    }

    const userObjectId = new Types.ObjectId(userId);
    const index = post.likes.indexOf(userObjectId);

    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userObjectId);
    }

    await post.save();
    return {
      likesCount: post.likes.length,
      isLiked: index === -1,
    };
  },
};
