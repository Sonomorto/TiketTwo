import mysql from 'mysql2/promise';
import logger from '../utils/logger.js';
import { config } from 'dotenv';

config(); // Caricamento variabili d'ambiente

// Configurazione del pool di connessioni con retry
const createPool = (retries = 3, delay = 5000) => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Gestione errori del pool
  pool.on('error', (err) => {
    logger.error('Errore nel pool di connessioni:', err);
  });

  return pool;
};

const pool = createPool();

// Test della connessione al database con retry
async function testConnection(retries = 3, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      logger.info('✅ Connessione al database riuscita!');
      connection.release();
      return true;
    } catch (error) {
      logger.error(`❌ Tentativo ${i + 1}/${retries} fallito:`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('❌ Impossibile stabilire la connessione al database dopo tutti i tentativi');
  process.exit(1);
}

// Funzione per eseguire query generiche con gestione errori
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Errore nell\'esecuzione della query:', {
      sql,
      params,
      error: error.message
    });
    throw error;
  }
}

// Gestione transazioni atomiche con retry
async function transaction(callback, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      connection.release();
      return result;
    } catch (error) {
      await connection.rollback();
      connection.release();
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Funzione per chiudere il pool
async function closePool() {
  try {
    await pool.end();
    logger.info('Pool di connessioni chiuso correttamente');
  } catch (error) {
    logger.error('Errore nella chiusura del pool:', error.message);
    throw error;
  }
}

export { pool, testConnection, query, transaction, closePool };