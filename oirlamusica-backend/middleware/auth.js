const jwt = require('jsonwebtoken');
const { pool } = require('../config/database'); // <-- CORREGIDO

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.execute(
      'SELECT id, email, role FROM users WHERE id = ?',
      [decoded.userId] // Usamos 'userId' del token
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no válido' });
    }

    req.user = users[0]; // Guardamos el usuario (con id, email, role)
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token no válido' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

exports.isArtist = (req, res, next) => {
  if (req.user.role !== 'artist') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de artista.' });
  }
  next();
};