import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { googleLogin, logout, refreshToken } from '../controllers/authController';

export default async function authRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  fastify.post('/google/login', {
    schema: {
      description: 'Authenticate user with Google OAuth',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'Google ID token from the client' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: googleLogin,
  });

  fastify.post('/refresh-token', {
    schema: {
      description: 'Refresh the access token using refreshToken cookie',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: { accessToken: { type: 'string' } },
        },
      },
    },
    handler: refreshToken,
  });

  fastify.post('/logout', {
    schema: {
      description: 'Log out the user and clear refresh token cookie',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: logout,
  });
}
