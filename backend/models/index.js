// backend/models/index.js
import * as TicketModule from './Ticket.js';
import * as EventModule from './Event.js';
import * as NotificationModule from './Notification.js';
import * as UserModule from './User.js'; // Aggiungi se esiste

// Export unificato per tutti i modelli
export const Ticket = {
  create: TicketModule.create,
  findById: TicketModule.findById,
  delete: TicketModule.deleteTicket,
  getTicketsByUser: TicketModule.getTicketsByUser
};

export const Event = {
  findById: EventModule.findById,
  updateTicketCount: EventModule.updateTicketCount,
  create: EventModule.createEvent
};

export const Notification = {
  createNotification: NotificationModule.createNotification,
  getUserNotifications: NotificationModule.getUserNotifications
};

// Export aggiuntivi per estendibilità
export const User = UserModule; // Se presente

// Funzione per inizializzare le tabelle (opzionale)
export const initializeModels = async () => {
  try {
    await EventModule.createEventsTable();
    await TicketModule.createTicketsTable();
    await NotificationModule.createNotificationsTable();
    console.log('✅ Tabelle create con successo');
  } catch (error) {
    console.error('❌ Errore creazione tabelle:', error);
    throw error;
  }
};