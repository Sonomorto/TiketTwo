import mysql from 'mysql2/promise';
import logger from '../utils/logger.js';
import { config } from 'dotenv';

config(); // Caricamento variabili d'ambiente

// Configurazione del pool di connessioni
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0
});

// Test della connessione al database
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Connessione al database riuscita!');
    connection.release();
  } catch (error) {
    logger.error('❌ Errore di connessione al database:', error.message);
    process.exit(1);
  }
}

// Funzione per eseguire query generiche
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Gestione transazioni atomiche
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error; // Propagazione dell'errore
  } finally {
    connection.release();
  }
}

export { pool, testConnection, query, transaction }; // Aggiunta transazione