// utils/helpers.js

/**
 * Valida una data rispetto al corrente e intervalli
 * @param {Date|string} date - Data da validare
 * @returns {boolean} - True se la data è valida
 */
export const isValidDate = (date) => {
    const currentDate = new Date();
    const inputDate = new Date(date);
    
    // Controlla se la data è nel futuro e non oltre 1 anno
    return inputDate > currentDate && 
           inputDate < new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
  };
  
  /**
   * Formatta una data in stringa locale
   * @param {Date} date - Data da formattare
   * @returns {string} - Data formattata (es. "04/03/2024, 15:30")
   */
  export const formatDate = (date) => {
    return new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Genera una stringa casuale per token/ID
   * @param {number} length - Lunghezza della stringa
   * @returns {string} - Stringa casuale
   */
  export const generateRandomString = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
      .map(byte => chars[byte % chars.length])
      .join('');
  };
  
  /**
   * Sanifica input rimuovendo tag HTML/XSS
   * @param {string} input - Stringa da sanificare
   * @returns {string} - Stringa pulita
   */
  export const sanitizeInput = (input) => {
    return input.replace(/<[^>]*>?/gm, '');
  };
  
  /**
   * Gestione errori centralizzata
   * @param {Error} error - Oggetto errore
   * @returns {string} - Messaggio errore user-friendly
   */
  export const getErrorMessage = (error) => {
    if (error.details && Array.isArray(error.details)) { // Errori Joi
      return error.details.map(d => d.message).join(', ');
    }
    if (error.code === 'ER_DUP_ENTRY') { // Errori MySQL duplicati
      return 'Elemento già esistente nel sistema';
    }
    return error.message || 'Errore sconosciuto';
  };
  
  /**
   * Calcola parametri paginazione
   * @param {number} page - Pagina corrente
   * @param {number} itemsPerPage - Elementi per pagina
   * @returns {object} - { offset, limit }
   */
  export const calculatePagination = (page = 1, itemsPerPage = 10) => {
    const offset = (page - 1) * itemsPerPage;
    return {
      offset: offset < 0 ? 0 : offset,
      limit: itemsPerPage > 50 ? 50 : itemsPerPage // Limite massimo 50
    };
  };
  
  /**
   * Verifica se un utente ha un ruolo specifico
   * @param {object} user - Oggetto utente
   * @param {string[]} allowedRoles - Ruoli permessi
   * @returns {boolean}
   */
  export const checkUserRole = (user, allowedRoles) => {
    return allowedRoles.includes(user?.role);
  };
  
  /**
   * Gestione errori del database
   * @param {object} error - Errore MySQL
   * @returns {object} - Oggetto errore formattato
   */
  export const handleDatabaseError = (error) => {
    switch (error.code) {
      case 'ER_NO_REFERENCED_ROW_2':
        return { 
          code: 404,
          message: 'Risorsa correlata non trovata' 
        };
      case 'ER_ACCESS_DENIED_ERROR':
        return {
          code: 403,
          message: 'Permessi insufficienti'
        };
      default:
        return {
          code: 500,
          message: 'Errore del database'
        };
    }
  };