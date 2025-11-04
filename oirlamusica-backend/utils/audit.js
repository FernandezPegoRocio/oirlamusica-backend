const { pool } = require('../config/database'); // <-- CORREGIDO

exports.logAction = async (
  userId,
  action,
  entity,
  entityId,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  db = pool 
) => {
  try {
    await db.execute(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, old_values, new_values, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entity,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress
      ]
    );
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};