import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export async function errorHandler(
  err: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  console.error(err);
  if (err instanceof Error) {
    return reply.status(400).send({ error: err.message });
  }
  return reply.status(500).send({ error: 'Internal server error' });
}
