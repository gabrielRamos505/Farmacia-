const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

// ==========================================
// FUNCIONES HELPER
// ==========================================

// Formatear fecha para SQL Server
const getDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Obtener rango de fechas
const getDateRange = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return {
    start: getDateOnly(startDate),
    end: getDateOnly(endDate)
  };
};

// Formatear moneda
const formatCurrency = (value) => parseFloat(value || 0).toFixed(2);

// ==========================================
// ESTADÍSTICAS GENERALES DEL DÍA
// ==========================================
exports.getStats = async (req, res) => {
  try {
    const hoy = getDateOnly(new Date());
    const ayer = getDateOnly(new Date(Date.now() - 86400000));

    // Obtener rol y ID del usuario del token
    const userRole = req.user?.puesto;
    const empleadoId = req.user?.empleadoId;
    const isAdmin = req.user?.isAdmin;

    // Decidir si filtramos por empleado (Cajeros solo ven lo suyo)
    const filterByEmpleado = (userRole === 'Cajero' || userRole === 'Vendedor') && !isAdmin;
    const empFilter = filterByEmpleado ? ' AND ID_Empleado = :empleadoId' : '';
    const empFilterProducts = filterByEmpleado ? ' AND v.ID_Empleado = :empleadoId' : '';

    // Ventas de hoy
    const [ventasHoy] = await sequelize.query(`
      SELECT 
        COUNT(*) as totalVentas,
        ISNULL(SUM(VEN_Total_Venta), 0) as totalIngresos
      FROM Ventas
      WHERE CAST(VEN_Fecha_Hora AS DATE) = :hoy
      ${empFilter}
    `, {
      replacements: { hoy, empleadoId },
      type: QueryTypes.SELECT
    });

    // Ventas de ayer para comparación
    const [ventasAyer] = await sequelize.query(`
      SELECT ISNULL(SUM(VEN_Total_Venta), 0) as totalAyer
      FROM Ventas
      WHERE CAST(VEN_Fecha_Hora AS DATE) = :ayer
      ${empFilter}
    `, {
      replacements: { ayer, empleadoId },
      type: QueryTypes.SELECT
    });

    // Productos vendidos hoy
    const [productosVendidos] = await sequelize.query(`
      SELECT ISNULL(SUM(dv.DVE_Cantidad), 0) as cantidad
      FROM DetalleVenta dv
      INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
      WHERE CAST(v.VEN_Fecha_Hora AS DATE) = :hoy
      ${empFilterProducts}
    `, {
      replacements: { hoy, empleadoId },
      type: QueryTypes.SELECT
    });

    // Clientes únicos atendidos hoy
    const [clientesHoy] = await sequelize.query(`
      SELECT COUNT(DISTINCT ID_Cliente) as cantidad
      FROM Ventas
      WHERE CAST(VEN_Fecha_Hora AS DATE) = :hoy
      AND ID_Cliente IS NOT NULL
      ${empFilter}
    `, {
      replacements: { hoy, empleadoId },
      type: QueryTypes.SELECT
    });

    // Total de productos en inventario (Global para todos)
    const [totalProductos] = await sequelize.query(`
      SELECT COUNT(DISTINCT ID_Producto) as total
      FROM ProductosComerciales
      WHERE PCO_Estado = 'Activo'
    `, { type: QueryTypes.SELECT });

    // Total de clientes registrados (Global o filtrado?)
    // Vamos a dejarlo global para Gerencia y filtrado para Cajeros si queremos ver "mis clientes atendidos hoy"
    const [totalClientes] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM Clientes
    `, { type: QueryTypes.SELECT });

    // Calcular métricas
    const totalHoy = parseFloat(ventasHoy.totalIngresos);
    const totalAyer = parseFloat(ventasAyer.totalAyer);
    const ventasCount = parseInt(ventasHoy.totalVentas);

    const cambioVentas = totalAyer > 0
      ? ((totalHoy - totalAyer) / totalAyer * 100)
      : (totalHoy > 0 ? 100 : 0);

    const ticketPromedio = ventasCount > 0 ? totalHoy / ventasCount : 0;

    res.json({
      ventasHoy: formatCurrency(totalHoy),
      productosVendidos: parseInt(productosVendidos.cantidad),
      clientesAtendidos: parseInt(clientesHoy.cantidad),
      ticketPromedio: formatCurrency(ticketPromedio),
      cambioVentas: parseFloat(cambioVentas.toFixed(1)),
      totalProductos: parseInt(totalProductos.total),
      totalClientes: parseInt(totalClientes.total),
      totalVentas: ventasCount,
      filterByEmpleado // Para que el frontend sepa si son datos parciales
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
};

// ==========================================
// VENTAS DE LOS ÚLTIMOS 7 DÍAS
// ==========================================
exports.getVentasSemana = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;

    // ✅ CORREGIDO: Usar $1 en lugar de :dias
    const ventasSemana = await sequelize.query(`
      SELECT 
        CONVERT(VARCHAR(10), VEN_Fecha_Hora, 23) as fecha,
        FORMAT(VEN_Fecha_Hora, 'ddd dd/MM', 'es-ES') as label,
        ISNULL(SUM(VEN_Total_Venta), 0) as total,
        COUNT(*) as cantidad
      FROM Ventas
      WHERE VEN_Fecha_Hora >= DATEADD(day, -$1, GETDATE())
      GROUP BY 
        CONVERT(VARCHAR(10), VEN_Fecha_Hora, 23),
        FORMAT(VEN_Fecha_Hora, 'ddd dd/MM', 'es-ES')
      ORDER BY fecha ASC
    `, {
      bind: [dias],  // ✅ Usar bind en lugar de replacements
      type: QueryTypes.SELECT
    });

    res.json(ventasSemana);
  } catch (error) {
    console.error('❌ Error al obtener ventas de la semana:', error);
    res.status(500).json({ error: 'Error al obtener ventas de la semana' });
  }
};


// ==========================================
// TOP 5 PRODUCTOS MÁS VENDIDOS
// ==========================================
exports.getTopProductos = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    // ✅ CORREGIDO: Eliminar DVE_Precio_Unitario que no existe
    const topProductos = await sequelize.query(`
      SELECT TOP 5
        pc.PCO_Nombre_Comercial as nombre,
        pc.PCO_Laboratorio as laboratorio,
        SUM(dv.DVE_Cantidad) as cantidad,
        SUM(dv.DVE_Subtotal) as total,
        AVG(dv.DVE_Subtotal / NULLIF(dv.DVE_Cantidad, 0)) as precioPromedio,
        COUNT(DISTINCT v.ID_Venta) as numVentas
      FROM DetalleVenta dv
      INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
      INNER JOIN LotesStock ls ON dv.ID_Lote_Stock = ls.ID_Lote_Stock
      INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
      WHERE CAST(v.VEN_Fecha_Hora AS DATE) = $1
      GROUP BY pc.PCO_Nombre_Comercial, pc.PCO_Laboratorio
      ORDER BY cantidad DESC
    `, {
      bind: [fecha],
      type: QueryTypes.SELECT
    });

    res.json(topProductos);
  } catch (error) {
    console.error('❌ Error al obtener top productos:', error);
    res.status(500).json({ error: 'Error al obtener top productos' });
  }
};


// ==========================================
// DISTRIBUCIÓN POR LABORATORIO
// ==========================================
exports.getDistribucionLaboratorio = async (req, res) => {
  try {
    const distribucion = await sequelize.query(`
      SELECT 
        ISNULL(pc.PCO_Laboratorio, 'Sin Laboratorio') as laboratorio,
        COUNT(DISTINCT pc.ID_Producto) as totalProductos,
        ISNULL(SUM(ls.LST_Cantidad_Actual), 0) as stockTotal
      FROM ProductosComerciales pc
      LEFT JOIN LotesStock ls ON pc.ID_Producto = ls.ID_Producto 
        AND ls.LST_Estado = 'Disponible'
      WHERE pc.PCO_Estado = 'Activo'
      GROUP BY pc.PCO_Laboratorio
      ORDER BY totalProductos DESC
    `, { type: QueryTypes.SELECT });

    const distribucionFormateada = distribucion.map(d => ({
      name: d.laboratorio,
      value: parseInt(d.totalProductos),
      stock: parseInt(d.stockTotal)
    }));

    res.json(distribucionFormateada);

  } catch (error) {
    console.error('❌ Error al obtener distribución:', error);
    res.status(500).json({
      message: 'Error al obtener distribución por laboratorio',
      error: error.message
    });
  }
};

// ==========================================
// MÉTODOS DE PAGO
// ==========================================
exports.getMetodosPago = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'hoy';
    let whereClause = '';

    switch (periodo) {
      case 'semana':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())';
        break;
      case 'mes':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
        break;
      default:
        whereClause = `WHERE CAST(v.VEN_Fecha_Hora AS DATE) = '${getDateOnly(new Date())}'`;
    }

    const metodos = await sequelize.query(`
      SELECT 
        tp.TPA_Nombre as metodo,
        COUNT(*) as cantidad,
        SUM(v.VEN_Total_Venta) as total,
        AVG(v.VEN_Total_Venta) as promedio
      FROM Ventas v
      INNER JOIN TiposPago tp ON v.ID_Tipo_Pago = tp.ID_Tipo_Pago
      ${whereClause}
      GROUP BY tp.TPA_Nombre
      ORDER BY total DESC
    `, { type: QueryTypes.SELECT });

    const metodosFormateados = metodos.map(m => ({
      name: m.metodo,
      cantidad: parseInt(m.cantidad),
      total: formatCurrency(m.total),
      promedio: formatCurrency(m.promedio)
    }));

    res.json(metodosFormateados);

  } catch (error) {
    console.error('❌ Error al obtener métodos de pago:', error);
    res.status(500).json({
      message: 'Error al obtener métodos de pago',
      error: error.message
    });
  }
};

// ==========================================
// ÚLTIMAS 10 VENTAS DEL DÍA
// ==========================================
exports.getUltimasVentas = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    // Filtro por rol
    const userRole = req.user?.puesto;
    const empleadoId = req.user?.empleadoId;
    const filterByEmpleado = (userRole === 'Cajero' || userRole === 'Vendedor') && !req.user?.isAdmin;
    const empFilter = filterByEmpleado ? ' AND v.ID_Empleado = :empleadoId' : '';

    const ultimasVentas = await sequelize.query(`
      SELECT TOP 10
        v.ID_Venta as id,
        v.VEN_Numero_Boleta as boleta,
        v.VEN_Fecha_Hora as fecha,
        CASE 
          WHEN c.ID_Cliente IS NOT NULL AND p.ID_Persona IS NOT NULL
          THEN CONCAT(p.PER_Nombre, ' ', p.PER_Apellido)
          ELSE 'Cliente General'
        END as cliente,
        ISNULL(p.PER_DNI, 'Sin DNI') as dni,
        (SELECT COUNT(*) FROM DetalleVenta WHERE ID_Venta = v.ID_Venta) as productos,
        tp.TPA_Nombre as metodoPago,
        v.VEN_Total_Venta as total,
        CONCAT(pe.PER_Nombre, ' ', pe.PER_Apellido) as vendedor
      FROM Ventas v
      LEFT JOIN Clientes c ON v.ID_Cliente = c.ID_Cliente
      LEFT JOIN Personas p ON c.ID_Persona = p.ID_Persona
      LEFT JOIN TiposPago tp ON v.ID_Tipo_Pago = tp.ID_Tipo_Pago
      LEFT JOIN Empleados e ON v.ID_Empleado = e.ID_Empleado
      LEFT JOIN Personas pe ON e.ID_Persona = pe.ID_Persona
      WHERE CAST(v.VEN_Fecha_Hora AS DATE) = :fecha
      ${empFilter}
      ORDER BY v.VEN_Fecha_Hora DESC
    `, {
      replacements: { fecha, empleadoId },
      type: QueryTypes.SELECT
    });

    res.json(ultimasVentas);
  } catch (error) {
    console.error('❌ Error al obtener últimas ventas:', error);
    res.status(500).json({ error: 'Error al obtener últimas ventas' });
  }
};


// ==========================================
// ALERTAS DEL SISTEMA
// ==========================================
exports.getAlertas = async (req, res) => {
  try {
    // Productos próximos a vencer
    const productosProximosVencer = await sequelize.query(`
      SELECT TOP 10
        pc.ID_Producto as id,
        pc.PCO_Nombre_Comercial as nombre,
        pc.PCO_Laboratorio as laboratorio,
        ls.LST_Fecha_Vencimiento as fechaVencimiento,
        ls.LST_Cantidad_Actual as stock,
        DATEDIFF(day, GETDATE(), ls.LST_Fecha_Vencimiento) as diasRestantes,
        ls.LST_Numero_Lote as lote
      FROM LotesStock ls
      INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
      WHERE ls.LST_Estado = 'Disponible'
        AND ls.LST_Fecha_Vencimiento IS NOT NULL
        AND ls.LST_Fecha_Vencimiento <= DATEADD(day, 30, GETDATE())
        AND ls.LST_Fecha_Vencimiento > GETDATE()
        AND ls.LST_Cantidad_Actual > 0
        AND pc.PCO_Estado = 'Activo'
      ORDER BY ls.LST_Fecha_Vencimiento ASC
    `, {
      type: QueryTypes.SELECT
    });

    // Productos con stock bajo
    const productosStockBajo = await sequelize.query(`
      SELECT TOP 10
        pc.ID_Producto as id,
        pc.PCO_Nombre_Comercial as nombre,
        pc.PCO_Laboratorio as laboratorio,
        ISNULL(SUM(ls.LST_Cantidad_Actual), 0) as stockTotal,
        ISNULL(pc.PCO_Stock_Minimo, 10) as stockMinimo,
        COUNT(ls.ID_Lote_Stock) as lotes
      FROM ProductosComerciales pc
      LEFT JOIN LotesStock ls ON pc.ID_Producto = ls.ID_Producto 
        AND ls.LST_Estado = 'Disponible'
      WHERE pc.PCO_Estado = 'Activo'
      GROUP BY 
        pc.ID_Producto,
        pc.PCO_Nombre_Comercial,
        pc.PCO_Laboratorio,
        pc.PCO_Stock_Minimo
      HAVING ISNULL(SUM(ls.LST_Cantidad_Actual), 0) <= ISNULL(pc.PCO_Stock_Minimo, 10)
      ORDER BY stockTotal ASC
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      productosProximosVencer,
      productosStockBajo
    });
  } catch (error) {
    console.error('❌ Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};



// ==========================================
// TENDENCIAS Y COMPARATIVAS
// ==========================================
exports.getTendencias = async (req, res) => {
  try {
    const periodo = parseInt(req.query.dias) || 30;

    const tendencias = await sequelize.query(`
      SELECT 
        DATEPART(WEEK, VEN_Fecha_Hora) as semana,
        DATEPART(YEAR, VEN_Fecha_Hora) as año,
        COUNT(*) as ventasTotales,
        SUM(VEN_Total_Venta) as ingresosTotales,
        AVG(VEN_Total_Venta) as ticketPromedio,
        COUNT(DISTINCT ID_Cliente) as clientesUnicos
      FROM Ventas
      WHERE VEN_Fecha_Hora >= DATEADD(day, -:periodo, GETDATE())
      GROUP BY 
        DATEPART(WEEK, VEN_Fecha_Hora),
        DATEPART(YEAR, VEN_Fecha_Hora)
      ORDER BY año, semana
    `, {
      replacements: { periodo },
      type: QueryTypes.SELECT
    });

    res.json(tendencias);

  } catch (error) {
    console.error('❌ Error al obtener tendencias:', error);
    res.status(500).json({
      message: 'Error al obtener tendencias',
      error: error.message
    });
  }
};

// ==========================================
// RESUMEN COMPLETO DEL DASHBOARD
// ==========================================
exports.getResumenCompleto = async (req, res) => {
  try {
    // Ejecutar todas las consultas en paralelo
    const [stats, ventas, productos, alertas] = await Promise.all([
      exports.getStats({ query: {} }, { json: data => data }),
      exports.getVentasSemana({ query: {} }, { json: data => data }),
      exports.getTopProductos({ query: {} }, { json: data => data }),
      exports.getAlertas({ query: {} }, { json: data => data })
    ]);

    res.json({
      timestamp: new Date(),
      stats,
      ventasSemanales: ventas,
      topProductos: productos,
      alertas
    });

  } catch (error) {
    console.error('❌ Error al obtener resumen completo:', error);
    res.status(500).json({
      message: 'Error al obtener resumen completo',
      error: error.message
    });
  }
};

// ==========================================
// 📊 ANÁLISIS AVANZADO: EMPLEADOS
// ==========================================

// Top empleados por ventas
exports.getTopEmpleados = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes'; // hoy, semana, mes, año
    let whereClause = '';

    switch (periodo) {
      case 'hoy':
        whereClause = `WHERE CAST(v.VEN_Fecha_Hora AS DATE) = CAST(GETDATE() AS DATE)`;
        break;
      case 'semana':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())';
        break;
      case 'año':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(year, -1, GETDATE())';
        break;
      default: // mes
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
    }

    const topEmpleados = await sequelize.query(`
      SELECT TOP 10
        e.ID_Empleado as id,
        CONCAT(p.PER_Nombre, ' ', p.PER_Apellido) as nombre,
        pu.PUE_Nombre as puesto,
        ISNULL(e.EMP_Salario, 0) as salario,
        COUNT(v.ID_Venta) as totalVentas,
        ISNULL(SUM(v.VEN_Total_Venta), 0) as totalIngresos,
        ISNULL(AVG(v.VEN_Total_Venta), 0) as ticketPromedio,
        COUNT(DISTINCT v.ID_Cliente) as clientesAtendidos,
        ISNULL(SUM(dv.cantidadProductos), 0) as productosVendidos,
        MAX(v.VEN_Fecha_Hora) as ultimaVenta
      FROM Empleados e
      INNER JOIN Personas p ON e.ID_Persona = p.ID_Persona
      INNER JOIN Puestos pu ON e.ID_Puesto = pu.ID_Puesto
      LEFT JOIN Ventas v ON e.ID_Empleado = v.ID_Empleado
      LEFT JOIN (
        SELECT ID_Venta, SUM(DVE_Cantidad) as cantidadProductos
        FROM DetalleVenta
        GROUP BY ID_Venta
      ) dv ON v.ID_Venta = dv.ID_Venta
      ${whereClause}
      GROUP BY 
        e.ID_Empleado,
        p.PER_Nombre,
        p.PER_Apellido,
        pu.PUE_Nombre,
        e.EMP_Salario
      ORDER BY totalIngresos DESC
    `, { type: QueryTypes.SELECT });

    const topEmpleadosFormateados = topEmpleados.map((emp, index) => ({
      ranking: index + 1,
      id: emp.id,
      nombre: emp.nombre,
      puesto: emp.puesto,
      totalVentas: parseInt(emp.totalVentas),
      totalIngresos: formatCurrency(emp.totalIngresos),
      ticketPromedio: formatCurrency(emp.ticketPromedio),
      clientesAtendidos: parseInt(emp.clientesAtendidos),
      productosVendidos: parseInt(emp.productosVendidos || 0),
      ultimaVenta: emp.ultimaVenta
    }));

    res.json(topEmpleadosFormateados);
  } catch (error) {
    console.error('❌ Error al obtener top empleados:', error);
    res.status(500).json({ error: 'Error al obtener ranking de empleados' });
  }
};

