// auth.js - Gestione autenticazione e token JWT

import { API_BASE_URL } from './config.js';
import { showMessage } from './utils/helpers.js';

// Elementi DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('btnLogout');

// Funzione di login
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Credenziali non valide');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect alla dashboard o pagina precedente
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/dashboard.html';
    window.location.href = redirectUrl;

  } catch (error) {
    showMessage(error.message, 'error');
  }
};

// Funzione di registrazione
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registrazione fallita');
    }

    showMessage('Registrazione completata! Effettua il login', 'success');
    return true;

  } catch (error) {
    showMessage(error.message, 'error');
    return false;
  }
};

// Funzione di logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/auth.html';
};

// Verifica stato autenticazione
export const checkAuth = () => {
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;
  
  // Redirect se non autenticato
  if (!token && !currentPath.includes('auth.html')) {
    window.location.href = `/auth.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return false;
  }

  // Redirect se autenticato ma su pagina di login
  if (token && currentPath.includes('auth.html')) {
    window.location.href = '/dashboard.html';
    return false;
  }

  return true;
};

// Inizializzazione moduli auth
export const initAuth = () => {
  // Gestione form login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await login(email, password);
    });
  }

  // Gestione form registrazione
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value
      };
      await register(userData);
    });
  }

  // Gestione logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Controllo autenticazione globale
  checkAuth();
};

// Verifica ruolo utente
export const checkRole = (requiredRole) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.role === requiredRole;
};