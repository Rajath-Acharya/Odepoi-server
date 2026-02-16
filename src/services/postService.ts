import { PostModel } from '../models/post.js';
import { PostCreateInput } from '../types/post.types.js';

export async function createPostService(input: PostCreateInput) {
  const post = await PostModel.create({
    user: input.userId,
    imageUrl: input.imageUrl,
    description: input.description,
  });
  return post;
}