// Rendimiento individual del empleado
exports.getRendimientoEmpleado = async (req, res) => {
  try {
    const { empleadoId } = req.params;
    const periodo = req.query.periodo || 'mes';

    let whereClause = 'WHERE v.ID_Empleado = :empleadoId';

    switch (periodo) {
      case 'hoy':
        whereClause += ` AND CAST(v.VEN_Fecha_Hora AS DATE) = CAST(GETDATE() AS DATE)`;
        break;
      case 'semana':
        whereClause += ' AND v.VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())';
        break;
      case 'año':
        whereClause += ' AND v.VEN_Fecha_Hora >= DATEADD(year, -1, GETDATE())';
        break;
      default:
        whereClause += ' AND v.VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
    }

    const [rendimiento] = await sequelize.query(`
      SELECT 
        COUNT(v.ID_Venta) as totalVentas,
        SUM(v.VEN_Total_Venta) as totalIngresos,
        AVG(v.VEN_Total_Venta) as ticketPromedio,
        MAX(v.VEN_Total_Venta) as ventaMayor,
        MIN(v.VEN_Total_Venta) as ventaMenor,
        COUNT(DISTINCT CAST(v.VEN_Fecha_Hora AS DATE)) as diasTrabajados
      FROM Ventas v
      ${whereClause}
    `, {
      replacements: { empleadoId },
      type: QueryTypes.SELECT
    });

    res.json({
      totalVentas: parseInt(rendimiento.totalVentas || 0),
      totalIngresos: formatCurrency(rendimiento.totalIngresos),
      ticketPromedio: formatCurrency(rendimiento.ticketPromedio),
      ventaMayor: formatCurrency(rendimiento.ventaMayor),
      ventaMenor: formatCurrency(rendimiento.ventaMenor),
      diasTrabajados: parseInt(rendimiento.diasTrabajados || 0),
      promedioVentasPorDia: rendimiento.diasTrabajados > 0
        ? (rendimiento.totalVentas / rendimiento.diasTrabajados).toFixed(1)
        : 0
    });
  } catch (error) {
    console.error('❌ Error al obtener rendimiento del empleado:', error);
    res.status(500).json({ error: 'Error al obtener rendimiento del empleado' });
  }
};

