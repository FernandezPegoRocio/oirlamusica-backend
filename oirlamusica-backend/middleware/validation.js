const { body, validationResult } = require('express-validator');

// Validaciones para registro
exports.validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email no válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .custom(value => {
      const forbidden = ['Eminem', 'Dua Lipa', 'Catriel', 'Paco Amoroso'];
      if (forbidden.some(artist => value.toLowerCase() === artist.toLowerCase())) {
        throw new Error('Este artista no está permitido en la plataforma');
      }
      return true;
    })
];

// Validaciones para eventos
exports.validateEvent = [
  body('title')
    .trim()
    .isLength({ min: 1 }) // <-- CORREGIDO
    .withMessage('El título es requerido'),
  body('date')
    .trim()
    .isLength({ min: 1 }) // <-- CORREGIDO
    .isISO8601()
    .withMessage('La fecha es requerida y debe ser válida'),
  body('time')
    .trim()
    .isLength({ min: 1 }) // <-- CORREGIDO
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('La hora es requerida (formato HH:MM)'),
  body('venue')
    .trim()
    .isLength({ min: 1 }) // <-- CORREGIDO
    .withMessage('El lugar es requerido'),
  body('entry_type')
    .isIn(['gorra', 'gratuito', 'beneficio', 'arancelado'])
    .withMessage('Tipo de entrada no válido'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio no válido'),
  body('ticket_url')
    .optional({ checkFalsy: true }) 
    .isURL()
    .withMessage('URL de tickets no válida'),
  body('flyer_url')
    .optional({ checkFalsy: true }) 
    .isURL()
    .withMessage('URL de flyer no válida')
];

// Middleware para verificar resultados de validación
exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};