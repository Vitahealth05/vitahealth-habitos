/**
 * @file Middlewares de manejo de errores.
 * Centralizan las respuestas de error para que todas tengan el mismo formato:
 *   { ok: false, mensaje: string, detalles?: string[] }
 */

'use strict';

/**
 * Responde 404 cuando ninguna ruta de la API coincide.
 */
function rutaNoEncontrada(req, res) {
  res.status(404).json({ ok: false, mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/**
 * Convierte los errores de la aplicación en respuestas HTTP.
 * Express lo reconoce como manejador de errores porque recibe 4 parámetros.
 */
// eslint-disable-next-line no-unused-vars
function manejadorErrores(error, req, res, next) {
  // JSON mal formado en el cuerpo de la petición.
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, mensaje: 'El cuerpo de la petición no es un JSON válido' });
  }

  if (error.name === 'ErrorValidacion') {
    return res.status(400).json({ ok: false, mensaje: error.message, detalles: error.detalles });
  }

  if (error.name === 'ErrorNoEncontrado') {
    return res.status(404).json({ ok: false, mensaje: error.message });
  }

  // Error no previsto: se registra en consola y no se exponen detalles internos.
  console.error('[VitaHealth] Error interno:', error);
  return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
}

module.exports = { rutaNoEncontrada, manejadorErrores };