// ==========================================
// 📦 ANÁLISIS AVANZADO: PRODUCTOS
// ==========================================

// Productos más y menos vendidos
exports.getRankingProductos = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes';
    const tipo = req.query.tipo || 'mas'; // 'mas' o 'menos'

    let whereClause = '';
    switch (periodo) {
      case 'hoy':
        whereClause = `WHERE CAST(v.VEN_Fecha_Hora AS DATE) = CAST(GETDATE() AS DATE)`;
        break;
      case 'semana':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())';
        break;
      case 'año':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(year, -1, GETDATE())';
        break;
      default:
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
    }

    const orderBy = tipo === 'mas' ? 'DESC' : 'ASC';

    const productos = await sequelize.query(`
      SELECT TOP 20
        pc.ID_Producto as id,
        pc.PCO_Nombre_Comercial as nombre,
        pc.PCO_Laboratorio as laboratorio,
        pc.PCO_Presentacion as presentacion,
        SUM(dv.DVE_Cantidad) as cantidadVendida,
        SUM(dv.DVE_Subtotal) as totalIngresos,
        COUNT(DISTINCT v.ID_Venta) as numeroVentas,
        AVG(dv.DVE_Subtotal / NULLIF(dv.DVE_Cantidad, 0)) as precioPromedio,
        (
          SELECT SUM(LST_Cantidad_Actual)
          FROM LotesStock
          WHERE ID_Producto = pc.ID_Producto
            AND LST_Estado = 'Disponible'
        ) as stockActual
      FROM DetalleVenta dv
      INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
      INNER JOIN LotesStock ls ON dv.ID_Lote_Stock = ls.ID_Lote_Stock
      INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
      ${whereClause}
      GROUP BY 
        pc.ID_Producto,
        pc.PCO_Nombre_Comercial,
        pc.PCO_Laboratorio,
        pc.PCO_Presentacion
      ORDER BY cantidadVendida ${orderBy}
    `, { type: QueryTypes.SELECT });

    const productosFormateados = productos.map((prod, index) => ({
      ranking: index + 1,
      id: prod.id,
      nombre: prod.nombre,
      laboratorio: prod.laboratorio,
      presentacion: prod.presentacion,
      cantidadVendida: parseInt(prod.cantidadVendida),
      totalIngresos: formatCurrency(prod.totalIngresos),
      numeroVentas: parseInt(prod.numeroVentas),
      precioPromedio: formatCurrency(prod.precioPromedio),
      stockActual: parseInt(prod.stockActual || 0)
    }));

    res.json(productosFormateados);
  } catch (error) {
    console.error('❌ Error al obtener ranking de productos:', error);
    res.status(500).json({ error: 'Error al obtener ranking de productos' });
  }
};

