/**
 * Jimmy Yodeler - Military Voice Procedure Trainer
 * Database Connection Module
 */

const mysql = require('mysql2/promise');
const config = require('./config');

// Create a connection pool
const pool = mysql.createPool({
  host: config.DB.HOST,
  user: config.DB.USER,
  password: config.DB.PASSWORD,
  database: config.DB.NAME,
  port: config.DB.PORT,
  waitForConnections: true,
  connectionLimit: config.DB.CONNECTION_LIMIT,
  queueLimit: 0
});

/**
 * Connect to the database and verify connection
 * @returns {Promise<void>}
 */
async function connectDB() {
  try {
    // Test the connection
    const connection = await pool.getConnection();
    console.log(`Connected to MySQL database: ${config.DB.NAME}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
}

/**
 * Execute a SQL query with parameters
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', sql);
    console.error('Parameters:', params);
    throw error;
  }
}

/**
 * Get a single row from a query
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} - Single row or null
 */
async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Insert a record and return the inserted ID
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<number>} - Inserted ID
 */
async function insert(table, data) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO ${table} SET ?`,
      [data]
    );
    return result.insertId;
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error.message);
    throw error;
  }
}

/**
 * Update records in a table
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {string} whereClause - WHERE clause
 * @param {Array} whereParams - WHERE parameters
 * @returns {Promise<number>} - Number of affected rows
 */
async function update(table, data, whereClause, whereParams = []) {
  try {
    const setClauses = [];
    const setParams = [];
    
    // Build SET clause
    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = ?`);
      setParams.push(value);
    }
    
    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClause}`;
    const params = [...setParams, ...whereParams];
    
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error(`Error updating ${table}:`, error.message);
    throw error;
  }
}

module.exports = {
  connectDB,
  query,
  queryOne,
  insert,
  update,
  pool
};
