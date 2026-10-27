import path from 'node:path';
import { createApp } from './app.js';
import { initializeDatabase } from './db.js';

const database = await initializeDatabase();
const port = Number(process.env.PORT || 3001);
const staticDir = path.resolve('dist');
createApp(database, staticDir).listen(port, '0.0.0.0', () => console.log(`Papertrail listening on port ${port} using ${database.dialect}`));
