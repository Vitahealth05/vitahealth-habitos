/**
 * @file Construcción de la aplicación Express.
 * Une las capas (repositorio → servicio → controlador → rutas) y registra
 * los middlewares. Se separa de server.js para poder probar la app sin
 * abrir un puerto.
 */

'use strict';

const express = require('express');

const config = require('./config');
const HabitoRepository = require('./repositories/habitoRepository');
const { HabitoService } = require('./services/habitoService');
const { crearHabitoController } = require('./controllers/habitoController');
const { crearHabitoRoutes } = require('./routes/habitoRoutes');
const { CATEGORIAS, FRECUENCIAS } = require('./models/habito');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errorHandler');

/**
 * Crea una instancia configurada de la aplicación.
 * @param {{archivoDatos?: string}} [opciones] Permite usar otro archivo (pruebas).
 * @returns {import('express').Express}
 */
function crearApp({ archivoDatos = config.archivoDatos } = {}) {
  const app = express();

  // Inyección de dependencias manual entre capas.
  const repositorio = new HabitoRepository(archivoDatos);
  const servicio = new HabitoService(repositorio);
  const controlador = crearHabitoController(servicio);

  // Middlewares globales.
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(express.static(config.carpetaPublica));

  // Endpoints de la API.
  app.get('/api/salud', (req, res) =>
    res.json({ ok: true, servicio: 'vitahealth-habitos', fecha: new Date().toISOString() }),
  );
  app.get('/api/catalogos', (req, res) =>
    res.json({ ok: true, datos: { categorias: CATEGORIAS, frecuencias: FRECUENCIAS } }),
  );
  app.use('/api/habitos', crearHabitoRoutes(controlador));

  // Manejo de errores (siempre al final).
  app.use('/api', rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}

module.exports = { crearApp };