// Análisis de rotación de productos
exports.getRotacionProductos = async (req, res) => {
  try {
    const rotacion = await sequelize.query(`
      SELECT TOP 30
        pc.ID_Producto as id,
        pc.PCO_Nombre_Comercial as nombre,
        pc.PCO_Laboratorio as laboratorio,
        ISNULL(SUM(ls.LST_Cantidad_Actual), 0) as stockActual,
        ISNULL(ventas30dias.cantidadVendida, 0) as vendidoUltimos30Dias,
        CASE 
          WHEN ISNULL(ventas30dias.cantidadVendida, 0) > 0 
          THEN CAST(ISNULL(SUM(ls.LST_Cantidad_Actual), 0) AS FLOAT) / (ISNULL(ventas30dias.cantidadVendida, 0) / 30.0)
          ELSE 999
        END as diasInventario,
        CASE 
          WHEN ISNULL(SUM(ls.LST_Cantidad_Actual), 0) = 0 THEN 'Sin Stock'
          WHEN ISNULL(ventas30dias.cantidadVendida, 0) = 0 THEN 'Sin Movimiento'
          WHEN CAST(ISNULL(SUM(ls.LST_Cantidad_Actual), 0) AS FLOAT) / (ISNULL(ventas30dias.cantidadVendida, 0) / 30.0) < 7 THEN 'Rotación Alta'
          WHEN CAST(ISNULL(SUM(ls.LST_Cantidad_Actual), 0) AS FLOAT) / (ISNULL(ventas30dias.cantidadVendida, 0) / 30.0) < 30 THEN 'Rotación Media'
          ELSE 'Rotación Baja'
        END as clasificacion
      FROM ProductosComerciales pc
      LEFT JOIN LotesStock ls ON pc.ID_Producto = ls.ID_Producto 
        AND ls.LST_Estado = 'Disponible'
      LEFT JOIN (
        SELECT 
          ls2.ID_Producto,
          SUM(dv.DVE_Cantidad) as cantidadVendida
        FROM DetalleVenta dv
        INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
        INNER JOIN LotesStock ls2 ON dv.ID_Lote_Stock = ls2.ID_Lote_Stock
        WHERE v.VEN_Fecha_Hora >= DATEADD(day, -30, GETDATE())
        GROUP BY ls2.ID_Producto
      ) ventas30dias ON pc.ID_Producto = ventas30dias.ID_Producto
      WHERE pc.PCO_Estado = 'Activo'
      GROUP BY 
        pc.ID_Producto,
        pc.PCO_Nombre_Comercial,
        pc.PCO_Laboratorio,
        ventas30dias.cantidadVendida
      ORDER BY diasInventario ASC
    `, { type: QueryTypes.SELECT });

    res.json(rotacion);
  } catch (error) {
    console.error('❌ Error al obtener rotación de productos:', error);
    res.status(500).json({ error: 'Error al obtener rotación de productos' });
  }
};

