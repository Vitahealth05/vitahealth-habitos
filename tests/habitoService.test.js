/**
 * @file Pruebas unitarias del servicio y modelo de hábitos.
 * Ejecutar con: npm test  (usa el runner nativo node:test, sin dependencias).
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HabitoRepository = require('../src/repositories/habitoRepository');
const { HabitoService, ErrorNoEncontrado, fechaISO, calcularRacha } = require('../src/services/habitoService');
const { ErrorValidacion, validarDatosHabito } = require('../src/models/habito');

/** Crea un servicio con un archivo de datos temporal y vacío. */
function crearServicioDePrueba() {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'vitahealth-'));
  return new HabitoService(new HabitoRepository(path.join(carpeta, 'habitos.json')));
}

/** Datos válidos de ejemplo. */
const habitoAgua = {
  nombre: 'Tomar agua',
  descripcion: 'Mantenerme hidratada',
  categoria: 'hidratacion',
  frecuencia: 'diaria',
  meta: 8,
  unidad: 'vasos',
};

test('validarDatosHabito acepta datos correctos', () => {
  assert.deepEqual(validarDatosHabito(habitoAgua), []);
});

test('validarDatosHabito detecta campos obligatorios faltantes', () => {
  const errores = validarDatosHabito({});
  assert.equal(errores.length, 4); // nombre, categoría, frecuencia, meta
});

test('CU-01: crear un hábito lo guarda con id y resumen en cero', async () => {
  const servicio = crearServicioDePrueba();
  const creado = await servicio.crear(habitoAgua);

  assert.ok(creado.id);
  assert.equal(creado.nombre, 'Tomar agua');
  assert.equal(creado.resumen.cantidadHoy, 0);
  assert.equal((await servicio.listar()).length, 1);
});

test('CU-01: crear con datos inválidos lanza ErrorValidacion', async () => {
  const servicio = crearServicioDePrueba();
  await assert.rejects(() => servicio.crear({ ...habitoAgua, meta: -1 }), ErrorValidacion);
});

test('CU-02: listar filtra por categoría', async () => {
  const servicio = crearServicioDePrueba();
  await servicio.crear(habitoAgua);
  await servicio.crear({ ...habitoAgua, nombre: 'Caminar', categoria: 'actividad_fisica', meta: 30, unidad: 'min' });

  assert.equal((await servicio.listar({ categoria: 'actividad_fisica' })).length, 1);
  assert.equal((await servicio.listar()).length, 2);
});

test('CU-03: actualizar cambia solo los campos enviados', async () => {
  const servicio = crearServicioDePrueba();
  const creado = await servicio.crear(habitoAgua);
  const actualizado = await servicio.actualizar(creado.id, { meta: 10 });

  assert.equal(actualizado.meta, 10);
  assert.equal(actualizado.nombre, 'Tomar agua');
  assert.equal(actualizado.fechaCreacion, creado.fechaCreacion);
});

test('CU-04: eliminar borra el hábito y luego responde no encontrado', async () => {
  const servicio = crearServicioDePrueba();
  const creado = await servicio.crear(habitoAgua);
  await servicio.eliminar(creado.id);

  await assert.rejects(() => servicio.obtener(creado.id), ErrorNoEncontrado);
  await assert.rejects(() => servicio.eliminar(creado.id), ErrorNoEncontrado);
});

test('CU-05: registrar cumplimiento acumula la cantidad del día', async () => {
  const servicio = crearServicioDePrueba();
  const creado = await servicio.crear(habitoAgua);
  await servicio.registrarCumplimiento(creado.id, { cantidad: 5 });
  const resultado = await servicio.registrarCumplimiento(creado.id, { cantidad: 3 });

  assert.equal(resultado.resumen.cantidadHoy, 8);
  assert.equal(resultado.resumen.porcentajeHoy, 100);
  assert.equal(resultado.resumen.metaCumplidaHoy, true);
  assert.equal(resultado.registros.length, 1);
});

test('CU-05: no permite fechas futuras ni cantidades inválidas', async () => {
  const servicio = crearServicioDePrueba();
  const creado = await servicio.crear(habitoAgua);

  await assert.rejects(
    () => servicio.registrarCumplimiento(creado.id, { cantidad: 1, fecha: '2999-01-01' }),
    ErrorValidacion,
  );
  await assert.rejects(() => servicio.registrarCumplimiento(creado.id, { cantidad: 0 }), ErrorValidacion);
});

test('CU-06: calcularRacha cuenta días consecutivos cumplidos', () => {
  const hoy = fechaISO();
  const dias = [0, 1, 2, 4].map((atras) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - atras);
    return { fecha: fechaISO(fecha), cantidad: 8 };
  });
  const habito = { meta: 8, registros: dias };

  // Hoy, ayer y antier cumplidos; hace 3 días falta → racha de 3.
  assert.equal(calcularRacha(habito, hoy), 3);
});

test('CU-06: la racha se mantiene si hoy todavía no se ha cumplido', () => {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const habito = { meta: 2, registros: [{ fecha: fechaISO(ayer), cantidad: 2 }] };

  assert.equal(calcularRacha(habito, fechaISO()), 1);
});
