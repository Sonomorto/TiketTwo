// frontend/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // GESTIONE NAVBAR MOBILE
    // ===============================================
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    const header = document.querySelector('header');
  
    mobileMenuButton.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileMenuButton.classList.toggle('open');
    });
  
    // Chiudi menu mobile al click fuori
    document.addEventListener('click', (e) => {
      if(!header.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        mobileMenuButton.classList.remove('open');
      }
    });
  
    // ===============================================
    // SCROLL SMOOTH E ACTIVE LINK
    // ===============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  
    // Aggiungi classe active al link corrente
    window.addEventListener('scroll', () => {
      const sections = document.querySelectorAll('section');
      const scrollPosition = window.scrollY + 100;
  
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');
  
        if(scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          document.querySelector(`a[href="#${sectionId}"]`).classList.add('active');
        } else {
          document.querySelector(`a[href="#${sectionId}"]`).classList.remove('active');
        }
      });
    });
  
    // ===============================================
    // CARICAMENTO DINAMICO EVENTI (MOCK API)
    // ===============================================
    const eventsContainer = document.getElementById('events-grid');
    
    const renderEvents = (events) => {
      eventsContainer.innerHTML = events.map(event => `
        <div class="event-card">
          <img src="${event.image}" alt="${event.title}">
          <div class="event-info">
            <h3>${event.title}</h3>
            <p class="event-date">${new Date(event.date).toLocaleDateString()}</p>
            <p class="event-location">📍 ${event.location}</p>
            <div class="event-actions">
              <button class="btn primary" data-event-id="${event.id}">Dettagli</button>
              ${event.tickets > 0 ? 
                `<button class="btn secondary" data-event-id="${event.id}">Acquista</button>` : 
                '<span class="sold-out">Esaurito</span>'}
            </div>
          </div>
        </div>
      `).join('');
    };
  
    // Simula chiamata API
    const loadEvents = async () => {
      try {
        // Sostituire con fetch reale
        const mockEvents = [
          {
            id: 1,
            title: 'Concerto Rock',
            date: '2024-06-15',
            location: 'Arena di Verona',
            image: 'img/concert.jpg',
            tickets: 100
          },
          // Altri eventi...
        ];
        
        renderEvents(mockEvents);
      } catch (error) {
        console.error('Errore nel caricamento eventi:', error);
      }
    };
  
    // ===============================================
    // GESTIONE FORM DI CONTATTO
    // ===============================================
    const contactForm = document.getElementById('contact-form');
    
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());
      
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
  
        if(!response.ok) throw new Error('Errore nella richiesta');
        
        contactForm.reset();
        showToast('Messaggio inviato con successo!', 'success');
      } catch (error) {
        showToast('Errore nell\'invio del messaggio', 'error');
      }
    });
  
    // ===============================================
    // FUNZIONALITÀ AGGIUNTIVE
    // ===============================================
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  
    // Inizializzazione
    loadEvents();
  });