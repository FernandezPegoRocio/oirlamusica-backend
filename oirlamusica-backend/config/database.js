const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Crear tablas si no existen
async function initDatabase() {
    try {
        // Tabla usuarios
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'artist') DEFAULT 'artist',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Tabla artistas
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS artists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                photo_url VARCHAR(500),
                phone VARCHAR(50),
                website VARCHAR(255),
                spotify VARCHAR(255),
                apple_music VARCHAR(255),
                tidal VARCHAR(255),
                youtube_music VARCHAR(255),
                youtube_channel VARCHAR(255),
                instagram VARCHAR(255),
                validated BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Tabla eventos
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                artist_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                venue VARCHAR(255) NOT NULL,
                entry_type ENUM('gorra', 'gratuito', 'beneficio', 'arancelado') NOT NULL,
                price DECIMAL(10,2),
                ticket_url VARCHAR(500),
                flyer_url VARCHAR(500),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
            )
        `);

        // Tabla de auditoría
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(255),
                entity VARCHAR(100),
                entity_id INT,
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        
        // No imprimimos el log aquí
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        process.exit(1); // Detiene la app si la BD falla
    }
}

// EXPORTAMOS EL POOL Y LA FUNCIÓN DE INICIO
module.exports = { pool, initDatabase };