const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database'); // <-- CORREGIDO
const { validateRegister, checkValidation } = require('../middleware/validation');
const { logAction } = require('../utils/audit');

// Registro
router.post('/register', validateRegister, checkValidation, async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    let newUserId;
    let newArtistId;

    try {
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, 'artist']
      );
      newUserId = userResult.insertId;

      const [artistResult] = await connection.execute(
        'INSERT INTO artists (user_id, name, phone) VALUES (?, ?, ?)',
        [newUserId, name, phone || null]
      );
      newArtistId = artistResult.insertId;

      await logAction(
        newUserId,
        'REGISTER',
        'user',
        newUserId,
        null,
        { email, name },
        req.ip,
        connection
      );

      await connection.commit();

    } catch (error) {
      await connection.rollback(); 
      throw error; 
    } finally {
      connection.release(); 
    }

    // Firmamos el token con 'userId'
    const token = jwt.sign(
      { userId: newUserId, email, role: 'artist' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registro exitoso',
      token,
      user: {
        id: newUserId,
        email,
        role: 'artist',
        artistId: newArtistId,
        name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el registro' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.execute(
      'SELECT u.*, a.id as artist_id, a.name FROM users u LEFT JOIN artists a ON u.id = a.user_id WHERE u.email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
    
    const user = users[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    await logAction(user.id, 'LOGIN', 'user', user.id, null, null, req.ip);

    // Firmamos el token con 'userId'
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        artistId: user.artist_id,
        name: user.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el login' });
  }
});

module.exports = router;