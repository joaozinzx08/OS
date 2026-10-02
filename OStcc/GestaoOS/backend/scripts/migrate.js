import { migrate } from '../src/database/migrate.js';
import { db } from '../src/database/connection.js';
try { await migrate(); console.log('Migrations aplicadas.'); } finally { await db.close(); }
