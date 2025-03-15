// utils/validationSchemas.js
import Joi from 'joi';
import { roles } from '../config/constants.js';

// Schema base per gli ID numerici
const idSchema = Joi.number().integer().positive().required();

// Schemi principali
export const authSchemas = {
  register: Joi.object({
    name: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Nome contiene caratteri non validi',
        'any.required': 'Il nome è obbligatorio'
      }),

    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Email non valida'
      }),

    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        'string.pattern.base': 'La password deve contenere: 1 maiuscola, 1 numero e 1 carattere speciale'
      }),

    role: Joi.string()
      .valid(...Object.values(roles))
      .default(roles.USER)
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

export const eventSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(5)
      .max(100)
      .required(),

    description: Joi.string()
      .min(20)
      .max(1000)
      .required(),

    date: Joi.date()
      .iso()
      .min('now')
      .required()
      .messages({
        'date.min': 'La data non può essere nel passato'
      }),

    location: Joi.string()
      .pattern(/^[a-zA-Z0-9\s,.-]+$/)
      .required(),

    total_tickets: Joi.number()
      .integer()
      .min(1)
      .max(10000)
      .required(),

    price: Joi.number()
      .precision(2)
      .positive()
      .required(),

    image_url: Joi.string()
      .uri()
      .optional()
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(100),
    description: Joi.string().min(20).max(1000),
    date: Joi.date().iso().min('now'),
    location: Joi.string().pattern(/^[a-zA-Z0-9\s,.-]+$/),
    total_tickets: Joi.number().integer().min(1),
    price: Joi.number().precision(2).positive()
  }).min(1)
};

export const ticketSchemas = {
  purchase: Joi.object({
    event_id: idSchema,
    quantity: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'number.max': 'Massimo 10 biglietti per transazione'
      })
  }),

  cancel: Joi.object({
    ticket_id: idSchema
  })
};

export const notificationSchemas = {
  get: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

// Schema per validazione parametri URL
export const pathParamSchema = Joi.object({
  id: idSchema
});

// Funzione di validazione generica
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return next(new ApiError(422, 'Validation Error', errors));
  }

  next();
};