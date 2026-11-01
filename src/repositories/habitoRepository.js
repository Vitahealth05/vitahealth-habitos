/**
 * @file Repositorio de hábitos (capa de acceso a datos).
 * Persiste la información en un archivo JSON. Al aislar el acceso a datos
 * aquí, la base de datos puede cambiarse (por ejemplo a MySQL) sin tocar
 * los servicios ni los controladores.
 */

'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

class HabitoRepository {
  /**
   * @param {string} archivoDatos Ruta del archivo JSON de persistencia.
   */
  constructor(archivoDatos) {
    this.archivoDatos = archivoDatos;
    /** Cola de escritura: evita que dos escrituras simultáneas se pisen. */
    this.colaEscritura = Promise.resolve();
  }

  /**
   * Lee todos los hábitos del archivo. Si el archivo no existe, devuelve [].
   * @returns {Promise<object[]>}
   */
  async leerTodos() {
    try {
      const contenido = await fs.readFile(this.archivoDatos, 'utf8');
      return contenido.trim() === '' ? [] : JSON.parse(contenido);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Guarda la lista completa de hábitos de forma segura
   * (escribe en un archivo temporal y luego lo renombra).
   * @param {object[]} habitos
   * @returns {Promise<void>}
   */
  async guardarTodos(habitos) {
    this.colaEscritura = this.colaEscritura.then(async () => {
      await fs.mkdir(path.dirname(this.archivoDatos), { recursive: true });
      const temporal = `${this.archivoDatos}.tmp`;
      await fs.writeFile(temporal, JSON.stringify(habitos, null, 2), 'utf8');
      await fs.rename(temporal, this.archivoDatos);
    });
    return this.colaEscritura;
  }

  /**
   * Busca un hábito por su identificador.
   * @param {string} id
   * @returns {Promise<object|undefined>}
   */
  async buscarPorId(id) {
    const habitos = await this.leerTodos();
    return habitos.find((habito) => habito.id === id);
  }

  /**
   * Inserta un nuevo hábito.
   * @param {object} habito
   * @returns {Promise<object>} El hábito insertado.
   */
  async insertar(habito) {
    const habitos = await this.leerTodos();
    habitos.push(habito);
    await this.guardarTodos(habitos);
    return habito;
  }

  /**
   * Reemplaza un hábito existente.
   * @param {object} habitoActualizado
   * @returns {Promise<object|undefined>} El hábito actualizado o undefined si no existe.
   */
  async actualizar(habitoActualizado) {
    const habitos = await this.leerTodos();
    const indice = habitos.findIndex((habito) => habito.id === habitoActualizado.id);
    if (indice === -1) {
      return undefined;
    }
    habitos[indice] = habitoActualizado;
    await this.guardarTodos(habitos);
    return habitoActualizado;
  }

  /**
   * Elimina un hábito por su identificador.
   * @param {string} id
   * @returns {Promise<boolean>} true si se eliminó.
   */
  async eliminar(id) {
    const habitos = await this.leerTodos();
    const restantes = habitos.filter((habito) => habito.id !== id);
    if (restantes.length === habitos.length) {
      return false;
    }
    await this.guardarTodos(restantes);
    return true;
  }
}

module.exports = HabitoRepository;
