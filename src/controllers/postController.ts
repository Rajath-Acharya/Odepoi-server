import { FastifyRequest, FastifyReply } from 'fastify';
import { postService } from '../services/postService';
import { deleteObjectFromS3, uploadBufferToS3 } from '../lib/s3';

interface CreatePostBody {
  description?: string;
  userId?: string;
}

interface DeletePostParams {
  id: string;
}

interface ToggleLikeParams {
  id: string;
}

interface ToggleLikeBody {
  userId?: string;
}

export async function createPost(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body: Record<string, string> = {};
    let fileData: { buffer: Buffer; filename: string; mimetype: string } | null = null;

    for await (const part of request.parts()) {
      if (part.type === 'field') {
        body[part.fieldname] = (part as { value: string }).value;
      } else {
        const filePart = part as { toBuffer: () => Promise<Buffer>; filename?: string; mimetype?: string };
        const buffer = await filePart.toBuffer();
        fileData = {
          buffer,
          filename: filePart.filename ?? 'image',
          mimetype: filePart.mimetype ?? 'application/octet-stream',
        };
      }
    }

    if (!fileData) {
      return reply.status(400).send({ error: 'Image required' });
    }

    const description = body.description ?? '';
    const userId = body.userId ?? 'testuser';

    const s3Result = await uploadBufferToS3(
      fileData.filename,
      fileData.buffer,
      fileData.mimetype,
    );

    const post = await postService.create({
      userId,
      description,
      imageUrl: s3Result.key,
    });

    return reply.status(201).send(post);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return reply
      .status(500)
      .send({ error: 'Upload failed', details: message });
  }
}

interface GetPostsQuerystring {
  page?: string;
  limit?: string;
}

export async function getPosts(
  request: FastifyRequest<{ Querystring: GetPostsQuerystring }>,
  reply: FastifyReply,
) {
  try {
    const page = parseInt(request.query.page ?? '1') || 1;
    const limit = parseInt(request.query.limit ?? '10') || 10;
    const posts = await postService.findAll((page - 1) * limit, limit);
    return reply.send(posts);
  } catch {
    return reply.status(500).send({ error: 'Error fetching feed' });
  }
}

interface DeletePostBody {
  userId?: string;
}

export async function deletePost(
  request: FastifyRequest<{
    Params: DeletePostParams;
    Body: DeletePostBody;
  }>,
  reply: FastifyReply,
) {
  try {
    const post = await postService.findById(request.params.id);
    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }

    if (post.user.toString() !== request.body?.userId?.toString()) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    if (post.imageUrl) {
      await deleteObjectFromS3(post.imageUrl);
    }
    await postService.delete(request.params.id);

    return reply.status(200).send({ message: 'Deleted successfully' });
  } catch {
    return reply.status(500).send({ error: 'Delete failed' });
  }
}

export async function toggleLikePost(
  request: FastifyRequest<{
    Params: ToggleLikeParams;
    Body: ToggleLikeBody;
  }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.body?.userId ?? 'testuser';
    const result = await postService.toggleLike(request.params.id, userId);
    return reply.status(200).send(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Post not found' ? 404 : 500;
    return reply.status(status).send({ error: message });
  }
}
