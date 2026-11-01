/**
 * @file Controlador de hábitos.
 * Traduce las peticiones HTTP a llamadas del servicio y arma las respuestas.
 * No contiene lógica de negocio: solo recibe, delega y responde.
 */

'use strict';

/**
 * Envuelve un manejador async para que los errores lleguen al
 * middleware de errores de Express sin repetir try/catch.
 * @param {Function} manejador
 * @returns {Function}
 */
const capturarErrores = (manejador) => (req, res, next) => Promise.resolve(manejador(req, res, next)).catch(next);

/**
 * Crea el controlador inyectándole el servicio (facilita las pruebas).
 * @param {import('../services/habitoService').HabitoService} servicio
 */
function crearHabitoController(servicio) {
  return {
    /** GET /api/habitos?categoria=... */
    listar: capturarErrores(async (req, res) => {
      const habitos = await servicio.listar({ categoria: req.query.categoria });
      res.status(200).json({ ok: true, total: habitos.length, datos: habitos });
    }),

    /** GET /api/habitos/:id */
    obtener: capturarErrores(async (req, res) => {
      const habito = await servicio.obtener(req.params.id);
      res.status(200).json({ ok: true, datos: habito });
    }),

    /** POST /api/habitos */
    crear: capturarErrores(async (req, res) => {
      const habito = await servicio.crear(req.body || {});
      res.status(201).json({ ok: true, mensaje: 'Hábito creado correctamente', datos: habito });
    }),

    /** PUT /api/habitos/:id */
    actualizar: capturarErrores(async (req, res) => {
      const habito = await servicio.actualizar(req.params.id, req.body || {});
      res.status(200).json({ ok: true, mensaje: 'Hábito actualizado correctamente', datos: habito });
    }),

    /** DELETE /api/habitos/:id */
    eliminar: capturarErrores(async (req, res) => {
      await servicio.eliminar(req.params.id);
      res.status(200).json({ ok: true, mensaje: 'Hábito eliminado correctamente' });
    }),

    /** POST /api/habitos/:id/registros */
    registrarCumplimiento: capturarErrores(async (req, res) => {
      const habito = await servicio.registrarCumplimiento(req.params.id, req.body || {});
      res.status(201).json({ ok: true, mensaje: 'Cumplimiento registrado', datos: habito });
    }),
  };
}

module.exports = { crearHabitoController };