// ==========================================
// 👥 ANÁLISIS AVANZADO: CLIENTES
// ==========================================

// Clientes más frecuentes
exports.getClientesFrecuentes = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes';
    let whereClause = '';

    switch (periodo) {
      case 'semana':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())';
        break;
      case 'año':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(year, -1, GETDATE())';
        break;
      default:
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
    }

    const clientesFrecuentes = await sequelize.query(`
      SELECT TOP 20
        c.ID_Cliente as id,
        CONCAT(p.PER_Nombre, ' ', p.PER_Apellido) as nombre,
        p.PER_DNI as dni,
        p.PER_Email as email,
        p.PER_Telefono as telefono,
        COUNT(v.ID_Venta) as numeroVisitas,
        SUM(v.VEN_Total_Venta) as totalGastado,
        AVG(v.VEN_Total_Venta) as ticketPromedio,
        MAX(v.VEN_Fecha_Hora) as ultimaVisita,
        MIN(v.VEN_Fecha_Hora) as primeraVisita,
        DATEDIFF(day, MIN(v.VEN_Fecha_Hora), MAX(v.VEN_Fecha_Hora)) as diasComoCliente,
        c.CLI_Puntos_Fidelidad as puntosFidelidad
      FROM Clientes c
      INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
      INNER JOIN Ventas v ON c.ID_Cliente = v.ID_Cliente
      ${whereClause}
      GROUP BY 
        c.ID_Cliente,
        p.PER_Nombre,
        p.PER_Apellido,
        p.PER_DNI,
        p.PER_Email,
        p.PER_Telefono,
        c.CLI_Puntos_Fidelidad
      ORDER BY numeroVisitas DESC
    `, { type: QueryTypes.SELECT });

    const clientesFormateados = clientesFrecuentes.map((cliente, index) => ({
      ranking: index + 1,
      id: cliente.id,
      nombre: cliente.nombre,
      dni: cliente.dni,
      email: cliente.email,
      telefono: cliente.telefono,
      numeroVisitas: parseInt(cliente.numeroVisitas),
      totalGastado: formatCurrency(cliente.totalGastado),
      ticketPromedio: formatCurrency(cliente.ticketPromedio),
      ultimaVisita: cliente.ultimaVisita,
      primeraVisita: cliente.primeraVisita,
      diasComoCliente: parseInt(cliente.diasComoCliente),
      puntosFidelidad: parseInt(cliente.puntosFidelidad || 0),
      frecuenciaVisitas: cliente.diasComoCliente > 0
        ? (cliente.numeroVisitas / (cliente.diasComoCliente / 30)).toFixed(1) + ' visitas/mes'
        : 'N/A'
    }));

    res.json(clientesFormateados);
  } catch (error) {
    console.error('❌ Error al obtener clientes frecuentes:', error);
    res.status(500).json({ error: 'Error al obtener clientes frecuentes' });
  }
};

