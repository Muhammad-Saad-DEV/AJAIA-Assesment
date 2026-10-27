import { createApp } from '../server/app.js';
import { initializeDatabase } from '../server/db.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in the Vercel runtime.');

const database = await initializeDatabase();
const app = createApp(database);

export default app;
