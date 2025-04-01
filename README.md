# TiketTwo 🎫

## Descrizione
TiketTwo è una web application 3-tier per la gestione di eventi e biglietti. Il sistema permette agli organizzatori di creare e gestire eventi, mentre gli utenti possono prenotare biglietti e ricevere conferme in-app.

### Funzionalità Principali
- **Autenticazione**
  - Registrazione utenti e organizzatori
  - Login con JWT
  - Gestione sessioni sicura

- **Gestione Eventi**
  - Creazione e modifica eventi
  - Upload immagini
  - Gestione posti disponibili
  - Calendario eventi

- **Sistema Biglietti**
  - Prenotazione biglietti
  - Acquisto immediato
  - Codice numerico di 16 cifre per l'accesso
  - Storico acquisti

- **Dashboard**
  - Area personale utente
  - Gestione prenotazioni
  - Storico eventi
  - Statistiche partecipazione

- **Sistema Notifiche**
  - Notifiche in-app
  - Conferme prenotazioni
  - Aggiornamenti eventi

## Tecnologie Utilizzate

### Frontend
- HTML5
- CSS3 (con Flexbox e Grid)
- JavaScript (ES6+)
- Local Storage per cache

### Backend
- Node.js
- Express.js
- MySQL
- JWT per autenticazione
- Rate limiting
- Helmet per sicurezza

### Database
- MySQL
- Pool di connessioni
- Transazioni atomiche
- Query parametrizzate

## Requisiti di Sistema
- Node.js >= 14.x
- MySQL >= 8.0
- NPM >= 6.x

## Installazione e Configurazione

1. **Clonare il Repository**
   ```bash
   git clone https://github.com/Sonomorto/TiketTwo.git
   cd TiketTwo
   ```

2. **Installare le Dipendenze**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configurare il Database**
   - Creare un database MySQL
   - Copiare `.env_example` in `.env`
   - Configurare le variabili d'ambiente:
     ```env
     DB_HOST=your_host
     DB_PORT=your_port
     DB_USER=your_user
     DB_PASSWORD=your_password
     DB_NAME=your_database
     ```

4. **Avviare l'Applicazione**
   ```bash
   # Backend
   cd backend
   npm start

   # Frontend
   cd frontend
   npm start
   ```

L'applicazione sarà accessibile su:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

### API Pubbliche
- `POST /api/v1/auth/register` - Registrazione utente
- `POST /api/v1/auth/login` - Login utente
- `GET /api/v1/events` - Lista eventi pubblici
- `GET /api/v1/events/:id` - Dettaglio evento pubblico

### API Protette (Richiedono JWT)
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/events` - Crea evento (solo organizzatori)
- `PUT /api/v1/events/:id` - Modifica evento (solo organizzatori)
- `DELETE /api/v1/events/:id` - Elimina evento (solo organizzatori)
- `GET /api/v1/tickets` - Lista biglietti utente
- `POST /api/v1/tickets` - Prenota biglietto
- `GET /api/v1/tickets/:id` - Dettaglio biglietto
- `PUT /api/v1/tickets/:id` - Modifica biglietto
- `GET /api/v1/notifications` - Lista notifiche
- `PUT /api/v1/notifications/:id` - Marca notifica come letta
- `DELETE /api/v1/notifications/:id` - Elimina notifica

## Sicurezza
- Autenticazione JWT
- Rate limiting
- Protezione CORS
- Sanitizzazione input
- Query parametrizzate
- Headers di sicurezza con Helmet

## Contribuire
1. Fork il repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Autori
- **Leonardo Sanarighi** - Sviluppatore Fullstack / Team 9
- **Valeria Mocci** - Team Leader e Sviluppatrice / Team 9