// Clientes que más gastan (VIP)
exports.getClientesVIP = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes';
    let whereClause = '';

    switch (periodo) {
      case 'semana':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())';
        break;
      case 'año':
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(year, -1, GETDATE())';
        break;
      default:
        whereClause = 'WHERE v.VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
    }

    const clientesVIP = await sequelize.query(`
      SELECT TOP 20
        c.ID_Cliente as id,
        CONCAT(p.PER_Nombre, ' ', p.PER_Apellido) as nombre,
        p.PER_DNI as dni,
        p.PER_Email as email,
        p.PER_Telefono as telefono,
        p.PER_Direccion as direccion,
        COUNT(v.ID_Venta) as numeroCompras,
        SUM(v.VEN_Total_Venta) as totalGastado,
        AVG(v.VEN_Total_Venta) as ticketPromedio,
        MAX(v.VEN_Total_Venta) as compraMayor,
        MIN(v.VEN_Total_Venta) as compraMenor,
        MAX(v.VEN_Fecha_Hora) as ultimaCompra,
        c.CLI_Puntos_Fidelidad as puntosFidelidad,
        CASE 
          WHEN SUM(v.VEN_Total_Venta) >= 5000 THEN 'Platino'
          WHEN SUM(v.VEN_Total_Venta) >= 2000 THEN 'Oro'
          WHEN SUM(v.VEN_Total_Venta) >= 1000 THEN 'Plata'
          ELSE 'Bronce'
        END as categoria
      FROM Clientes c
      INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
      INNER JOIN Ventas v ON c.ID_Cliente = v.ID_Cliente
      ${whereClause}
      GROUP BY 
        c.ID_Cliente,
        p.PER_Nombre,
        p.PER_Apellido,
        p.PER_DNI,
        p.PER_Email,
        p.PER_Telefono,
        p.PER_Direccion,
        c.CLI_Puntos_Fidelidad
      ORDER BY totalGastado DESC
    `, { type: QueryTypes.SELECT });

    const clientesFormateados = clientesVIP.map((cliente, index) => ({
      ranking: index + 1,
      id: cliente.id,
      nombre: cliente.nombre,
      dni: cliente.dni,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      numeroCompras: parseInt(cliente.numeroCompras),
      totalGastado: formatCurrency(cliente.totalGastado),
      ticketPromedio: formatCurrency(cliente.ticketPromedio),
      compraMayor: formatCurrency(cliente.compraMayor),
      compraMenor: formatCurrency(cliente.compraMenor),
      ultimaCompra: cliente.ultimaCompra,
      puntosFidelidad: parseInt(cliente.puntosFidelidad || 0),
      categoria: cliente.categoria
    }));

    res.json(clientesFormateados);
  } catch (error) {
    console.error('❌ Error al obtener clientes VIP:', error);
    res.status(500).json({ error: 'Error al obtener clientes VIP' });
  }
};

// ==========================================
// ⏰ ANÁLISIS DE HORARIOS Y TENDENCIAS
// ==========================================

// Análisis de ventas por hora del día
exports.getVentasPorHora = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'semana';
    let whereClause = '';

    switch (periodo) {
      case 'hoy':
        whereClause = `WHERE CAST(VEN_Fecha_Hora AS DATE) = CAST(GETDATE() AS DATE)`;
        break;
      case 'mes':
        whereClause = 'WHERE VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
        break;
      default:
        whereClause = 'WHERE VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())';
    }

    const ventasPorHora = await sequelize.query(`
      SELECT 
        DATEPART(HOUR, VEN_Fecha_Hora) as hora,
        COUNT(*) as numeroVentas,
        SUM(VEN_Total_Venta) as totalIngresos,
        AVG(VEN_Total_Venta) as ticketPromedio,
        COUNT(DISTINCT ID_Cliente) as clientesUnicos
      FROM Ventas
      ${whereClause}
      GROUP BY DATEPART(HOUR, VEN_Fecha_Hora)
      ORDER BY hora ASC
    `, { type: QueryTypes.SELECT });

    // Asegurar que tengamos las 24 horas del día para un gráfico continuo (especialmente en 'hoy')
    const todasLasHoras = Array.from({ length: 24 }, (_, i) => {
      const datoExistente = ventasPorHora.find(v => parseInt(v.hora) === i);
      return datoExistente ? {
        ...datoExistente,
        hora: i
      } : {
        hora: i,
        numeroVentas: 0,
        totalIngresos: 0,
        ticketPromedio: 0,
        clientesUnicos: 0
      };
    });

    const ventasFormateadas = todasLasHoras.map(v => ({
      hora: `${String(v.hora).padStart(2, '0')}:00`,
      numeroVentas: parseInt(v.numeroVentas),
      totalIngresos: formatCurrency(v.totalIngresos),
      ticketPromedio: formatCurrency(v.ticketPromedio),
      clientesUnicos: parseInt(v.clientesUnicos)
    }));

    // Identificar hora pico
    const horaPico = ventasFormateadas.reduce((max, current) =>
      current.numeroVentas > max.numeroVentas ? current : max
      , ventasFormateadas[0] || {});

    res.json({
      ventasPorHora: ventasFormateadas,
      horaPico: horaPico,
      totalHoras: ventasFormateadas.length
    });
  } catch (error) {
    console.error('❌ Error al obtener ventas por hora:', error);
    res.status(500).json({ error: 'Error al obtener análisis de horarios' });
  }
};

