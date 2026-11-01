/**
 * @file Lógica de la interfaz del módulo de Gestión de Hábitos.
 * Maneja el formulario, el listado, los filtros y los registros diarios.
 * Depende de ApiHabitos (api.js).
 */

/* global ApiHabitos */
'use strict';

/** Nombres legibles de las categorías y frecuencias para la interfaz. */
const ETIQUETAS = {
  hidratacion: '💧 Hidratación',
  actividad_fisica: '🏃 Actividad física',
  sueno: '😴 Sueño',
  alimentacion: '🥗 Alimentación',
  bienestar: '🧘 Bienestar',
  diaria: 'Diaria',
  semanal: 'Semanal',
};

/** Referencias a los elementos del DOM. */
const ui = {
  formulario: document.getElementById('form-habito'),
  tituloFormulario: document.getElementById('titulo-formulario'),
  id: document.getElementById('habito-id'),
  nombre: document.getElementById('nombre'),
  descripcion: document.getElementById('descripcion'),
  categoria: document.getElementById('categoria'),
  frecuencia: document.getElementById('frecuencia'),
  meta: document.getElementById('meta'),
  unidad: document.getElementById('unidad'),
  errores: document.getElementById('errores-formulario'),
  botonGuardar: document.getElementById('boton-guardar'),
  botonCancelar: document.getElementById('boton-cancelar'),
  filtro: document.getElementById('filtro-categoria'),
  lista: document.getElementById('lista-habitos'),
  listaVacia: document.getElementById('lista-vacia'),
  totalHabitos: document.getElementById('total-habitos'),
  cumplidosHoy: document.getElementById('cumplidos-hoy'),
  mejorRacha: document.getElementById('mejor-racha'),
  aviso: document.getElementById('aviso'),
};

/** Hábitos cargados actualmente (para editar sin volver a consultar). */
let habitosActuales = [];

/**
 * Muestra un mensaje emergente durante unos segundos.
 * @param {string} texto
 */
function mostrarAviso(texto) {
  ui.aviso.textContent = texto;
  ui.aviso.classList.add('aviso--visible');
  clearTimeout(mostrarAviso.temporizador);
  mostrarAviso.temporizador = setTimeout(() => ui.aviso.classList.remove('aviso--visible'), 2500);
}

/**
 * Escapa texto para insertarlo de forma segura en HTML (evita XSS).
 * @param {string} texto
 * @returns {string}
 */
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

/**
 * Llena un <select> con las opciones indicadas.
 * @param {HTMLSelectElement} select
 * @param {string[]} valores
 */
function llenarSelect(select, valores) {
  valores.forEach((valor) => {
    const opcion = document.createElement('option');
    opcion.value = valor;
    opcion.textContent = ETIQUETAS[valor] || valor;
    select.appendChild(opcion);
  });
}

/** Muestra la lista de errores de validación del formulario. */
function mostrarErrores(errores) {
  ui.errores.innerHTML = errores.map((error) => `<li>${escaparHTML(error)}</li>`).join('');
}

/** Devuelve el formulario a su estado inicial (modo "crear"). */
function reiniciarFormulario() {
  ui.formulario.reset();
  ui.id.value = '';
  ui.tituloFormulario.textContent = 'Nuevo hábito';
  ui.botonGuardar.textContent = 'Guardar hábito';
  ui.botonCancelar.classList.add('oculto');
  mostrarErrores([]);
}

/**
 * Carga un hábito en el formulario para editarlo (HU-03).
 * @param {object} habito
 */
function cargarEnFormulario(habito) {
  ui.id.value = habito.id;
  ui.nombre.value = habito.nombre;
  ui.descripcion.value = habito.descripcion;
  ui.categoria.value = habito.categoria;
  ui.frecuencia.value = habito.frecuencia;
  ui.meta.value = habito.meta;
  ui.unidad.value = habito.unidad;
  ui.tituloFormulario.textContent = 'Editar hábito';
  ui.botonGuardar.textContent = 'Actualizar';
  ui.botonCancelar.classList.remove('oculto');
  ui.nombre.focus();
}

/** Actualiza las tarjetas de resumen superiores. */
function pintarResumen(habitos) {
  const activos = habitos.filter((habito) => habito.activo);
  ui.totalHabitos.textContent = activos.length;
  ui.cumplidosHoy.textContent = activos.filter((habito) => habito.resumen.metaCumplidaHoy).length;
  ui.mejorRacha.textContent = Math.max(0, ...habitos.map((habito) => habito.resumen.racha));
}

/**
 * Construye el HTML de una tarjeta de hábito.
 * @param {object} habito
 * @returns {string}
 */
