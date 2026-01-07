# Informe Técnico: Panel de Administración para Farmacia

Este documento proporciona una visión detallada de la arquitectura, estructura de archivos y funcionalidades del sistema "Admin Panel Farmacia". Está diseñado para que nuevos desarrolladores puedan entender, mantener y mejorar la plataforma de manera eficiente.

## 🚀 Resumen del Proyecto

El sistema es una solución integral para la gestión de farmacias, que incluye control de inventario, punto de venta (POS), gestión de proveedores, clientes y analíticas avanzadas.

**Stack Tecnológico:**
- **Frontend:** React + Vite, Tailwind CSS, Recharts (para analíticas).
- **Backend:** Node.js + Express.
- **Base de Datos:** SQL Server (gestionado con Sequelize ORM).
- **Autenticación:** JWT (JSON Web Tokens).

---

## 📂 Estructura del Proyecto

El proyecto está dividido en dos carpetas principales: `backend` y `frontend`.

### 🖥️ Backend (Directorio `/backend`)

El backend sigue el patrón MVC (Model-View-Controller) para una separación clara de responsabilidades.

#### Carpetas Principales:
- `config/`: Configuración de la base de datos (`database.js`).
- `models/`: Definiciones de las tablas y sus relaciones (Sequelize).
  - `ProductoComercial.js`: Datos del producto de marca.
  - `PrincipioActivo.js`: Datos químicos del medicamento.
  - `LoteStock.js`: Gestión de fechas de vencimiento y stock por lote.
  - `Venta.js` / `DetalleVenta.js`: Histórico de transacciones.
  - `Empleado.js` / `Persona.js`: Gestión de personal y roles.
- `controllers/`: Lógica de negocio.
  - `dashboardController.js`: Procesa estadísticas y gráficos complejos para los dashboards.
  - `posController.js`: Gestiona la lógica inmediata del punto de venta.
  - `inventoryController.js`: Control de stock crítico y vencimientos.
- `routes/`: Definición de los endpoints de la API.
- `middleware/`: Filtros (ej: verificación de tokens).
- `seeders/`: Scripts para poblar la base de datos con datos de prueba.

#### Archivos Clave:
- `index.js`: Punto de entrada del servidor Express.
- `test-endpoints.js`: Script de utilidad para verificar que todos los servicios estén operativos.
- `.env`: Variables de entorno (puertos, credenciales de DB).

---

### 🎨 Frontend (Directorio `/frontend`)

Construido con React, enfocado en una experiencia de usuario fluida y dashboards diferenciados por roles.

#### `/src/pages/` (Vistas Principales):
- `Login.jsx`: Control de acceso con redirección según el rol del usuario.
- `Dashboard[Rol].jsx`: Dashboards personalizados para:
  - **Gerente:** Analíticas de ventas y rentabilidad.
  - **Farmacéutico:** Control de vencimientos y principios activos.
  - **Almacenero:** Recepción y stock físico.
  - **Vendedor:** Dashboard ligero enfocado en ventas del día.
- `POS.jsx`: Interfaz rápida de Punto de Venta con búsqueda en tiempo real.
- `Analytics.jsx`: Módulo avanzado de gráficos con comparativas mensuales y top de productos.
- `Inventory.jsx` / `Stock.jsx`: Gestión detallada del catálogo y existencias.

#### `/src/services/` (Comunicación):
- `api.js`: Configuración centralizada de Axios para peticiones al backend.

---

## 📈 Documentación de Soporte (Root)

En la raíz del proyecto se encuentran varios archivos Markdown que sirven de guía específica:
- `DASHBOARDS_POR_ROL.md`: Especificación de qué ve cada usuario.
- `NUEVOS_ENDPOINTS_ANALYTICS.md`: Detalle técnico de los últimos servicios de analítica.
- `REVISION_PROYECTO.md`: Estado actual y pendientes detectados.
- `README.md`: Guía de instalación rápida.

---

## 🛠️ Guía para Mejorar y Mantener el Sistema

### 1. Agregar una nueva funcionalidad (Backend)
1. **Modelo**: Si necesitas una tabla nueva, créala en `/models`.
2. **Controlador**: Define la lógica en `/controllers`.
3. **Ruta**: Agrega el endpoint en `/routes` y regístralo en `index.js`.

### 2. Modificar el Dashboard
La lógica de los gráficos reside mayormente en `dashboardController.js`. Si necesitas un nuevo gráfico, agrégalo a la función `getDashboardAvanzado` para que el frontend lo reciba en un solo viaje de datos.

### 3. Estilo y UI
El sistema usa **Tailwind CSS**. Para cambios globales de diseño, revisa `tailwind.config.js` y `index.css`.

---

## 🔐 Seguridad y Autenticación
El sistema utiliza el campo `puesto` de la tabla `Personas` para determinar el nivel de acceso. Los tokens JWT expiran según la configuración en el backend, asegurando que la sesión sea protegida.

---
*Este informe fue generado para el equipo de desarrollo de [Nombre de la Farmacia/Proyecto].*
