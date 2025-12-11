import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Initialize Pool
let pool;

export async function initDB() {
    if (pool) return pool;

    try {
        console.log("Connecting to PostgreSQL...");
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Required for Neon/most cloud Postgres
            }
        });

        // Test connection
        await pool.query('SELECT 1');
        console.log("Connected to PostgreSQL successfully.");

        // Create Tables
        // Note: Postgres uses SERIAL for auto-increment
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                organizer_id INTEGER REFERENCES users(id),
                budget TEXT,
                date TEXT,
                location TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                giver_name TEXT,
                giver_email TEXT,
                receiver_name TEXT,
                token TEXT UNIQUE,
                wishlist TEXT,
                is_revealed BOOLEAN DEFAULT FALSE
            );
        `);

        console.log("Database initialized and tables verified.");
        return pool;
    } catch (error) {
        console.error("Failed to initialize database:", error);
        throw error;
    }
}

// User Helpers
export async function createUser(email, passwordHash) {
    const pool = await initDB();
    const result = await pool.query(
        `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id`,
        [email, passwordHash]
    );
    return result.rows[0].id;
}

export async function findUserByEmail(email) {
    const pool = await initDB();
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rows[0];
}

// Event & Match Helpers
export async function createEvent({ budget, date, location, message, organizerId }) {
    const pool = await initDB();
    // Assuming organizerId might be passed passed in future, but for now schema has it.
    // Adjusted logic: If organizerId is undefined, we might need to handle it or insert NULL.
    // The current server.js endpoint doesn't extract organizerId from session yet (JWT not fully implemented),
    // but we should support it in the DB layer.

    const result = await pool.query(
        `INSERT INTO events (budget, date, location, message) VALUES ($1, $2, $3, $4) RETURNING id`,
        [budget, date, location, message]
    );
    return result.rows[0].id;
}

export async function createMatch({ eventId, giverName, giverEmail, receiverName, token }) {
    const pool = await initDB();
    await pool.query(
        `INSERT INTO matches (event_id, giver_name, giver_email, receiver_name, token, wishlist) VALUES ($1, $2, $3, $4, $5, $6)`,
        [eventId, giverName, giverEmail, receiverName, token, '']
    );
}

export async function getMatchByToken(token) {
    const pool = await initDB();

    // 1. Get my match info AND event info
    // JOIN syntax is standard SQL, same as SQLite mostly
    const result = await pool.query(
        `SELECT 
            m.event_id,
            m.giver_name, 
            m.receiver_name, 
            m.wishlist as my_wishlist,
            e.budget, 
            e.date, 
            e.location, 
            e.message 
         FROM matches m 
         JOIN events e ON m.event_id = e.id 
         WHERE m.token = $1`,
        [token]
    );

    const match = result.rows[0];

    if (!match) return null;

    // 2. Get my receiver's wishlist
    const receiverResult = await pool.query(
        `SELECT wishlist FROM matches WHERE event_id = $1 AND giver_name = $2`,
        [match.event_id, match.receiver_name]
    );

    const receiverRow = receiverResult.rows[0];

    return {
        ...match,
        receiver_wishlist: receiverRow ? receiverRow.wishlist : ''
    };
}

export async function updateWishlist(token, wishlist) {
    const pool = await initDB();
    const result = await pool.query(
        `UPDATE matches SET wishlist = $1 WHERE token = $2`,
        [wishlist, token]
    );
    return result.rowCount > 0;
}

export async function markAsRevealed(token) {
    const pool = await initDB();
    await pool.query(`UPDATE matches SET is_revealed = TRUE WHERE token = $1`, [token]);
}

export async function getSantaFor(eventId, receiverName) {
    const pool = await initDB();
    const result = await pool.query(
        `SELECT giver_name, giver_email, token FROM matches WHERE event_id = $1 AND receiver_name = $2`,
        [eventId, receiverName]
    );
    return result.rows[0];
}
