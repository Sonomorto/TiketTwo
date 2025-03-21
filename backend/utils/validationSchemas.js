// utils/validationSchemas.js
import Joi from 'joi';
import { ApiError } from './apiResponse.js';

// ===============================================
// SCHEMI BASE
// ===============================================
const idSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID deve essere un numero valido',
  'number.positive': 'ID deve essere un valore positivo'
});

// ===============================================
// SCHEMI PER AUTENTICAZIONE
// ===============================================
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
        'string.email': 'Formato email non valido'
      }),

    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        'string.pattern.base': 'La password deve contenere: 1 maiuscola, 1 numero e 1 carattere speciale (@$!%*?&)'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

// ===============================================
// SCHEMI PER GESTIONE EVENTI (Progetto 4)
// ===============================================
export const eventSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(5)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Il titolo è obbligatorio'
      }),

    description: Joi.string()
      .min(20)
      .max(1000)
      .required(),

    date: Joi.date()
      .iso()
      .min('now')
      .required()
      .messages({
        'date.min': 'La data deve essere futura',
        'date.format': 'Formato data non valido (YYYY-MM-DDTHH:mm:ssZ)'
      }),

    location: Joi.string()
      .pattern(/^[a-zA-Z0-9\s,.-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Caratteri non validi nella località'
      }),

    total_tickets: Joi.number()
      .integer()
      .min(1)
      .max(10000)
      .required()
      .messages({
        'number.min': 'Deve esserci almeno 1 biglietto disponibile'
      }),

    price: Joi.number()
      .precision(2)
      .positive()
      .required()
      .messages({
        'number.positive': 'Il prezzo deve essere un valore positivo'
      }),

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

// ===============================================
// SCHEMI PER BIGLIETTI (Progetto 4)
// ===============================================
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

// ===============================================
// FUNZIONE DI VALIDAZIONE GENERICA
// ===============================================
export const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message.replace(/['"]+/g, '')
    }));
    return next(new ApiError(422, 'Errore di validazione', errors));
  }

  req[target] = value;
  next();
};