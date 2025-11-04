const express = require('express');
const router = express.Router();
const { pool } = require('../config/database'); // <-- CORREGIDO
const { verifyToken, isAdmin } = require('../middleware/auth');
const { logAction } = require('../utils/audit');

// Obtener todos los artistas
router.get('/artists', verifyToken, isAdmin, async (req, res) => {
  try {
    const [artists] = await pool.execute(
      `SELECT a.*, u.email
       FROM artists a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC`
    );
    res.json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener artistas' });
  }
});

// Validar/Invalidar artista
router.put('/artists/:id/validate', verifyToken, isAdmin, async (req, res) => {
  try {
    const { validated } = req.body;
    
    const [artists] = await pool.execute(
      'SELECT * FROM artists WHERE id = ?',
      [req.params.id]
    );

    if (artists.length === 0) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }
    const artist = artists[0];

    const forbidden = ['Eminem', 'Dua Lipa', 'Catriel', 'Paco Amoroso'];
    if (validated && forbidden.map(name => name.toLowerCase()).includes(artist.name.toLowerCase())) {
      return res.status(400).json({
        message: `No se puede validar a ${artist.name}. Este artista está prohibido.`
      });
    }

    await pool.execute(
      'UPDATE artists SET validated = ? WHERE id = ?',
      [validated, req.params.id]
    );

    await logAction(
      req.user.id, // <-- CORREGIDO
      validated ? 'VALIDATE_ARTIST' : 'INVALIDATE_ARTIST',
      'artist',
      req.params.id,
      { validated: artist.validated },
      { validated },
      req.ip
    );
    res.json({
      message: validated ? 'Artista validado exitosamente' : 'Validación removida',
      validated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al validar artista' });
  }
});

// Eliminar artista
router.delete('/artists/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const [artists] = await pool.execute(
      'SELECT a.*, u.id as user_id FROM artists a JOIN users u ON a.user_id = u.id WHERE a.id = ?',
      [req.params.id]
    );

    if (artists.length === 0) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }
    const artist = artists[0];

    await logAction(
      req.user.id, // <-- CORREGIDO
      'DELETE_ARTIST',
      'artist',
      req.params.id,
      artist,
      null,
      req.ip
    );

    await pool.execute('DELETE FROM users WHERE id = ?', [artist.user_id]);
    res.json({ message: 'Artista eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar artista' });
  }
});

// Obtener todos los eventos
router.get('/events', verifyToken, isAdmin, async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT e.*, a.name as artist_name
       FROM events e
       JOIN artists a ON e.artist_id = a.id
       ORDER BY e.date DESC, e.time DESC`
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
});

// Eliminar evento
router.delete('/events/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    await logAction(
      req.user.id, // <-- CORREGIDO
      'ADMIN_DELETE_EVENT',
      'event',
      req.params.id,
      events[0],
      null,
      req.ip
    );
    
    await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar evento' });
  }
});

// --- ESTA ES LA FUNCIÓN CORREGIDA ---
// Obtener registro de auditoría
router.get('/audit', verifyToken, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await pool.query( // <-- CORREGIDO A .query()
      `SELECT al.*, u.email
       FROM audit_log al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT ${limit} OFFSET ${offset}` // <-- CORREGIDO
    );
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener auditoría' });
  }
});

module.exports = router;