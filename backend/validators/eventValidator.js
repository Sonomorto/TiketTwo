// validators/eventValidator.js
import Joi from 'joi';
import { isValidDate } from '../utils/helpers.js'; // Funzione helper custom

const eventSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(100)
        .required()
        .pattern(/^[a-zA-Z0-9\sàèéìòù'!?.,-]+$/, 'caratteri validi'),
    
    description: Joi.string()
        .max(500)
        .optional(),
    
    date: Joi.date()
        .iso()
        .greater('now')
        .required()
        .custom((value, helpers) => {
            if (!isValidDate(value)) return helpers.error('date.invalid');
            return value;
        }, 'validazione data custom'),
    
    location: Joi.string()
        .pattern(/^[a-zA-Z0-9\s,.-]+$/)
        .required(),
    
    available_seats: Joi.number()
        .integer()
        .min(1)
        .max(10000)
        .required(),
    
    price: Joi.number()
        .precision(2)
        .min(0)
        .max(1000)
        .required(),
    
    // Campo organizzatore aggiunto automaticamente
    organizer_id: Joi.forbidden() // Impedisci l'invio manuale
}).unknown(false); // Blocca campi aggiuntivi

export const validateEventCreation = (req, res, next) => {
    const { error } = eventSchema.validate(req.body, {
        abortEarly: false,
        convert: false
    });

    if (error) {
        return res.status(400).json({
            error: 'Validation Failed',
            details: error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message.replace(/['"]/g, '')
            }))
        });
    }

    next();
};