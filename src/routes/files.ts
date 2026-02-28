import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  uploadBufferToS3,
  getPresignedDownloadUrl,
} from '../lib/s3';

export default async function filesRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  fastify.post('/upload', {
    schema: {
      description: 'Upload a file to S3',
      tags: ['Files'],
      consumes: ['multipart/form-data'],
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            key: { type: 'string' },
            bucket: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          message: "No file provided. Expected field name 'file'.",
        });
      }

      const buffer = await data.toBuffer();
      const key = data.filename ?? data.fieldname ?? 'file';

      const result = await uploadBufferToS3(
        key,
        buffer,
        data.mimetype ?? 'application/octet-stream',
      );

      return reply.status(201).send({
        message: 'File uploaded successfully to S3.',
        key: result.key,
        bucket: result.bucket,
      });
    },
  });

  fastify.get('/download', {
    schema: {
      description: 'Get a presigned download URL for bg_wallpaper.jpeg',
      tags: ['Files'],
      response: {
        200: {
          type: 'object',
          properties: { url: { type: 'string' } },
        },
      },
    },
    handler: async (_request, reply) => {
      const key = 'bg_wallpaper.jpeg';
      const url = await getPresignedDownloadUrl(key);
      return reply.status(200).send({ url });
    },
  });
}
