/**
 * @file Servicio de hábitos (lógica de negocio).
 * Implementa los casos de uso del módulo:
 *   CU-01 Registrar hábito        CU-04 Eliminar hábito
 *   CU-02 Consultar hábitos       CU-05 Registrar cumplimiento diario
 *   CU-03 Actualizar hábito       CU-06 Consultar progreso y racha
 */

'use strict';

const { ErrorValidacion, validarDatosHabito, crearHabito } = require('../models/habito');

/** Error que indica que el recurso solicitado no existe (HTTP 404). */
class ErrorNoEncontrado extends Error {
  constructor(mensaje = 'Hábito no encontrado') {
    super(mensaje);
    this.name = 'ErrorNoEncontrado';
  }
}

/** Formato de fecha usado en los registros diarios: AAAA-MM-DD. */
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Devuelve la fecha local de hoy en formato AAAA-MM-DD.
 * @param {Date} [fecha]
 * @returns {string}
 */
function fechaISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Calcula cuántos días consecutivos (hasta hoy o ayer) se cumplió la meta.
 * @param {object} habito
 * @param {string} hoy Fecha de referencia AAAA-MM-DD.
 * @returns {number}
 */
function calcularRacha(habito, hoy) {
  const diasCumplidos = new Set(
    habito.registros.filter((registro) => registro.cantidad >= habito.meta).map((registro) => registro.fecha),
  );

  const cursor = new Date(`${hoy}T12:00:00`);
  // Si hoy aún no se cumple, la racha se cuenta desde ayer.
  if (!diasCumplidos.has(hoy)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let racha = 0;
  while (diasCumplidos.has(fechaISO(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

class HabitoService {
  /**
   * @param {import('../repositories/habitoRepository')} repositorio
   */
  constructor(repositorio) {
    this.repositorio = repositorio;
  }

  /**
   * CU-02: Lista los hábitos, opcionalmente filtrados por categoría.
   * @param {{categoria?: string}} [filtros]
   * @returns {Promise<object[]>}
   */
  async listar({ categoria } = {}) {
    const habitos = await this.repositorio.leerTodos();
    const hoy = fechaISO();
    return habitos
      .filter((habito) => !categoria || habito.categoria === categoria)
      .map((habito) => this.#conResumen(habito, hoy));
  }

  /**
   * CU-02: Obtiene un hábito por id.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async obtener(id) {
    const habito = await this.repositorio.buscarPorId(id);
    if (!habito) {
      throw new ErrorNoEncontrado();
    }
    return this.#conResumen(habito, fechaISO());
  }

  /**
   * CU-01: Registra un nuevo hábito.
   * @param {object} datos
   * @returns {Promise<object>}
   */
  async crear(datos) {
    const errores = validarDatosHabito(datos);
    if (errores.length > 0) {
      throw new ErrorValidacion(errores);
    }
    const habito = await this.repositorio.insertar(crearHabito(datos));
    return this.#conResumen(habito, fechaISO());
  }

  /**
   * CU-03: Actualiza los campos editables de un hábito.
   * @param {string} id
   * @param {object} cambios
   * @returns {Promise<object>}
   */
  async actualizar(id, cambios) {
    const errores = validarDatosHabito(cambios, { parcial: true });
    if (errores.length > 0) {
      throw new ErrorValidacion(errores);
    }

    const habito = await this.repositorio.buscarPorId(id);
    if (!habito) {
      throw new ErrorNoEncontrado();
    }

    // Solo se copian los campos permitidos; id, fechas y registros no se modifican.
    const camposEditables = ['nombre', 'descripcion', 'categoria', 'frecuencia', 'meta', 'unidad', 'activo'];
    for (const campo of camposEditables) {
      if (cambios[campo] !== undefined) {
        habito[campo] = typeof cambios[campo] === 'string' ? cambios[campo].trim() : cambios[campo];
      }
    }
    habito.meta = Number(habito.meta);
    habito.activo = Boolean(habito.activo);

    await this.repositorio.actualizar(habito);
    return this.#conResumen(habito, fechaISO());
  }

  /**
   * CU-04: Elimina un hábito.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async eliminar(id) {
    const eliminado = await this.repositorio.eliminar(id);
    if (!eliminado) {
      throw new ErrorNoEncontrado();
    }
  }

  /**
   * CU-05: Registra (o suma a) el cumplimiento de un día.
   * @param {string} id Id del hábito.
   * @param {{cantidad: number, fecha?: string}} datos
   * @returns {Promise<object>} Hábito con su resumen actualizado.
   */
  async registrarCumplimiento(id, { cantidad, fecha } = {}) {
    const valor = Number(cantidad);
    const dia = fecha || fechaISO();
    const errores = [];

    if (!Number.isFinite(valor) || valor <= 0) {
      errores.push('La cantidad debe ser un número mayor que cero.');
    }
    if (!PATRON_FECHA.test(dia) || Number.isNaN(Date.parse(dia))) {
      errores.push('La fecha debe tener el formato AAAA-MM-DD.');
    } else if (dia > fechaISO()) {
      errores.push('No se pueden registrar cumplimientos en fechas futuras.');
    }
    if (errores.length > 0) {
      throw new ErrorValidacion(errores);
    }

    const habito = await this.repositorio.buscarPorId(id);
    if (!habito) {
      throw new ErrorNoEncontrado();
    }

    const existente = habito.registros.find((registro) => registro.fecha === dia);
    if (existente) {
      existente.cantidad += valor;
    } else {
      habito.registros.push({ fecha: dia, cantidad: valor });
      habito.registros.sort((a, b) => a.fecha.localeCompare(b.fecha));
    }

    await this.repositorio.actualizar(habito);
    return this.#conResumen(habito, fechaISO());
  }

  /**
   * CU-06: Agrega al hábito un resumen calculado (progreso de hoy y racha).
   * El resumen no se guarda: se calcula cada vez que se consulta.
   * @param {object} habito
   * @param {string} hoy
   * @returns {object}
   */
  #conResumen(habito, hoy) {
    const registroHoy = habito.registros.find((registro) => registro.fecha === hoy);
    const cantidadHoy = registroHoy ? registroHoy.cantidad : 0;
    return {
      ...habito,
      resumen: {
        cantidadHoy,
        porcentajeHoy: Math.min(100, Math.round((cantidadHoy / habito.meta) * 100)),
        metaCumplidaHoy: cantidadHoy >= habito.meta,
        racha: calcularRacha(habito, hoy),
      },
    };
  }
}

module.exports = { HabitoService, ErrorNoEncontrado, fechaISO, calcularRacha };
