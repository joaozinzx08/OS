import { z } from 'zod';

import {
  roles,
  statuses,
  priorities,
} from '../services/shared.js';


const name = z
  .string()
  .trim()
  .min(2)
  .max(120);


const email = z
  .email()
  .trim()
  .toLowerCase()
  .max(254);


const password = z
  .string()
  .min(
    10,
    'A senha precisa ter pelo menos 10 caracteres.',
  )
  .max(72)
  .refine(
    value =>
      Buffer.byteLength(
        value,
        'utf8',
      ) <= 72,

    'Senha deve ter até 72 bytes.',
  );


const id = z.uuid();


const nonempty = schema =>
  schema.refine(
    value =>
      Object.keys(value).length > 0,

    'Informe ao menos um campo.',
  );


export const schemas = {
  login: z.strictObject({
    email,

    senha: z
      .string()
      .min(1)
      .max(72),
  }),


  companyCreate: z.strictObject({
    empresa: name,

    admin: name,

    email,

    senha: password,
  }),


  userCreate: z.strictObject({
    nome: name,

    email,

    senha: password,

    role: z.enum(roles),

    setorId: id
      .nullable()
      .default(null),
  }),


  userUpdate: nonempty(
    z.strictObject({
      nome: name.optional(),

      role: z
        .enum(roles)
        .optional(),

      setorId: id
        .nullable()
        .optional(),

      ativo: z
        .boolean()
        .optional(),

      senha: password.optional(),
    }),
  ),


  sectorCreate: z.strictObject({
    nome: name,

    descricao: z
      .string()
      .trim()
      .max(500)
      .default(''),
  }),


  sectorReplace: z.strictObject({
    nome: name,

    descricao: z
      .string()
      .trim()
      .max(500),

    ativo: z.boolean(),
  }),


  categoryReplace: z.strictObject({
    nome: name,

    ativo: z.boolean(),
  }),


  sectorUpdate: nonempty(
    z.strictObject({
      nome: name.optional(),

      descricao: z
        .string()
        .trim()
        .max(500)
        .optional(),

      ativo: z
        .boolean()
        .optional(),
    }),
  ),


  categoryCreate: z.strictObject({
    nome: name,
  }),


  categoryUpdate: nonempty(
    z.strictObject({
      nome: name.optional(),

      ativo: z
        .boolean()
        .optional(),
    }),
  ),


  orderCreate: z.strictObject({
    titulo: z
      .string()
      .trim()
      .min(5)
      .max(160),

    descricao: z
      .string()
      .trim()
      .min(10)
      .max(10000),

    setorResponsavelId: id,

    categoriaId: id,

    prioridade: z
      .enum(priorities)
      .default('Média'),

    sigilo: z
      .boolean()
      .default(false),
  }),


  orderUpdate: nonempty(
    z.strictObject({
      status: z
        .enum(statuses)
        .optional(),

      prioridade: z
        .enum(priorities)
        .optional(),

      prazo: z
        .iso
        .datetime({
          offset: true,
        })
        .nullable()
        .optional(),

      responsavelId: id
        .nullable()
        .optional(),

      justificativa: z
        .string()
        .trim()
        .min(5)
        .max(2000),
    }),
  ),


  comment: z.strictObject({
    descricao: z
      .string()
      .trim()
      .min(2)
      .max(5000),
  }),


  profile: nonempty(
    z
      .strictObject({
        nome: name.optional(),

        senhaAtual: z
          .string()
          .min(1)
          .max(72)
          .optional(),

        novaSenha:
          password.optional(),
      })
      .refine(
        value =>
          !value.novaSenha ||
          value.senhaAtual,

        'Informe a senha atual.',
      ),
  ),
};


export const validate =
  schema =>
  (
    req,
    res,
    next,
  ) => {
    req.data =
      schema.parse(req.body);

    next();
  };


export const validId =
  (
    req,
    res,
    next,
  ) => {
    id.parse(req.params.id);

    next();
  };


export const pagination =
  query => {
    const page = z
      .coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .default(1)
      .parse(query.page);


    const limit = z
      .coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .parse(query.limit);


    return {
      page,

      limit,

      offset:
        (page - 1) * limit,
    };
  };