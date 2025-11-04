const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// --- ¡IMPORTANTE! MODIFICA ESTOS DATOS ---
// Define los datos de tu cuenta de administrador
const ADMIN_EMAIL = 'admin@oirla.musica';
const ADMIN_PASSWORD = 'tuContraseñaSegura'; // Elige una contraseña fuerte
const ADMIN_NAME = 'Admin OirLaMusica';
// ------------------------------------------

// Configuración de la base de datos (tomada de tu config/database.js y .env)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'oirlafeliz',
  password: process.env.DB_PASSWORD || '48416lafeliz',
  database: process.env.DB_NAME || 'oirlafeliz_database'
};

async function createAdmin() {
  let connection;
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Conexión exitosa.');

    // 1. Encriptar la contraseña
    console.log('Encriptando contraseña...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Usamos una transacción
    await connection.beginTransaction();

    // 2. Crear el usuario en la tabla 'users'
    console.log('Creando usuario en la tabla `users`...');
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [ADMIN_EMAIL, hashedPassword, 'admin']
    );
    
    const newUserId = userResult.insertId;
    console.log(`Usuario 'admin' creado con ID: ${newUserId}`);

    // 3. Crear el perfil asociado en la tabla 'artists'
    console.log('Creando perfil en la tabla `artists`...');
    await connection.execute(
      'INSERT INTO artists (user_id, name, validated) VALUES (?, ?, ?)',
      [newUserId, ADMIN_NAME, true] // true = validado
    );

    console.log('Perfil de administrador creado y validado.');

    // 4. Confirmar la transacción
    await connection.commit();

    console.log('¡ÉXITO!');
    console.log('La cuenta de administrador ha sido creada.');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log('Ya puedes iniciar sesión como administrador.');

  } catch (error) {
    console.error('ERROR: No se pudo crear el administrador.');
    console.error(error.message);
    
    if (connection) {
      console.log('Revirtiendo cambios (rollback)...');
      await connection.rollback();
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión con la base de datos cerrada.');
    }
  }
}

// Ejecutar la función
createAdmin();