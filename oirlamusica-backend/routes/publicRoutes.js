const express = require('express');
const router = express.Router();
const { pool } = require('../config/database'); // <-- CORREGIDO

// Obtener cartelera pública (eventos del mes)
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const monthPadded = month.padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    
    const startDate = `${year}-${monthPadded}-01`;
    const endDate = `${year}-${monthPadded}-${lastDay}`;

    const [events] = await pool.execute(
      `SELECT
         e.*,
         a.name as artist_name,
         a.photo_url as artist_photo,
         a.instagram,
         a.spotify,
         a.youtube_channel
       FROM events e
       JOIN artists a ON e.artist_id = a.id
       WHERE a.validated = true
         AND e.date >= ?
         AND e.date <= ?
       ORDER BY e.date, e.time`,
      [startDate, endDate]
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener calendario' });
  }
});

// Obtener próximos eventos
router.get('/upcoming', async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT
         e.*,
         a.name as artist_name,
         a.photo_url as artist_photo,
         a.instagram,
         a.spotify
       FROM events e
       JOIN artists a ON e.artist_id = a.id
       WHERE a.validated = true
         AND e.date >= CURDATE()
       ORDER BY e.date, e.time
       LIMIT 10`
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
});

// Obtener detalle de evento
router.get('/event/:id', async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT
         e.*,
         a.name as artist_name,
         a.photo_url as artist_photo,
         a.phone as artist_phone,
         a.website,
         a.instagram,
         a.spotify,
         a.apple_music,
         a.tidal,
         a.youtube_music,
         a.youtube_channel
       FROM events e
       JOIN artists a ON e.artist_id = a.id
       WHERE e.id = ? AND a.validated = true`,
      [req.params.id]
    );
    if (events.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    res.json(events[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener evento' });
  }
});

// Obtener lista de artistas validados
router.get('/artists', async (req, res) => {
  try {
    const [artists] = await pool.execute(
      `SELECT
         id,
         name,
         photo_url,
         instagram,
         spotify,
         youtube_channel
       FROM artists
       WHERE validated = true
       ORDER BY name`
    );
    res.json(artists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener artistas' });
  }
});

// Obtener eventos de un artista específico
router.get('/artist/:id/events', async (req, res) => {
  try {
    const [events] = await pool.execute(
      `SELECT
         e.*,
         a.name as artist_name
       FROM events e
       JOIN artists a ON e.artist_id = a.id
       WHERE a.id = ?
         AND a.validated = true
         AND e.date >= CURDATE()
       ORDER BY e.date, e.time`,
      [req.params.id]
    );
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener eventos del artista' });
  }
});

module.exports = router;