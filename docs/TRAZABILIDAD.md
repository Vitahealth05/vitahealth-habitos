# Trazabilidad del Módulo de Gestión de Hábitos

Relación entre los artefactos del ciclo de vida del software de **VitaHealth** y el código de esta evidencia
(GA7-220501096-AA3-EV01).

## 1. Ubicación del módulo dentro de VitaHealth

El documento de estándares del equipo (GA7-220501096-AA1-EV02) define cinco módulos funcionales. Este repositorio
codifica la parte de **seguimiento de hábitos diarios** del módulo **"Hidratación, sueño y hábitos"**:

| Módulo funcional (estándares AA1-EV02) | Estado | Evidencia |
|---|---|---|
| Cuentas y perfil | Codificado | AA2-EV02 (Java, Servlets/JSP) |
| Nutrición | Codificado (stand-alone) | AA2-EV01 (Java, JDBC) |
| Ejercicio y actividad | Codificado | AA2-EV01 y AA2-EV02 |
| **Hidratación, sueño y hábitos → seguimiento de hábitos diarios** | **Codificado en esta evidencia** | **AA3-EV01 (Node.js + Express)** |
| Progreso y estadísticas | Parcial (resumen diario y racha de este módulo) | AA2-EV02 y AA3-EV01 |

> **Nota de tecnología.** Las evidencias AA2 del equipo se construyeron en Java. Para esta evidencia se aplicó el
> framework **Express** sobre **Node.js**, visto en el componente formativo, y por eso el módulo vive en un
> repositorio propio (`vitahealth-habitos`) y no dentro de `vitahealth-web`. El módulo se comunica por una API REST,
> así que puede integrarse más adelante con el resto de VitaHealth.

## 2. Historias de usuario del módulo

Las historias HU01 a HU07 corresponden al módulo web de AA2-EV02. Las de este módulo continúan esa numeración:

| HU | Historia de usuario | Criterios de aceptación | Implementación |
|---|---|---|---|
| HU08 | **Como** usuario **quiero** registrar un hábito saludable **para** hacerle seguimiento diario. | Nombre, categoría, frecuencia y meta obligatorios; nombre de máximo 60 caracteres; meta mayor que cero. | `HabitoService.crear`, `validarDatosHabito`, `POST /api/habitos`, formulario de `index.html` |
| HU09 | **Como** usuario **quiero** ver mis hábitos y filtrarlos por categoría **para** ubicarlos rápido. | Lista con el progreso del día; filtro por hidratación, actividad física, sueño, alimentación o bienestar. | `HabitoService.listar`, `GET /api/habitos`, `cargarHabitos()` |
| HU10 | **Como** usuario **quiero** editar un hábito **para** ajustar mi meta. | Solo cambian los campos enviados; el historial de registros se conserva. | `HabitoService.actualizar`, `PUT /api/habitos/:id`, `cargarEnFormulario()` |
| HU11 | **Como** usuario **quiero** eliminar un hábito que ya no sigo. | Se pide confirmación antes de borrar. | `HabitoService.eliminar`, `DELETE /api/habitos/:id`, `window.confirm` |
| HU12 | **Como** usuario **quiero** marcar mi avance diario **para** saber si cumplí la meta. | Suma al registro del día; no acepta fechas futuras ni cantidades menores o iguales a cero. | `HabitoService.registrarCumplimiento`, `POST /api/habitos/:id/registros`, botón "+1" |
| HU13 | **Como** usuario **quiero** ver mi progreso y mi racha **para** mantenerme motivado. | Porcentaje del día (máximo 100 %) y días seguidos cumpliendo la meta. | `calcularRacha`, `#conResumen`, tarjetas de resumen y barra de progreso |

## 3. Casos de uso → endpoints

| Caso de uso | Actor | Endpoint |
|---|---|---|
| CU-01 Registrar hábito | Usuario | `POST /api/habitos` |
| CU-02 Consultar hábitos | Usuario | `GET /api/habitos`, `GET /api/habitos/:id` |
| CU-03 Actualizar hábito | Usuario | `PUT /api/habitos/:id` |
| CU-04 Eliminar hábito | Usuario | `DELETE /api/habitos/:id` |
| CU-05 Registrar cumplimiento | Usuario | `POST /api/habitos/:id/registros` |
| CU-06 Consultar progreso y racha | Usuario | Incluido en la respuesta de CU-02 (`resumen`) |

## 4. Clases del módulo

```
┌──────────────────────────┐ 1      * ┌───────────────────┐
│ Habito                   │◆─────────│ RegistroDiario    │
├──────────────────────────┤          ├───────────────────┤
│ id: UUID                 │          │ fecha: AAAA-MM-DD │
│ nombre: String           │          │ cantidad: Number  │
│ descripcion: String      │          └───────────────────┘
│ categoria: Categoria     │
│ frecuencia: Frecuencia   │
│ meta: Number             │
│ unidad: String           │
│ activo: Boolean          │
│ fechaCreacion: DateTime  │
└──────────────────────────┘
        ▲ usa
┌──────────────────────────┐   usa   ┌──────────────────────────┐
│ HabitoService            │────────▶│ HabitoRepository         │
├──────────────────────────┤         ├──────────────────────────┤
│ listar(filtros)          │         │ leerTodos()              │
│ obtener(id)              │         │ buscarPorId(id)          │
│ crear(datos)             │         │ insertar(habito)         │
│ actualizar(id, cambios)  │         │ actualizar(habito)       │
│ eliminar(id)             │         │ eliminar(id)             │
│ registrarCumplimiento()  │         │ guardarTodos(habitos)    │
└──────────────────────────┘         └──────────────────────────┘
```

| Clase | Archivo |
|---|---|
| Habito / RegistroDiario | `src/models/habito.js` |
| HabitoService | `src/services/habitoService.js` |
| HabitoRepository | `src/repositories/habitoRepository.js` |
| HabitoController | `src/controllers/habitoController.js` |

## 5. Prototipo → interfaz

La interfaz conserva la identidad del prototipo de VitaHealth: paleta verde, tarjetas con esquinas redondeadas,
barras de progreso e indicadores del día. En pantallas pequeñas las columnas se apilan (diseño responsive).

## 6. Estándares de codificación del equipo aplicados (AA1-EV02)

| Regla del estándar | Cómo se aplicó en este módulo |
|---|---|
| Organización por funcionalidades y por capas | Capas `routes`, `controllers`, `services`, `repositories`, `models` |
| camelCase para variables y métodos, PascalCase para clases, constantes en MAYÚSCULAS | `registrarCumplimiento`, `HabitoService`, `CATEGORIAS` |
| Documentación de clases y funciones | Comentarios JSDoc en todos los archivos |
| Manejo de errores con excepciones propias | `ErrorValidacion` (400) y `ErrorNoEncontrado` (404) con middleware central |
| Análisis estático y formato antes de cada commit | `npm run lint` (ESLint) y `npm run format` (Prettier) |
| Pruebas unitarias; no se integra código con pruebas fallando | `npm test` (15 pruebas con `node:test`) |
| Ramas `main`, `develop` y `feature/<módulo>-<descripción>` | Rama `feature/habitos-gestion` integrada a `develop` y luego a `main` |
| Conventional Commits | `feat(habitos): …`, `test: …`, `docs: …`, `chore: …` |
| No exponer datos sensibles | Los errores 500 no muestran detalles internos; la interfaz escapa el HTML |
