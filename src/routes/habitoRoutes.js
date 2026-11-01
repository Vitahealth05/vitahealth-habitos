/**
 * @file Rutas REST del módulo de Gestión de Hábitos.
 *
 * | Método | Ruta                          | Caso de uso                    |
 * |--------|-------------------------------|--------------------------------|
 * | GET    | /api/habitos                  | CU-02 Consultar hábitos        |
 * | GET    | /api/habitos/:id              | CU-02 Consultar un hábito      |
 * | POST   | /api/habitos                  | CU-01 Registrar hábito         |
 * | PUT    | /api/habitos/:id              | CU-03 Actualizar hábito        |
 * | DELETE | /api/habitos/:id              | CU-04 Eliminar hábito          |
 * | POST   | /api/habitos/:id/registros    | CU-05 Registrar cumplimiento   |
 */

'use strict';

const express = require('express');

/**
 * @param {ReturnType<import('../controllers/habitoController').crearHabitoController>} controlador
 * @returns {import('express').Router}
 */
function crearHabitoRoutes(controlador) {
  const router = express.Router();

  router.get('/', controlador.listar);
  router.get('/:id', controlador.obtener);
  router.post('/', controlador.crear);
  router.put('/:id', controlador.actualizar);
  router.delete('/:id', controlador.eliminar);
  router.post('/:id/registros', controlador.registrarCumplimiento);

  return router;
}

module.exports = { crearHabitoRoutes };
