/**
 * @file Configuración central de la aplicación VitaHealth.
 * Lee las variables de entorno y define valores por defecto,
 * de modo que ningún otro archivo dependa directamente de process.env.
 */

'use strict';

const path = require('node:path');

/** Raíz del proyecto (dos niveles arriba de src/config). */
const RAIZ_PROYECTO = path.resolve(__dirname, '..', '..');

const config = Object.freeze({
  /** Puerto HTTP en el que escucha el servidor. */
  puerto: Number(process.env.PORT) || 3000,

  /** Entorno de ejecución: development | production | test. */
  entorno: process.env.NODE_ENV || 'development',

  /** Archivo JSON donde se persisten los hábitos. */
  archivoDatos: process.env.VH_DATA_FILE || path.join(RAIZ_PROYECTO, 'data', 'habitos.json'),

  /** Carpeta de archivos estáticos (interfaz web). */
  carpetaPublica: path.join(RAIZ_PROYECTO, 'public'),
});

module.exports = config;
