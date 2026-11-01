/**
 * @file Modelo de dominio "Habito".
 * Corresponde a la clase Habito del diagrama de clases de VitaHealth:
 *   - id, nombre, descripcion, categoria, frecuencia, meta, unidad,
 *     fechaCreacion, registros[] (cumplimientos diarios).
 * Contiene las reglas de validación propias de la entidad.
 */

'use strict';

const crypto = require('node:crypto');

/** Categorías permitidas para un hábito saludable. */
const CATEGORIAS = Object.freeze(['hidratacion', 'actividad_fisica', 'sueno', 'alimentacion', 'bienestar']);

/** Frecuencias permitidas. */
const FRECUENCIAS = Object.freeze(['diaria', 'semanal']);

/** Longitudes máximas de los campos de texto. */
const MAX_NOMBRE = 60;
const MAX_DESCRIPCION = 200;

/**
 * Error de validación del dominio. Los controladores lo traducen a HTTP 400.
 */
class ErrorValidacion extends Error {
  /**
   * @param {string[]} detalles Lista de mensajes de error legibles.
   */
  constructor(detalles) {
    super('Los datos del hábito no son válidos');
    this.name = 'ErrorValidacion';
    this.detalles = detalles;
  }
}

/**
 * Valida los datos de entrada de un hábito.
 * @param {object} datos Datos recibidos (crear o actualizar).
 * @param {{parcial?: boolean}} [opciones] Si parcial=true solo valida los campos presentes.
 * @returns {string[]} Lista de errores; vacía si los datos son válidos.
 */
function validarDatosHabito(datos, { parcial = false } = {}) {
  const errores = [];
  const presente = (campo) => datos[campo] !== undefined;

  if (!parcial || presente('nombre')) {
    if (typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
      errores.push('El nombre es obligatorio.');
    } else if (datos.nombre.trim().length > MAX_NOMBRE) {
      errores.push(`El nombre no puede superar ${MAX_NOMBRE} caracteres.`);
    }
  }

  if (presente('descripcion') && datos.descripcion !== null) {
    if (typeof datos.descripcion !== 'string' || datos.descripcion.length > MAX_DESCRIPCION) {
      errores.push(`La descripción debe ser texto de máximo ${MAX_DESCRIPCION} caracteres.`);
    }
  }

  if (!parcial || presente('categoria')) {
    if (!CATEGORIAS.includes(datos.categoria)) {
      errores.push(`La categoría debe ser una de: ${CATEGORIAS.join(', ')}.`);
    }
  }

  if (!parcial || presente('frecuencia')) {
    if (!FRECUENCIAS.includes(datos.frecuencia)) {
      errores.push(`La frecuencia debe ser una de: ${FRECUENCIAS.join(', ')}.`);
    }
  }

  if (!parcial || presente('meta')) {
    const meta = Number(datos.meta);
    if (!Number.isFinite(meta) || meta <= 0) {
      errores.push('La meta debe ser un número mayor que cero.');
    }
  }

  if (presente('unidad') && (typeof datos.unidad !== 'string' || datos.unidad.length > 20)) {
    errores.push('La unidad debe ser texto de máximo 20 caracteres.');
  }

  return errores;
}

/**
 * Construye un nuevo objeto Habito a partir de datos ya validados.
 * @param {object} datos Datos de entrada validados.
 * @returns {object} Hábito listo para persistir.
 */
function crearHabito(datos) {
  return {
    id: crypto.randomUUID(),
    nombre: datos.nombre.trim(),
    descripcion: (datos.descripcion || '').trim(),
    categoria: datos.categoria,
    frecuencia: datos.frecuencia,
    meta: Number(datos.meta),
    unidad: (datos.unidad || 'veces').trim(),
    activo: true,
    fechaCreacion: new Date().toISOString(),
    registros: [],
  };
}

module.exports = {
  CATEGORIAS,
  FRECUENCIAS,
  ErrorValidacion,
  validarDatosHabito,
  crearHabito,
};