function plantillaHabito(habito) {
  const { resumen } = habito;
  const claseCumplido = resumen.metaCumplidaHoy ? 'habito--cumplido' : '';
  return `
    <li class="habito ${claseCumplido}" data-id="${habito.id}">
      <div class="habito__cabecera">
        <div>
          <h3 class="habito__nombre">${escaparHTML(habito.nombre)}</h3>
          <span class="habito__etiqueta">${ETIQUETAS[habito.categoria]}</span>
          <span class="habito__etiqueta">${ETIQUETAS[habito.frecuencia]}</span>
        </div>
        <span class="habito__racha" title="Días seguidos cumpliendo la meta">🔥 ${resumen.racha} días</span>
      </div>
      ${habito.descripcion ? `<p class="habito__descripcion">${escaparHTML(habito.descripcion)}</p>` : ''}
      <div class="progreso" role="progressbar" aria-valuenow="${resumen.porcentajeHoy}" aria-valuemin="0" aria-valuemax="100">
        <div class="progreso__barra" style="width:${resumen.porcentajeHoy}%"></div>
      </div>
      <span class="habito__progreso-texto">
        Hoy: ${resumen.cantidadHoy} / ${habito.meta} ${escaparHTML(habito.unidad)} (${resumen.porcentajeHoy}%)
      </span>
      <div class="habito__acciones">
        <button class="boton boton--primario boton--pequeno" data-accion="sumar">+1 ${escaparHTML(habito.unidad)}</button>
        <button class="boton boton--secundario boton--pequeno" data-accion="editar">Editar</button>
        <button class="boton boton--peligro boton--pequeno" data-accion="eliminar">Eliminar</button>
      </div>
    </li>`;
}

/** Consulta los hábitos y vuelve a pintar el listado (HU-02). */
async function cargarHabitos() {
  try {
    const { datos } = await ApiHabitos.listar(ui.filtro.value);
    habitosActuales = datos;
    ui.lista.innerHTML = datos.map(plantillaHabito).join('');
    ui.listaVacia.classList.toggle('oculto', datos.length > 0);
    pintarResumen(datos);
  } catch (error) {
    mostrarAviso(`No se pudieron cargar los hábitos: ${error.message}`);
  }
}

/** Envía el formulario: crea (HU-01) o actualiza (HU-03) según haya id. */
async function guardarHabito(evento) {
  evento.preventDefault();
  const datos = {
    nombre: ui.nombre.value,
    descripcion: ui.descripcion.value,
    categoria: ui.categoria.value,
    frecuencia: ui.frecuencia.value,
    meta: Number(ui.meta.value),
    unidad: ui.unidad.value || 'veces',
  };

  try {
    if (ui.id.value) {
      await ApiHabitos.actualizar(ui.id.value, datos);
      mostrarAviso('Hábito actualizado ✔');
    } else {
      await ApiHabitos.crear(datos);
      mostrarAviso('Hábito creado ✔');
    }
    reiniciarFormulario();
    await cargarHabitos();
  } catch (error) {
    mostrarErrores(error.detalles.length ? error.detalles : [error.message]);
  }
}

/** Maneja los botones de cada tarjeta (delegación de eventos). */
async function manejarAccionLista(evento) {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) {
    return;
  }
  const id = boton.closest('.habito').dataset.id;
  const habito = habitosActuales.find((item) => item.id === id);

  try {
    switch (boton.dataset.accion) {
      case 'sumar': // HU-05: registrar cumplimiento
        await ApiHabitos.registrar(id, 1);
        await cargarHabitos();
        break;
      case 'editar':
        cargarEnFormulario(habito);
        break;
      case 'eliminar': // HU-04: eliminar con confirmación
        if (window.confirm(`¿Eliminar el hábito "${habito.nombre}"? Esta acción no se puede deshacer.`)) {
          await ApiHabitos.eliminar(id);
          mostrarAviso('Hábito eliminado');
          await cargarHabitos();
        }
        break;
      default:
        break;
    }
  } catch (error) {
    mostrarAviso(error.message);
  }
}

/** Inicializa la página: catálogos, eventos y primera carga. */
async function iniciar() {
  try {
    const { datos } = await ApiHabitos.catalogos();
    llenarSelect(ui.categoria, datos.categorias);
    llenarSelect(ui.frecuencia, datos.frecuencias);
    llenarSelect(ui.filtro, datos.categorias);
  } catch (error) {
    mostrarAviso(`No se pudo conectar con el servidor: ${error.message}`);
  }

  ui.formulario.addEventListener('submit', guardarHabito);
  ui.botonCancelar.addEventListener('click', reiniciarFormulario);
  ui.filtro.addEventListener('change', cargarHabitos);
  ui.lista.addEventListener('click', manejarAccionLista);

  await cargarHabitos();
}

document.addEventListener('DOMContentLoaded', iniciar);
