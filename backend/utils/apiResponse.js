export class ApiResponse {
  /**
   * Crea una risposta API standardizzata
   * @param {number} statusCode - Codice HTTP (es: 200, 201)
   * @param {object} data - Dati da includere nella risposta
   * @param {string} message - Messaggio descrittivo (default: "Success")
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export class ApiError extends Error {
  /**
   * Crea un errore API standardizzato
   * @param {number} statusCode - Codice HTTP (es: 400, 404)
   * @param {string} message - Messaggio di errore
   * @param {Array} errors - Dettagli degli errori (es: validazione Joi)
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Formatta errori di validazione per l'API
 * @param {Array} errors - Array di errori Joi
 * @throws {Error} Se `errors` non è un array
 * @returns {ApiError} Istanza di ApiError con statusCode 422
 */
export const validationError = (errors) => {
  if (!Array.isArray(errors)) {
    throw new Error('Il parametro "errors" deve essere un array');
  }
  return new ApiError(422, "Errore di validazione", errors);
};