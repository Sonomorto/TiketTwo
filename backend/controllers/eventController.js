import { 
    createEvent, 
    getEvents, 
    updateEvent, 
    deleteEvent 
  } from '../models/eventModel.js';
  
  export const createEvent = async (req, res) => {
    try {
      const createNEEvent = await createEvent({
        ...req.body,
        organizer_id: req.user.id // ID dall'JWT
      });
      res.status(201).json({
        id: newEvent,
        message: 'Evento creato con successo'
      });
    } catch (error) {
      switch(error.message) {
        case 'ORGANIZER_NOT_FOUND':
          res.status(404).json({ message: 'Organizzatore non valido' });
          break;
        default:
          res.status(500).json({ message: 'Errore nella creazione evento' });
      }
    }
  };
  
  export const getAllEvents = async (req, res) => {
    try {
      const filters = {
        organizer_id: req.query.organizer_id,
        min_date: req.query.min_date
      };
      
      const events = await getEvents(filters);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Errore nel recupero eventi' });
    }
  };
  
  export const updateExistingEvent = async (req, res) => {
    try {
      const eventId = req.params.id;
      const organizerId = req.user.id;
      
      const affectedRows = await updateEvent(eventId, organizerId, req.body);
      
      if(affectedRows > 0) {
        res.json({ message: 'Evento aggiornato' });
      } else {
        res.status(404).json({ message: 'Nessun cambiamento applicato' });
      }
    } catch (error) {
      if(error.message === 'EVENT_NOT_FOUND_OR_UNAUTHORIZED') {
        res.status(403).json({ message: 'Non autorizzato o evento inesistente' });
      } else {
        res.status(500).json({ message: 'Errore nell aggiornamento' });
      }
    }
  };
  
  export const deleteExistingEvent = async (req, res) => {
    try {
      const eventId = req.params.id;
      const organizerId = req.user.id;
      
      await deleteEvent(eventId, organizerId);
      res.json({ message: 'Evento eliminato' });
    } catch (error) {
      if(error.message === 'EVENT_NOT_FOUND_OR_UNAUTHORIZED') {
        res.status(403).json({ message: 'Non autorizzato o evento inesistente' });
      } else {
        res.status(500).json({ message: 'Errore nell eliminazione' });
      }
    }
  };