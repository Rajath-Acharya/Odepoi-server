// Import environment configuration FIRST before any other imports
import './config/env';

import buildApp from './app';
import { connectToDatabase } from './lib/db';

const port = Number(process.env.PORT || 4000);

async function start() {
  await connectToDatabase();

  const app = await buildApp();

  await app.listen({ port, host: '0.0.0.0' });

  console.log(`Database connected and API listening on http://localhost:${port}`);
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
