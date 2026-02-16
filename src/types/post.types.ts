export interface PostCreateInput {
  userId: string;
  imageUrl: string;
  description: string;
}

export interface Post {
  _id: string;
  user: string;
  imageUrl: string;
  description: string;
  createdAt: string;
}