// Análisis de ventas por día de la semana
exports.getVentasPorDiaSemana = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes';
    let whereClause = '';

    switch (periodo) {
      case 'año':
        whereClause = 'WHERE VEN_Fecha_Hora >= DATEADD(year, -1, GETDATE())';
        break;
      default:
        whereClause = 'WHERE VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())';
    }

    const ventasPorDia = await sequelize.query(`
      SELECT 
        DATEPART(WEEKDAY, VEN_Fecha_Hora) as diaSemana,
        DATENAME(WEEKDAY, VEN_Fecha_Hora) as nombreDia,
        COUNT(*) as numeroVentas,
        SUM(VEN_Total_Venta) as totalIngresos,
        AVG(VEN_Total_Venta) as ticketPromedio
      FROM Ventas
      ${whereClause}
      GROUP BY 
        DATEPART(WEEKDAY, VEN_Fecha_Hora),
        DATENAME(WEEKDAY, VEN_Fecha_Hora)
      ORDER BY diaSemana ASC
    `, { type: QueryTypes.SELECT });

    const diasEspañol = {
      'Monday': 'Lunes',
      'Tuesday': 'Martes',
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado',
      'Sunday': 'Domingo'
    };

    const ventasFormateadas = ventasPorDia.map(v => ({
      dia: diasEspañol[v.nombreDia] || v.nombreDia,
      numeroVentas: parseInt(v.numeroVentas),
      totalIngresos: formatCurrency(v.totalIngresos),
      ticketPromedio: formatCurrency(v.ticketPromedio)
    }));

    res.json(ventasFormateadas);
  } catch (error) {
    console.error('❌ Error al obtener ventas por día:', error);
    res.status(500).json({ error: 'Error al obtener ventas por día de la semana' });
  }
};

// ==========================================
// 📈 COMPARATIVAS Y TENDENCIAS
// ==========================================

// Comparativa mensual
exports.getComparativaMensual = async (req, res) => {
  try {
    const meses = parseInt(req.query.meses) || 6;

    const comparativa = await sequelize.query(`
      SELECT 
        YEAR(VEN_Fecha_Hora) as año,
        MONTH(VEN_Fecha_Hora) as mes,
        DATENAME(MONTH, VEN_Fecha_Hora) as nombreMes,
        COUNT(*) as numeroVentas,
        SUM(VEN_Total_Venta) as totalIngresos,
        AVG(VEN_Total_Venta) as ticketPromedio,
        COUNT(DISTINCT ID_Cliente) as clientesUnicos,
        COUNT(DISTINCT ID_Empleado) as empleadosActivos
      FROM Ventas
      WHERE VEN_Fecha_Hora >= DATEADD(month, :delta, GETDATE())
      GROUP BY 
        YEAR(VEN_Fecha_Hora),
        MONTH(VEN_Fecha_Hora),
        DATENAME(MONTH, VEN_Fecha_Hora)
      ORDER BY año DESC, mes DESC
    `, {
      replacements: { delta: -meses },
      type: QueryTypes.SELECT
    });

    const mesesEspañol = {
      'January': 'Enero', 'February': 'Febrero', 'March': 'Marzo',
      'April': 'Abril', 'May': 'Mayo', 'June': 'Junio',
      'July': 'Julio', 'August': 'Agosto', 'September': 'Septiembre',
      'October': 'Octubre', 'November': 'Noviembre', 'December': 'Diciembre'
    };

    // Generar los últimos N meses para asegurar un gráfico completo
    const comparativaCompleta = [];
    const fechaActual = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const año = d.getFullYear();
      const mes = d.getMonth() + 1;

      const dato = comparativa.find(c => parseInt(c.año) === año && parseInt(c.mes) === mes);

      if (dato) {
        comparativaCompleta.push({
          periodo: `${mesesEspañol[dato.nombreMes] || dato.nombreMes} ${dato.año}`,
          numeroVentas: parseInt(dato.numeroVentas),
          totalIngresos: formatCurrency(dato.totalIngresos),
          ticketPromedio: formatCurrency(dato.ticketPromedio),
          clientesUnicos: parseInt(dato.clientesUnicos),
          empleadosActivos: parseInt(dato.empleadosActivos)
        });
      } else {
        const nombreMesIngles = d.toLocaleString('en-US', { month: 'long' });
        comparativaCompleta.push({
          periodo: `${mesesEspañol[nombreMesIngles] || nombreMesIngles} ${año}`,
          numeroVentas: 0,
          totalIngresos: 0,
          ticketPromedio: 0,
          clientesUnicos: 0,
          empleadosActivos: 0
        });
      }
    }

    const comparativaFormateada = comparativaCompleta;

    // Calcular crecimiento
    if (comparativaFormateada.length >= 2) {
      const mesActual = parseFloat(comparativaFormateada[0].totalIngresos);
      const mesAnterior = parseFloat(comparativaFormateada[1].totalIngresos);
      const crecimiento = mesAnterior > 0
        ? ((mesActual - mesAnterior) / mesAnterior * 100).toFixed(2)
        : 0;

      res.json({
        comparativa: comparativaFormateada,
        crecimientoMensual: `${crecimiento}%`,
        tendencia: crecimiento > 0 ? 'Creciente' : 'Decreciente'
      });
    } else {
      res.json({ comparativa: comparativaFormateada });
    }
  } catch (error) {
    console.error('❌ Error al obtener comparativa mensual [###VERIFY###]:', error);
    res.status(500).json({ error: 'Error al obtener comparativa mensual' });
  }
};

// ==========================================
// 🎯 DASHBOARD COMPLETO AVANZADO
// ==========================================

