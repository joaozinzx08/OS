import {
  db,
  connect,
  write,
} from './connection.js';

import * as initial
  from './migrations/001-initial.js';

import * as companyCode
  from './migrations/002-company-code.js';


export async function migrate() {
  await connect();


  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      appliedAt TEXT NOT NULL
    )
  `);


  const migrations = [
    initial,
    companyCode,
  ];


  for (const migration of migrations) {
    await write(async transaction => {
      const [rows] = await db.query(
        `
        SELECT name
        FROM migrations
        WHERE name = :name
        `,
        {
          replacements: {
            name: migration.name,
          },

          transaction,
        },
      );


      if (rows.length) {
        return;
      }


      await migration.up(
        db,
        transaction,
      );


      await db.query(
        `
        INSERT INTO migrations(
          name,
          appliedAt
        )
        VALUES (
          :name,
          :date
        )
        `,
        {
          replacements: {
            name: migration.name,
            date: new Date().toISOString(),
          },

          transaction,
        },
      );
    });
  }
}