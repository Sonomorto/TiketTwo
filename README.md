# TiketTwo
Questo progetto è una web application 3-tier realizzata per la gestione di eventi e biglietti. Gli organizzatori possono creare, modificare e pubblicare eventi, mentre gli utenti possono prenotare o acquistare i biglietti e ricevere conferme tramite notifiche.

## Descrizione

Il sistema permette:
- **Registrazione e Login:** Autenticazione per utenti e organizzatori, utilizzando JWT per la gestione delle sessioni.
- **Gestione Eventi:** Creazione, modifica, cancellazione e visualizzazione degli eventi, con dettagli come immagini, date e numero di posti disponibili.
- **Prenotazione e Acquisto Biglietti:** Possibilità per gli utenti di prenotare o acquistare biglietti, gestendo l’accesso agli eventi.
- **Dashboard Personale:** Sezione "I miei eventi" per tenere traccia delle prenotazioni e degli acquisti.
- **Notifiche:** Invio di notifiche (via email o in-app) per confermare le prenotazioni e aggiornare lo stato degli eventi.

## Tecnologie Utilizzate

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js con Express
- **Database:** MySQL

## Installazione e Configurazione

1. **Clonare il Repository:**

   ```bash
   git clone https://github.com/Sonomorto/TiketTwo.git
   cd TiketTwo

2. **Installare le Dipendenze:**

   ```bash
   npm install

3. **Configurare il Database:**

 - Creare un database MySQL.
 - Aggiornare il file di configurazione (es. .env o config.js) con le credenziali corrette.
   
4. **Avviare il Server:** 

      ```bash
      npm install
L'applicazione sarà accessibile all'indirizzo http://localhost:3000.

## API Endpoints
- /api/auth:
Gestione della registrazione, login e autenticazione tramite JWT.

- /api/events:
Endpoint per la gestione degli eventi (creazione, lettura, aggiornamento e cancellazione).

- /api/tickets:
Endpoint per la prenotazione e gestione dei biglietti.

## Diritti di creazione
  Leonardo Sanarighi – Svilupatore fullstack /Team 9 
  Valeria Mocci – Team Leader e Svilupatrice /Team 9