exports.getDashboardAvanzado = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes';
    let whereClause = "WHERE v.VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())";
    let whereClauseSimple = "WHERE VEN_Fecha_Hora >= DATEADD(month, -1, GETDATE())";

    if (periodo === 'hoy') {
      whereClause = "WHERE CAST(v.VEN_Fecha_Hora AS DATE) = CAST(GETDATE() AS DATE)";
      whereClauseSimple = "WHERE CAST(VEN_Fecha_Hora AS DATE) = CAST(GETDATE() AS DATE)";
    } else if (periodo === 'semana') {
      whereClause = "WHERE v.VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())";
      whereClauseSimple = "WHERE VEN_Fecha_Hora >= DATEADD(day, -7, GETDATE())";
    }

    // Ejecutar todas las consultas en paralelo
    const [
      topEmpleados,
      productosMasVendidos,
      productosMenosVendidos,
      clientesFrecuentes,
      clientesVIP,
      ventasPorHora,
      ventasPorDia,
      resumenData
    ] = await Promise.all([
      sequelize.query(`
        SELECT TOP 5
          CONCAT(p.PER_Nombre, ' ', p.PER_Apellido) as nombre,
          COUNT(v.ID_Venta) as ventas,
          SUM(v.VEN_Total_Venta) as total
        FROM Empleados e
        INNER JOIN Personas p ON e.ID_Persona = p.ID_Persona
        LEFT JOIN Ventas v ON e.ID_Empleado = v.ID_Empleado
        ${whereClause}
        GROUP BY p.PER_Nombre, p.PER_Apellido
        ORDER BY total DESC
      `, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT TOP 5
          pc.PCO_Nombre_Comercial as nombre,
          SUM(dv.DVE_Cantidad) as cantidad
        FROM DetalleVenta dv
        INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
        INNER JOIN LotesStock ls ON dv.ID_Lote_Stock = ls.ID_Lote_Stock
        INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
        ${whereClause.replace('v.VEN_Fecha_Hora', 'v.VEN_Fecha_Hora')}
        GROUP BY pc.PCO_Nombre_Comercial
        ORDER BY cantidad DESC
      `, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT TOP 5
          pc.PCO_Nombre_Comercial as nombre,
          SUM(dv.DVE_Cantidad) as cantidad
        FROM DetalleVenta dv
        INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
        INNER JOIN LotesStock ls ON dv.ID_Lote_Stock = ls.ID_Lote_Stock
        INNER JOIN ProductosComerciales pc ON ls.ID_Producto = pc.ID_Producto
        ${whereClause}
        GROUP BY pc.PCO_Nombre_Comercial
        ORDER BY cantidad ASC
      `, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT TOP 5
          CONCAT(p.PER_Nombre, ' ', p.PER_Apellido) as nombre,
          COUNT(v.ID_Venta) as visitas
        FROM Clientes c
        INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
        INNER JOIN Ventas v ON c.ID_Cliente = v.ID_Cliente
        ${whereClause}
        GROUP BY p.PER_Nombre, p.PER_Apellido
        ORDER BY visitas DESC
      `, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT TOP 5
          CONCAT(p.PER_Nombre, ' ', p.PER_Apellido) as nombre,
          SUM(v.VEN_Total_Venta) as total
        FROM Clientes c
        INNER JOIN Personas p ON c.ID_Persona = p.ID_Persona
        INNER JOIN Ventas v ON c.ID_Cliente = v.ID_Cliente
        ${whereClause}
        GROUP BY p.PER_Nombre, p.PER_Apellido
        ORDER BY total DESC
      `, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT 
          DATEPART(HOUR, VEN_Fecha_Hora) as hora,
          COUNT(*) as ventas
        FROM Ventas
        ${whereClauseSimple}
        GROUP BY DATEPART(HOUR, VEN_Fecha_Hora)
        ORDER BY ventas DESC
      `, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT 
          DATENAME(WEEKDAY, VEN_Fecha_Hora) as dia,
          COUNT(*) as ventas
        FROM Ventas
        ${whereClauseSimple}
        GROUP BY DATENAME(WEEKDAY, VEN_Fecha_Hora)
        ORDER BY ventas DESC
      `, { type: QueryTypes.SELECT }),

      sequelize.query(`
        SELECT 
          COUNT(*) as totalVentas,
          ISNULL(SUM(VEN_Total_Venta), 0) as ventasTotales,
          ISNULL(AVG(VEN_Total_Venta), 0) as ticketPromedio,
          COUNT(DISTINCT ID_Cliente) as nuevosClientes
        FROM Ventas
        ${whereClauseSimple}
      `, { type: QueryTypes.SELECT })
    ]);

    const resumen = resumenData[0];

    res.json({
      timestamp: new Date(),
      periodo,
      ventasTotales: resumen.ventasTotales,
      totalVentas: resumen.totalVentas,
      ticketPromedio: resumen.ticketPromedio,
      nuevosClientes: resumen.nuevosClientes,
      rankings: {
        topEmpleados: topEmpleados.map((e, i) => ({
          ranking: i + 1,
          nombre: e.nombre,
          ventas: parseInt(e.ventas),
          total: formatCurrency(e.total)
        })),
        productosMasVendidos: productosMasVendidos.map((p, i) => ({
          ranking: i + 1,
          nombre: p.nombre,
          cantidad: parseInt(p.cantidad)
        })),
        productosMenosVendidos: productosMenosVendidos.map((p, i) => ({
          ranking: i + 1,
          nombre: p.nombre,
          cantidad: parseInt(p.cantidad)
        })),
        clientesFrecuentes: clientesFrecuentes.map((c, i) => ({
          ranking: i + 1,
          nombre: c.nombre,
          visitas: parseInt(c.visitas)
        })),
        clientesVIP: clientesVIP.map((c, i) => ({
          ranking: i + 1,
          nombre: c.nombre,
          total: formatCurrency(c.total)
        }))
      },
      analisis: {
        horaPico: ventasPorHora[0] ? `${ventasPorHora[0].hora}:00` : 'N/A',
        diaMasVentas: ventasPorDia[0] ? ventasPorDia[0].dia : 'N/A'
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener dashboard avanzado:', error);
    res.status(500).json({ error: 'Error al obtener dashboard avanzado' });
  }
};

module.exports = exports;
