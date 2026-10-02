export const name = '002-company-code';

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = 'GOS-';

  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(
      Math.floor(Math.random() * chars.length),
    );
  }

  return code;
}


export async function up(db, transaction) {
  const [columns] = await db.query(
    `PRAGMA table_info(empresas)`,
    {
      transaction,
    },
  );

  const hasCodigo = columns.some(
    column => column.name === 'codigo',
  );

  if (!hasCodigo) {
    await db.query(
      `
      ALTER TABLE empresas
      ADD COLUMN codigo TEXT
      `,
      {
        transaction,
      },
    );
  }


  const [companies] = await db.query(
    `
    SELECT id
    FROM empresas
    WHERE codigo IS NULL
       OR TRIM(codigo) = ''
    `,
    {
      transaction,
    },
  );


  for (const company of companies) {
    let codigo;
    let exists = true;

    while (exists) {
      codigo = randomCode();

      const [rows] = await db.query(
        `
        SELECT id
        FROM empresas
        WHERE codigo = :codigo
        LIMIT 1
        `,
        {
          replacements: {
            codigo,
          },

          transaction,
        },
      );

      exists = rows.length > 0;
    }


    await db.query(
      `
      UPDATE empresas
      SET codigo = :codigo
      WHERE id = :id
      `,
      {
        replacements: {
          codigo,
          id: company.id,
        },

        transaction,
      },
    );
  }


  await db.query(
    `
    CREATE UNIQUE INDEX IF NOT EXISTS
    empresas_codigo_unique
    ON empresas(codigo)
    `,
    {
      transaction,
    },
  );
}