const express = require('express');
const router = express.Router();
const { pool } = require('../config/database'); // <-- CORREGIDO
const { verifyToken, isArtist } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
// ¡IMPORTAMOS LAS REGLAS DE VALIDACIÓN!
const { validateEvent, checkValidation } = require('../middleware/validation');

// Obtener perfil del artista
router.get('/profile', verifyToken, isArtist, async (req, res) => {
  try {
    const [artists] = await pool.execute(
      'SELECT * FROM artists WHERE user_id = ?',
      [req.user.id] // <-- CORREGIDO
    );
    if (artists.length === 0) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    res.json(artists[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
});

// Actualizar perfil del artista
router.put('/profile', verifyToken, isArtist, async (req, res) => {
  try {
    const {
      name, photo_url, phone, website,
      spotify, apple_music, tidal, youtube_music,
      youtube_channel, instagram
    } = req.body;

    const forbidden = ['Eminem', 'Dua Lipa', 'Catriel', 'Paco Amoroso'];
    if (forbidden.some(artist => name.toLowerCase() === artist.toLowerCase())) {
      return res.status(400).json({
        message: 'Este nombre de artista no está permitido'
      });
    }

    const [oldArtist] = await pool.execute(
      'SELECT * FROM artists WHERE user_id = ?',
      [req.user.id] // <-- CORREGIDO
    );

    await pool.execute(
      `UPDATE artists SET
       name = ?, photo_url = ?, phone = ?, website = ?,
       spotify = ?, apple_music = ?, tidal = ?, youtube_music = ?,
       youtube_channel = ?, instagram = ?
       WHERE user_id = ?`,
      [
        name, photo_url, phone, website,
        spotify, apple_music, tidal, youtube_music,
        youtube_channel, instagram, req.user.id // <-- CORREGIDO
      ]
    );

    await logAction(
      req.user.id, // <-- CORREGIDO
      'UPDATE_PROFILE',
      'artist',
      oldArtist[0].id,
      oldArtist[0],
      req.body,
      req.ip
    );
    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});


// --- ESTA ES LA RUTA CORREGIDA ---
// Ahora usa las reglas "validateEvent" y "checkValidation"
router.post('/events', verifyToken, isArtist, validateEvent, checkValidation, async (req, res) => {
// ----------------------------------
  try {
    const [artists] = await pool.execute(
      'SELECT id FROM artists WHERE user_id = ?',
      [req.user.id] // <-- CORREGIDO
    );
    if (artists.length === 0) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }
    const artistId = artists[0].id;

    const {
      title, date, time, venue,
      entry_type, price, ticket_url,
      flyer_url, description
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO events
       (artist_id, title, date, time, venue, entry_type, price, ticket_url, flyer_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        artistId, title, date, time, venue,
        entry_type, price || null, ticket_url || null,
        flyer_url || null, description || null
      ]
    );

    await logAction(
      req.user.id, // <-- CORREGIDO
      'CREATE_EVENT',
      'event',
      result.insertId,
      null,
      req.body,
      req.ip
    );
    res.status(201).json({
      message: 'Evento creado exitosamente',
      eventId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el evento' });
  }
});

// Obtener eventos del artista
router.get('/events', verifyToken, isArtist, async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT e.* FROM events e
       JOIN artists a ON e.artist_id = a.id
       WHERE a.user_id = ?
       ORDER BY e.date DESC, e.time DESC`,
      [req.user.id] // <-- CORREGIDO
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
});

// Actualizar evento
router.put('/events/:id', verifyToken, isArtist, validateEvent, checkValidation, async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT e.* FROM events e
       JOIN artists a ON e.artist_id = a.id
       WHERE e.id = ? AND a.user_id = ?`,
      [req.params.id, req.user.id] // <-- CORREGIDO
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado o no autorizado' });
    }
    const oldEvent = events[0];

    const {
      title, date, time, venue,
      entry_type, price, ticket_url,
      flyer_url, description
    } = req.body;

    await pool.execute(
      `UPDATE events SET
       title = ?, date = ?, time = ?, venue = ?,
       entry_type = ?, price = ?, ticket_url = ?,
       flyer_url = ?, description = ?
       WHERE id = ?`,
      [
        title, date, time, venue,
        entry_type, price || null, ticket_url || null,
        flyer_url || null, description || null,
        req.params.id
      ]
    );

    await logAction(
      req.user.id, // <-- CORREGIDO
      'UPDATE_EVENT',
      'event',
      req.params.id,
      oldEvent,
      req.body,
      req.ip
    );
    res.json({ message: 'Evento actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el evento' });
  }
});

// Eliminar evento
router.delete('/events/:id', verifyToken, isArtist, async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT e.* FROM events e
       JOIN artists a ON e.artist_id = a.id
       WHERE e.id = ? AND a.user_id = ?`,
      [req.params.id, req.user.id] // <-- CORREGIDO
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado o no autorizado' });
    }

    await logAction(
      req.user.id, // <-- CORREGIDO
      'DELETE_EVENT',
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
    res.status(500).json({ message: 'Error al eliminar el evento' });
  }
});

module.exports = router;