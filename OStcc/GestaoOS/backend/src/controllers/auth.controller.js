import bcrypt from 'bcryptjs';

import {
  UniqueConstraintError,
} from 'sequelize';

import * as auth
  from '../services/auth.service.js';

import {
  Empresa,
  Setor,
  Categoria,
  Usuario,
  publicUser,
} from '../models/index.js';

import {
  cookieName,
  cookieOptions,
} from '../middlewares/auth.js';

import {
  env,
} from '../config/env.js';

import {
  write,
} from '../database/connection.js';

import {
  fail,
} from '../services/shared.js';


function randomCompanyCode() {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = 'GOS-';

  for (
    let i = 0;
    i < 6;
    i += 1
  ) {
    code += chars.charAt(
      Math.floor(
        Math.random() *
        chars.length,
      ),
    );
  }

  return code;
}


async function generateUniqueCompanyCode(
  transaction,
) {
  for (
    let attempt = 0;
    attempt < 100;
    attempt += 1
  ) {
    const codigo =
      randomCompanyCode();


    const exists =
      await Empresa.findOne({
        where: {
          codigo,
        },

        transaction,
      });


    if (!exists) {
      return codigo;
    }
  }


  throw new Error(
    'Não foi possível gerar um código único para a empresa.',
  );
}


export async function createCompany(
  req,
  res,
) {
  const {
    empresa,
    admin,
    email,
    senha,
  } = req.data;


  const existingUser =
    await Usuario.findOne({
      where: {
        email,
      },
    });


  fail(
    !!existingUser,
    409,
    'Este e-mail já está cadastrado.',
  );


  const senhaHash =
    await bcrypt.hash(
      senha,
      12,
    );


  let result;


  try {
    result = await write(
      async transaction => {
        const codigo =
          await generateUniqueCompanyCode(
            transaction,
          );


        const company =
          await Empresa.create(
            {
              nome: empresa,

              email,

              codigo,

              ativo: true,
            },
            {
              transaction,
            },
          );


        const generalSector =
          await Setor.create(
            {
              empresaId:
                company.id,

              nome: 'Geral',

              descricao:
                'Setor inicial',

              ativo: true,
            },
            {
              transaction,
            },
          );


        await Categoria.create(
          {
            empresaId:
              company.id,

            nome: 'Geral',

            ativo: true,
          },
          {
            transaction,
          },
        );


        const user =
          await Usuario.create(
            {
              empresaId:
                company.id,

              setorId:
                generalSector.id,

              nome:
                admin,

              email,

              senhaHash,

              role:
                'administrador_principal',

              ativo:
                true,
            },
            {
              transaction,
            },
          );


        return {
          company,
          user,
        };
      },
    );

  } catch (error) {
    if (
      error instanceof
      UniqueConstraintError
    ) {
      return res
        .status(409)
        .json({
          error:
            'Já existe um cadastro com estes dados. Tente novamente.',
        });
    }

    throw error;
  }


  return res
    .status(201)
    .json({
      mensagem:
        'Empresa criada com sucesso.',

      empresa:
        result.company.nome,

      empresaId:
        result.company.id,

      codigo:
        result.company.codigo,

      administrador: {
        id:
          result.user.id,

        nome:
          result.user.nome,

        email:
          result.user.email,
      },
    });
}


export async function login(
  req,
  res,
) {
  const {
    token,
    ...data
  } =
    await auth.login(
      req.data,
    );


  res.cookie(
    cookieName,
    token,
    {
      ...cookieOptions,

      maxAge:
        env.sessionHours *
        3600000,
    },
  );


  res.json(data);
}


export async function me(
  req,
  res,
) {
  const company =
    await Empresa.findByPk(
      req.user.empresaId,
    );


  res.json({
    usuario:
      publicUser(
        req.user,
      ),

    empresa: {
      id:
        company.id,

      nome:
        company.nome,

      codigo:
        company.codigo,
    },
  });
}


export async function logout(
  req,
  res,
) {
  await auth.logout(
    req.user,
    req.sessionId,
  );


  res
    .clearCookie(
      cookieName,
      cookieOptions,
    )
    .status(204)
    .end();
}


export async function profile(
  req,
  res,
) {
  const user =
    await auth.updateProfile(
      req.user,
      req.data,
    );


  if (
    req.data.novaSenha
  ) {
    res.clearCookie(
      cookieName,
      cookieOptions,
    );
  }


  res.json({
    usuario:
      user,

    loginNecessario:
      !!req.data.novaSenha,
  });
}