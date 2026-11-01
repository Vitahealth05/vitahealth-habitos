/**
 * @file Pruebas del controlador con objetos req/res simulados.
 * Verifican los códigos HTTP y el formato de respuesta sin levantar el servidor.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearHabitoController } = require('../src/controllers/habitoController');
const { manejadorErrores } = require('../src/middlewares/errorHandler');
const { ErrorValidacion } = require('../src/models/habito');
const { ErrorNoEncontrado } = require('../src/services/habitoService');

/** Respuesta simulada de Express que guarda el estado y el cuerpo. */
function respuestaFalsa() {
  return {
    codigo: null,
    cuerpo: null,
    status(codigo) {
      this.codigo = codigo;
      return this;
    },
    json(cuerpo) {
      this.cuerpo = cuerpo;
      return this;
    },
  };
}

/** Ejecuta un manejador del controlador y, si falla, el middleware de errores. */
async function ejecutar(manejador, req) {
  const res = respuestaFalsa();
  await new Promise((resolver) => {
    const next = (error) => {
      manejadorErrores(error, req, res, () => {});
      resolver();
    };
    Promise.resolve(manejador(req, res, next)).then(() => setImmediate(resolver));
  });
  return res;
}

test('POST crear responde 201 con el hábito', async () => {
  const servicio = { crear: async (datos) => ({ id: 'abc', ...datos }) };
  const res = await ejecutar(crearHabitoController(servicio).crear, { body: { nombre: 'Leer' } });

  assert.equal(res.codigo, 201);
  assert.equal(res.cuerpo.ok, true);
  assert.equal(res.cuerpo.datos.id, 'abc');
});

test('Un ErrorValidacion se convierte en 400 con detalles', async () => {
  const servicio = {
    crear: async () => {
      throw new ErrorValidacion(['El nombre es obligatorio.']);
    },
  };
  const res = await ejecutar(crearHabitoController(servicio).crear, { body: {} });

  assert.equal(res.codigo, 400);
  assert.deepEqual(res.cuerpo.detalles, ['El nombre es obligatorio.']);
});

test('Un ErrorNoEncontrado se convierte en 404', async () => {
  const servicio = {
    obtener: async () => {
      throw new ErrorNoEncontrado();
    },
  };
  const res = await ejecutar(crearHabitoController(servicio).obtener, { params: { id: 'x' } });

  assert.equal(res.codigo, 404);
  assert.equal(res.cuerpo.ok, false);
});

test('GET listar responde 200 con el total', async () => {
  const servicio = { listar: async () => [{ id: '1' }, { id: '2' }] };
  const res = await ejecutar(crearHabitoController(servicio).listar, { query: {} });

  assert.equal(res.codigo, 200);
  assert.equal(res.cuerpo.total, 2);
});
