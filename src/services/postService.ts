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

  async findAll(skip: number, limit: number): Promise<Post[]> {
    return await PostModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePic');
  },

  async findById(id: string): Promise<Post | null> {
    return await PostModel.findById(id).populate('user', 'username');
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
