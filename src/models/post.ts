import { Schema, model, Types } from 'mongoose';

export interface Post {
  _id: Types.ObjectId;
  user: string;
  imageUrl: string;
  description: string;
  createdAt: Date;
  likes?: Types.ObjectId[]; 
}

const postSchema = new Schema<Post>({
  user: { type: String, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const PostModel = model<Post>('Post', postSchema);
