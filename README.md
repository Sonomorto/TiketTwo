# TicketTwo - Sistema di Gestione Eventi

## Descrizione
TicketTwo è un'applicazione web per la gestione completa degli eventi che permette agli organizzatori di pubblicare eventi e agli utenti di acquistare biglietti e ricevere conferme via notifica.

## Funzionalità Principali

### Per gli Utenti
- 👤 Registrazione e login sicuro
- 🎫 Ricerca e prenotazione biglietti per eventi
- 📱 Ricezione notifiche per conferme e aggiornamenti
- 📅 Sezione "I miei eventi" per gestire le prenotazioni
- 🎟️ Codice alfanumerico univoco di 18 cifre per la verifica dei biglietti

### Per gli Organizzatori
- 🎭 Creazione e gestione completa degli eventi
- ℹ️ Caricamento dettagli di un evento
- 📊 Gestione della disponibilità dei posti
- 📈 Dashboard con statistiche e report
- ✅ Sistema di verifica biglietti all'ingresso

## Tecnologie Utilizzate

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- Winston (Logger)

### Database
- MySQL

## Requisiti di Sistema
- Node.js (v14 o superiore)
- MySQL (v8.0 o superiore)
- NPM o Yarn

## Installazione

1. Clona il repository:
```bash
git clone https://github.com/Sonomorto/TicketTwo.git
cd TicketTwo
```

2. Installa le dipendenze:
```bash
npm install express mysql2 winston joi bcrypt jsonwebtoken dotenv cors
npm install --save-dev nodemon jest supertest
```

3. Configura il database:
- Crea un database MySQL
- Esegui gli script di creazione delle tabelle forniti
- Configura le variabili d'ambiente nel file `.env`

4. Avvia l'applicazione:
```bash
npm start
```

## Struttura del Progetto
```
tickettwo/
├── frontend/
│   ├── public/
│   └── src/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── utils/
├── database/
│   └── schema.sql
└── docs/
```

## Configurazione Logger
Il sistema utilizza Winston per il logging con i seguenti livelli:
- ERROR: Per errori critici
- WARN: Per avvisi
- INFO: Per informazioni generali
- DEBUG: Per informazioni di debug

## Contribuire
Le pull request sono benvenute. Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

## Autori
- **Leonardo Sanarighi** - Sviluppatore Fullstack / Team 9
- **Valeria Mocci** - Team Leader e Sviluppatrice / Team 9