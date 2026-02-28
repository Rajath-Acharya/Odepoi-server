import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  createPost,
  getPosts,
  deletePost,
  toggleLikePost,
} from '../controllers/postController';
import { authenticate } from '../middlewares/authHandler';

export default async function postsRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  fastify.get('/', {
    schema: {
      description: 'List posts with pagination',
      tags: ['Posts'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
        },
      },
    },
    handler: getPosts,
  });

  fastify.post('/', {
    schema: {
      description: 'Create a new post (multipart: file, description, userId)',
      tags: ['Posts'],
      consumes: ['multipart/form-data'],
    },
    handler: createPost,
  });

  fastify.delete('/:id', {
    preHandler: [authenticate],
    schema: {
      description: 'Delete a post',
      tags: ['Posts'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
    handler: deletePost,
  });

  fastify.patch('/:id/like', {
    preHandler: [authenticate],
    schema: {
      description: 'Toggle like on a post',
      tags: ['Posts'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
    handler: toggleLikePost,
  });
}
