/**
 * @file Punto de entrada: inicia el servidor HTTP de VitaHealth.
 * Uso: npm start  →  http://localhost:3000
 */

'use strict';

const config = require('./config');
const { crearApp } = require('./app');

const app = crearApp();

app.listen(config.puerto, () => {
  console.log(`[VitaHealth] Servidor en http://localhost:${config.puerto} (entorno: ${config.entorno})`);
});
