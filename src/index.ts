// Import environment configuration FIRST before any other imports
import './config/env.js';

import { createServer } from 'http';
import app from './app.js';
import { connectToDatabase } from './lib/db.js';

const port = Number(process.env.PORT || 4000);

const server = createServer(app);

connectToDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`Database connected and API listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });
