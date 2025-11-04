const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// IMPORTAMOS LA FUNCIÓN DE INICIO DE LA BD
const { initDatabase } = require('./config/database');

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de requests
});
app.use('/api/', limiter);

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const artistRoutes = require('./routes/artistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/artist', artistRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Algo salió mal!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 3001;

// --- FUNCIÓN DE INICIO MEJORADA ---
async function startServer() {
  // 1. ESPERAMOS a que la base de datos esté lista
  await initDatabase();
  console.log('✅ Base de datos inicializada correctamente');

  // 2. SOLO ENTONCES iniciamos el servidor
  app.listen(PORT, () => {
    console.log(`✅ Oir La Música - Servidor corriendo en puerto ${PORT}`);
  });
}

// Llamamos a la nueva función de inicio
startServer();