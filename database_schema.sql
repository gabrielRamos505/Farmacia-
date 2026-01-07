-- ESQUEMA DE BASE DE DATOS - SISTEMA DE GESTIÓN DE FARMACIA
-- Motor: Microsoft SQL Server

-- 1. Tabla de Personas (Base para Clientes y Empleados)
CREATE TABLE dbo.Personas (
    ID_Persona VARCHAR(50) PRIMARY KEY,
    PER_DNI VARCHAR(20) NOT NULL UNIQUE,
    PER_Nombre VARCHAR(100) NOT NULL,
    PER_Apellido VARCHAR(100) NOT NULL,
    PER_Telefono VARCHAR(20),
    PER_Email VARCHAR(100) UNIQUE,
    PER_Direccion VARCHAR(255)
);

-- 2. Tabla de Puestos
CREATE TABLE dbo.Puestos (
    ID_Puesto VARCHAR(50) PRIMARY KEY,
    PUE_Nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Tabla de Empleados
CREATE TABLE dbo.Empleados (
    ID_Empleado VARCHAR(50) PRIMARY KEY,
    ID_Persona VARCHAR(50) NOT NULL UNIQUE,
    ID_Puesto VARCHAR(50) NOT NULL,
    EMP_Fecha_Contratacion DATE,
    EMP_Usuario VARCHAR(50) NOT NULL UNIQUE,
    EMP_Contrasena_Hash CHAR(60) NOT NULL,
    EMP_Es_Administrador BIT DEFAULT 0,
    EMP_Salario DECIMAL(10, 2),
    EMP_Estado VARCHAR(20) DEFAULT 'Activo' CHECK (EMP_Estado IN ('Activo', 'Inactivo', 'Suspendido', 'Vacaciones')),
    EMP_Fecha_Baja DATE,
    FOREIGN KEY (ID_Persona) REFERENCES dbo.Personas(ID_Persona),
    FOREIGN KEY (ID_Puesto) REFERENCES dbo.Puestos(ID_Puesto)
);

-- 4. Tabla de Clientes
CREATE TABLE dbo.Clientes (
    ID_Cliente VARCHAR(50) PRIMARY KEY,
    ID_Persona VARCHAR(50) NOT NULL UNIQUE,
    CLI_Fecha_Registro DATETIME DEFAULT GETDATE(),
    CLI_Puntos_Fidelidad INT DEFAULT 0,
    FOREIGN KEY (ID_Persona) REFERENCES dbo.Personas(ID_Persona)
);

-- 5. Tabla de Proveedores
CREATE TABLE dbo.Proveedores (
    ID_Proveedor VARCHAR(50) PRIMARY KEY,
    PROV_Nombre_Empresa VARCHAR(255) NOT NULL,
    PROV_Telefono VARCHAR(20),
    PROV_Contacto VARCHAR(255)
);

-- 6. Tabla de Principios Activos
CREATE TABLE dbo.PrincipiosActivos (
    ID_Principio_Activo VARCHAR(50) PRIMARY KEY,
    PAC_Nombre_Base VARCHAR(255) NOT NULL,
    PAC_Descripcion_Cientifica VARCHAR(500)
);

-- 7. Tabla de Productos Comerciales
CREATE TABLE dbo.ProductosComerciales (
    ID_Producto VARCHAR(50) PRIMARY KEY,
    PCO_Codigo_Barras VARCHAR(50) UNIQUE,
    ID_Principio_Activo VARCHAR(50) NOT NULL,
    PCO_Nombre_Comercial VARCHAR(255) NOT NULL,
    PCO_Laboratorio VARCHAR(255),
    PCO_Presentacion VARCHAR(100),
    PCO_Precio_Venta DECIMAL(10, 2) NOT NULL,
    PCO_Requiere_Receta BIT DEFAULT 0,
    PCO_Stock_Minimo INT DEFAULT 10,
    PCO_Estado VARCHAR(20) DEFAULT 'Activo',
    FOREIGN KEY (ID_Principio_Activo) REFERENCES dbo.PrincipiosActivos(ID_Principio_Activo)
);

-- 8. Tabla de Lotes y Stock
CREATE TABLE dbo.LotesStock (
    ID_Lote_Stock VARCHAR(50) PRIMARY KEY,
    ID_Producto VARCHAR(50) NOT NULL,
    ID_Proveedor VARCHAR(50),
    ID_Empleado_Recibio VARCHAR(50) NOT NULL,
    LST_Numero_Lote VARCHAR(100),
    LST_Fecha_Vencimiento DATE,
    LST_Fecha_Recepcion DATE DEFAULT GETDATE(),
    LST_Costo_Unitario DECIMAL(10, 2),
    LST_Cantidad_Inicial INT NOT NULL,
    LST_Cantidad_Actual INT NOT NULL,
    LST_Ubicacion_Stock VARCHAR(100),
    LST_Estado VARCHAR(20) DEFAULT 'Disponible',
    FOREIGN KEY (ID_Producto) REFERENCES dbo.ProductosComerciales(ID_Producto),
    FOREIGN KEY (ID_Proveedor) REFERENCES dbo.Proveedores(ID_Proveedor),
    FOREIGN KEY (ID_Empleado_Recibio) REFERENCES dbo.Empleados(ID_Empleado)
);

-- 9. Tabla de Ventas
CREATE TABLE dbo.Ventas (
    ID_Venta VARCHAR(50) PRIMARY KEY,
    VEN_Numero_Boleta VARCHAR(20) UNIQUE,
    ID_Tipo_Comprobante VARCHAR(50),
    VEN_Fecha_Hora DATETIME DEFAULT GETDATE(),
    ID_Empleado VARCHAR(50) NOT NULL,
    ID_Cliente VARCHAR(50),
    ID_Tipo_Pago VARCHAR(50) NOT NULL,
    VEN_Subtotal DECIMAL(10, 2) NOT NULL,
    VEN_IGV DECIMAL(10, 2) NOT NULL,
    VEN_Descuento DECIMAL(10, 2) DEFAULT 0,
    VEN_Total_Venta DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ID_Empleado) REFERENCES dbo.Empleados(ID_Empleado),
    FOREIGN KEY (ID_Cliente) REFERENCES dbo.Clientes(ID_Cliente)
);

-- 10. Tabla de Detalle de Venta
CREATE TABLE dbo.DetalleVenta (
    ID_Venta VARCHAR(50) NOT NULL,
    ID_Lote_Stock VARCHAR(50) NOT NULL,
    DVE_Cantidad INT NOT NULL CHECK (DVE_Cantidad >= 1),
    DVE_Precio_Unitario_Venta DECIMAL(10, 2) NOT NULL,
    DVE_Subtotal DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (ID_Venta, ID_Lote_Stock),
    FOREIGN KEY (ID_Venta) REFERENCES dbo.Ventas(ID_Venta),
    FOREIGN KEY (ID_Lote_Stock) REFERENCES dbo.LotesStock(ID_Lote_Stock)
);
