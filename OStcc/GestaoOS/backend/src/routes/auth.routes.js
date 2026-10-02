import {
  Router,
} from 'express';

import {
  rateLimit,
} from 'express-rate-limit';

import {
  authenticate,
} from '../middlewares/auth.js';

import {
  validate,
  schemas,
} from '../validators/index.js';

import * as controller
  from '../controllers/auth.controller.js';


const router =
  Router();


const loginLimit =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      20,

    standardHeaders:
      'draft-8',

    legacyHeaders:
      false,

    message: {
      error:
        'Muitas tentativas. Aguarde 15 minutos.',
    },
  });


const companyCreateLimit =
  rateLimit({
    windowMs:
      60 *
      60 *
      1000,

    limit:
      10,

    standardHeaders:
      'draft-8',

    legacyHeaders:
      false,

    message: {
      error:
        'Muitas tentativas de criação de empresa. Aguarde e tente novamente.',
    },
  });


router.post(
  '/criar-empresa',

  companyCreateLimit,

  validate(
    schemas.companyCreate,
  ),

  controller.createCompany,
);


router.post(
  '/login',

  loginLimit,

  validate(
    schemas.login,
  ),

  controller.login,
);


router.get(
  '/me',

  authenticate,

  controller.me,
);


router.post(
  '/logout',

  authenticate,

  controller.logout,
);


router.patch(
  '/perfil',

  authenticate,

  validate(
    schemas.profile,
  ),

  controller.profile,
);


export default router;