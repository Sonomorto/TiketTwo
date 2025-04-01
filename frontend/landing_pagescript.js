// Mappatura delle sezioni della pagina
const sections = {
    home: document.getElementById("home-section"),
    eventi: document.getElementById("eventi-section"),
    creaEvento: document.getElementById("crea-evento-section"),
    mieiEventi: document.getElementById("miei-eventi-section")
  };
  
  function showSection(section) {
    Object.values(sections).forEach(sec => sec.classList.add("hidden"));
    section.classList.remove("hidden");
  }
  
  // Gestione navigazione del menu
  document.getElementById("home-link").addEventListener("click", () => {
    showSection(sections.home);
  });
  document.getElementById("eventi-link").addEventListener("click", () => {
    showSection(sections.eventi);
    loadEvents(); // Carica gli eventi dal backend
  });
  document.getElementById("crea-evento-link").addEventListener("click", () => {
    showSection(sections.creaEvento);
  });
  document.getElementById("miei-eventi-link").addEventListener("click", () => {
    showSection(sections.mieiEventi);
    loadMyEvents(); // Se implementi una rotta per gli eventi dell'utente
  });
  
  // Gestione Modal per Login/Registrazione
  const authModal = document.getElementById("auth-modal");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const closeModal = document.querySelector(".close-modal");
  
  // Apertura delle form di Login/Registrazione
  loginBtn.addEventListener("click", () => {
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("register-form").classList.add("hidden");
    authModal.classList.remove("hidden");
  });
  registerBtn.addEventListener("click", () => {
    document.getElementById("register-form").classList.remove("hidden");
    document.getElementById("login-form").classList.add("hidden");
    authModal.classList.remove("hidden");
  });
  closeModal.addEventListener("click", () => {
    authModal.classList.add("hidden");
  });
  
  // Toggle fra le form di Login e Registrazione
  document.getElementById("toggle-auth-link").addEventListener("click", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    
    if (loginForm.classList.contains("hidden")) {
      registerForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
      document.getElementById("toggle-auth").innerHTML = 'Non hai un account? <span id="toggle-auth-link">Registrati</span>';
    } else {
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
      document.getElementById("toggle-auth").innerHTML = 'Hai già un account? <span id="toggle-auth-link">Accedi</span>';
    }
  });
  
  /* 
    Funzione helper per gestire le chiamate alle API.
    Viene usata per inviare richieste al backend Express sullo stesso dominio.
  */
  async function apiCall(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    try {
      const response = await fetch(url, options);
      const jsonData = await response.json();
      if (!response.ok) {
        throw new Error(jsonData.message || 'Errore nella chiamata API');
      }
      return jsonData;
    } catch (error) {
      console.error("API Call Error:", error);
      throw error;
    }
  }
  
  // --- Gestione delle operazioni utente ---
  
  // Login: invia email e password a /api/v1/auth/login
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    try {
      const res = await apiCall('/api/v1/auth/login', 'POST', { email, password });
      console.log("Login effettuato:", res);
      alert("Login effettuato con successo!");
      authModal.classList.add("hidden");
      // Qui potresti salvare il token per le chiamate future (es. in localStorage)
    } catch (error) {
      alert("Errore durante il login: " + error.message);
    }
  });
  
  // Registrazione: invia nome, email e password a /api/v1/auth/register
  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    try {
      const res = await apiCall('/api/v1/auth/register', 'POST', { name, email, password });
      console.log("Registrazione effettuata:", res);
      alert("Registrazione effettuata con successo!");
      authModal.classList.add("hidden");
    } catch (error) {
      alert("Errore durante la registrazione: " + error.message);
    }
  });
  
  // Creazione Evento: invia i dati del nuovo evento a /api/v1/events
  document.getElementById("crea-evento-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome-evento").value;
    const descrizione = document.getElementById("descrizione-evento").value;
    const data = document.getElementById("data-evento").value;
    const posti = document.getElementById("posti-disponibili").value;
    const immagine = document.getElementById("immagine-evento").value;
    
    const newEvent = {
      nome,
      descrizione,
      data,
      posti,
      immagine
    };
    
    try {
      const res = await apiCall('/api/v1/events', 'POST', newEvent);
      console.log("Evento creato:", res);
      alert("Evento creato con successo!");
      e.target.reset();
    } catch (error) {
      alert("Errore nella creazione dell'evento: " + error.message);
    }
  });
  
  // Caricamento degli eventi: recupera gli eventi dal backend con GET /api/v1/events
  async function loadEvents() {
    try {
      const events = await apiCall('/api/v1/events', 'GET');
      populateEvents(events);
    } catch (error) {
      alert("Errore nel caricamento degli eventi: " + error.message);
    }
  }
  
  // Funzione per mostrare gli eventi nella sezione "Eventi"
  function populateEvents(events) {
    const eventListDiv = document.getElementById("event-listing");
    eventListDiv.innerHTML = "";
    
    if (Array.isArray(events) && events.length > 0) {
      events.forEach(event => {
        const eventDiv = document.createElement("div");
        eventDiv.classList.add("event-card");
        eventDiv.innerHTML = `
          <img src="${event.immagine || 'https://picsum.photos/200/100'}" alt="${event.nome}">
          <h3>${event.nome}</h3>
          <p>${event.descrizione}</p>
          <p><strong>Data:</strong> ${new Date(event.data).toLocaleString()}</p>
          <p><strong>Posti Disponibili:</strong> ${event.posti}</p>
          <button onclick="prenotaEvento(${event.id})">Prenota</button>
        `;
        eventListDiv.appendChild(eventDiv);
      });
    } else {
      eventListDiv.innerHTML = "<p>Nessun evento disponibile al momento.</p>";
    }
  }
  
  // Prenotazione Evento: invia l'ID Evento a /api/v1/tickets per prenotare
  async function prenotaEvento(id) {
    try {
      const res = await apiCall('/api/v1/tickets', 'POST', { eventId: id });
      console.log("Prenotazione effettuata:", res);
      alert("Prenotazione effettuata con successo!");
      // Puoi aggiornare la sezione "I miei Eventi" o la lista degli eventi se necessario
    } catch (error) {
      alert("Errore nella prenotazione: " + error.message);
    }
  }
  
  // (Opzionale) Caricamento degli eventi appartenenti all'utente
  async function loadMyEvents() {
    try {
      // Assumiamo che esista una rotta dedicata agli eventi creati o prenotati dall'utente
      const myEvents = await apiCall('/api/v1/events/my', 'GET');
      const myEventsDiv = document.getElementById("my-events-list");
      myEventsDiv.innerHTML = "";
      if (Array.isArray(myEvents) && myEvents.length > 0) {
        myEvents.forEach(event => {
          const eventItem = document.createElement("div");
          eventItem.classList.add("event-card");
          eventItem.innerHTML = `
            <h3>${event.nome}</h3>
            <p>${event.descrizione}</p>
            <p>${new Date(event.data).toLocaleString()}</p>
          `;
          myEventsDiv.appendChild(eventItem);
        });
      } else {
        myEventsDiv.innerHTML = "<p>Non hai eventi attivi.</p>";
      }
    } catch (error) {
      alert("Errore nel caricamento dei tuoi eventi: " + error.message);
    }
  }  