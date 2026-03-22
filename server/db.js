const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'collabx',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Database initialization logic
async function initDB() {
  try {
    // Try to create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'collabx'}`);
    await connection.end();
    
    // Create tables (Removed grad year and phone as requested)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Proactively check and add college column if missing
    try {
      const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE "college"');
      if (columns.length === 0) {
        await pool.query('ALTER TABLE users ADD COLUMN college VARCHAR(255) AFTER password');
        console.log('✅ Added "college" column to users table');
      }
    } catch (columnErr) {
      console.warn('⚠️ Column check warning:', columnErr.message);
    }

    // Optionally extend to contests and rooms for full persistence
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        problems JSON,
        duration_seconds INT,
        start_time BIGINT,
        state ENUM('upcoming', 'active', 'ended') DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ MySQL Database and Tables initialized successfully');
  } catch (err) {
    console.error('❌ Database Initialization failed:', err.message);
    console.log('Ensure MySQL is running and credentials in .env are correct.');
  }
}

initDB();

module.exports = pool;
