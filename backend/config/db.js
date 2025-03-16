import mysql from 'mysql2/promise';
import { logger } from '../utils/logger.js';

// Configurazione del pool di connessioni
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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