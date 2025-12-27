import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20, // Maximum number of connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Initialize database tables
const initDB = async () => {
    let client;
    try {
        client = await pool.connect();

        // Create users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create transaksi table
        await client.query(`
      CREATE TABLE IF NOT EXISTS transaksi (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tanggal DATE NOT NULL,
        tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
        jumlah DECIMAL(15, 2) NOT NULL,
        keterangan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log('✅ Database tables initialized successfully');
        console.log('✅ Database connection is working!');
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        console.error('⚠️  Server will continue running, but database features will not work.');
        console.error('⚠️  Please verify your NeonTech credentials in .env file');
    } finally {
        if (client) client.release();
    }
};

// Initialize database on import
initDB();

export default pool;
