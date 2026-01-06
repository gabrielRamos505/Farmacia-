# 🏥 Sistema de Gestión de Farmacia (Admin Panel)

Un sistema integral de administración para farmacias desarrollado con **React**, **Node.js** y **SQL Server**, diseñado para profesionalizar la gestión de inventario, ventas y personal bajo un esquema estricto de **Control de Acceso Basado en Roles (RBAC)**.

## 🚀 Características Principales

### 🔐 Seguridad y Control de Acceso (RBAC)
El sistema implementa una segregación de funciones profesional, donde cada rol tiene acceso únicamente a las herramientas necesarias para su labor:

| Rol | Capacidades Principales |
| :--- | :--- |
| **Gerente** | Control total, analítica avanzada de BI, gestión de empleados y auditoría de ventas. |
| **Cajero** | Punto de Venta (POS), registro de clientes y facturación. |
| **Farmacéutico** | Consulta de inventario, laboratorios, fechas de vencimiento y registro de recetas. |
| **Almacenero** | Gestión de lotes, actualización de stock y control de proveedores. |
| **Auxiliar** | Reposición de estantería y monitoreo de stock crítico. |

### 📦 Gestión de Inventario Inteligente
*   Control por **Lotes y Fechas de Vencimiento**.
*   Alertas automáticas de **Stock Bajo** y productos próximos a expirar.
*   Búsqueda avanzada por Principio Activo, Laboratorio o Nombre Comercial.

### 💰 Punto de Venta (POS)
*   Facturación rápida con integración de clientes.
*   Gestión de descuentos y programas de fidelidad (puntos).
*   Historial de transacciones detallado.

### 📊 Business Intelligence (BI)
*   Dashboards dinámicos con métricas clave (Ticket promedio, productos top, ingresos mensuales).
*   Gráficos interactivos de tendencias de venta.

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** React, Tailwind CSS, Framer Motion, Lucide Icons, Recharts.
*   **Backend:** Node.js, Express.js.
*   **Database:** Microsoft SQL Server con Sequelize ORM.
*   **Autenticación:** JSON Web Tokens (JWT) y Middlewares de autorización.

## ⚙️ Configuración del Proyecto

### Requisitos Previos
*   Node.js (v16+)
*   SQL Server
*   Git

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/gabrielRamos505/Farmacia-
    cd Farmacia-
    ```

2.  **Configurar la Base de Datos:**
    *   Ejecutar el script `database_schema.sql` en su instancia de SQL Server.
    *   Configurar las credenciales en el archivo `.env` del servidor.

3.  **Instalar dependencias del Backend:**
    ```bash
    cd backend
    npm install
    ```

4.  **Instalar dependencias del Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

### Ejecución

1.  **Iniciar Backend:**
    ```bash
    cd backend
    npm start
    ```

2.  **Iniciar Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

## 📄 Documentación de la Base de Datos
El esquema completo se encuentra en el archivo `database_schema.sql` en la raíz del proyecto, incluyendo definiciones de tipos de datos, llaves primarias, foráneas y restricciones de integridad.

---
Desarrollado con ❤️ para la optimización farmacéutica.
