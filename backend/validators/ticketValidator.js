// validators/ticketValidator.js
import Joi from 'joi';

const ticketSchema = Joi.object({
    event_id: Joi.number()
        .integer()
        .positive()
        .required(),
    
    quantity: Joi.number()
        .integer()
        .min(1)
        .max(10)
        .required(),
    
    // Campi gestiti automaticamente
    user_id: Joi.forbidden(),
    purchase_date: Joi.forbidden()
}).unknown(false);

export const validateTicketPurchase = (req, res, next) => {
    // Unisci body con dati utente (per validazioni combinate)
    const dataToValidate = {
        ...req.body,
        user_id: req.user?.id // Aggiunto dal middleware auth
    };

    const { error } = ticketSchema.validate(dataToValidate, {
        abortEarly: false,
        allowUnknown: false
    });

    if (error) {
        return res.status(400).json({
            error: 'Ticket Validation Error',
            details: error.details.map(d => ({
                field: d.path[0],
                message: d.message
                    .replace(/["]/g, '')
                    .replace('fails to match the required pattern', 'contiene caratteri non validi')
            }))
        });
    }

    next();
};