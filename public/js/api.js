/**
 * @file Cliente de la API REST de VitaHealth (lado del navegador).
 * Centraliza las llamadas fetch para que la interfaz (app.js) no
 * conozca URLs ni detalles de HTTP.
 */

'use strict';

// eslint-disable-next-line no-unused-vars
const ApiHabitos = (() => {
  const URL_BASE = '/api';

  /**
   * Realiza una petición y devuelve el JSON. Lanza un Error con los
   * detalles del servidor si la respuesta no es exitosa.
   * @param {string} ruta
   * @param {RequestInit} [opciones]
   * @returns {Promise<object>}
   */
  async function peticion(ruta, opciones = {}) {
    const respuesta = await fetch(`${URL_BASE}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) {
      const error = new Error(cuerpo.mensaje || 'Error en la petición');
      error.detalles = cuerpo.detalles || [];
      throw error;
    }
    return cuerpo;
  }

  return {
    /** Obtiene las listas de categorías y frecuencias. */
    catalogos: () => peticion('/catalogos'),

    /** Lista los hábitos, con filtro opcional por categoría. */
    listar: (categoria = '') => peticion(`/habitos${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ''}`),

    /** Crea un hábito. */
    crear: (datos) => peticion('/habitos', { method: 'POST', body: JSON.stringify(datos) }),

    /** Actualiza un hábito. */
    actualizar: (id, datos) => peticion(`/habitos/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),

    /** Elimina un hábito. */
    eliminar: (id) => peticion(`/habitos/${id}`, { method: 'DELETE' }),

    /** Registra el cumplimiento de hoy. */
    registrar: (id, cantidad) =>
      peticion(`/habitos/${id}/registros`, { method: 'POST', body: JSON.stringify({ cantidad }) }),
  };
})();
