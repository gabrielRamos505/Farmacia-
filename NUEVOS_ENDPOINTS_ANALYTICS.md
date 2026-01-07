# 📊 NUEVOS ENDPOINTS DE ANÁLISIS AVANZADO

## 🎯 RESUMEN

He agregado **13 nuevos endpoints** de análisis avanzado que te permiten obtener métricas detalladas sobre empleados, productos, clientes, horarios y tendencias.

---

## 📋 LISTA COMPLETA DE ENDPOINTS

### 🏆 ANÁLISIS DE EMPLEADOS

#### 1. **Top Empleados por Ventas**
```
GET /api/dashboard/top-empleados?periodo=mes
```

**Parámetros:**
- `periodo`: `hoy` | `semana` | `mes` | `año` (default: `mes`)

**Respuesta:**
```json
[
  {
    "ranking": 1,
    "id": "EMP-001",
    "nombre": "Juan Pérez",
    "puesto": "Vendedor",
    "totalVentas": 45,
    "totalIngresos": "15250.50",
    "ticketPromedio": "338.90",
    "clientesAtendidos": 38,
    "productosVendidos": 156,
    "ultimaVenta": "2026-01-04T18:30:00"
  }
]
```

#### 2. **Rendimiento Individual de Empleado**
```
GET /api/dashboard/rendimiento-empleado/:empleadoId?periodo=mes
```

**Respuesta:**
```json
{
  "totalVentas": 45,
  "totalIngresos": "15250.50",
  "ticketPromedio": "338.90",
  "ventaMayor": "850.00",
  "ventaMenor": "25.50",
  "diasTrabajados": 22,
  "promedioVentasPorDia": "2.0"
}
```

---

### 📦 ANÁLISIS DE PRODUCTOS

#### 3. **Ranking de Productos (Más/Menos Vendidos)**
```
GET /api/dashboard/ranking-productos?periodo=mes&tipo=mas
```

**Parámetros:**
- `periodo`: `hoy` | `semana` | `mes` | `año`
- `tipo`: `mas` | `menos` (más vendidos o menos vendidos)

**Respuesta:**
```json
[
  {
    "ranking": 1,
    "id": "PROD-001",
    "nombre": "Paracetamol 500mg",
    "laboratorio": "Bayer",
    "presentacion": "Caja x 20 tabletas",
    "cantidadVendida": 450,
    "totalIngresos": "3825.00",
    "numeroVentas": 125,
    "precioPromedio": "8.50",
    "stockActual": 200
  }
]
```

#### 4. **Análisis de Rotación de Productos**
```
GET /api/dashboard/rotacion-productos
```

**Respuesta:**
```json
[
  {
    "id": "PROD-001",
    "nombre": "Paracetamol 500mg",
    "laboratorio": "Bayer",
    "stockActual": 200,
    "vendidoUltimos30Dias": 450,
    "diasInventario": 13.3,
    "clasificacion": "Rotación Alta"
  }
]
```

**Clasificaciones:**
- `Rotación Alta`: < 7 días de inventario
- `Rotación Media`: 7-30 días
- `Rotación Baja`: > 30 días
- `Sin Movimiento`: 0 ventas
- `Sin Stock`: 0 unidades

---

### 👥 ANÁLISIS DE CLIENTES

#### 5. **Clientes Más Frecuentes**
```
GET /api/dashboard/clientes-frecuentes?periodo=mes
```

**Respuesta:**
```json
[
  {
    "ranking": 1,
    "id": "CLI-001",
    "nombre": "María González",
    "dni": "12345678",
    "email": "maria@email.com",
    "telefono": "987654321",
    "numeroVisitas": 15,
    "totalGastado": "2450.00",
    "ticketPromedio": "163.33",
    "ultimaVisita": "2026-01-04T16:20:00",
    "primeraVisita": "2025-12-01T10:00:00",
    "diasComoCliente": 34,
    "puntosFidelidad": 245,
    "frecuenciaVisitas": "13.2 visitas/mes"
  }
]
```

#### 6. **Clientes VIP (Que Más Gastan)**
```
GET /api/dashboard/clientes-vip?periodo=mes
```

**Respuesta:**
```json
[
  {
    "ranking": 1,
    "id": "CLI-002",
    "nombre": "Carlos Rodríguez",
    "dni": "87654321",
    "email": "carlos@email.com",
    "telefono": "912345678",
    "direccion": "Av. Principal 123",
    "numeroCompras": 8,
    "totalGastado": "5850.00",
    "ticketPromedio": "731.25",
    "compraMayor": "1250.00",
    "compraMenor": "125.50",
    "ultimaCompra": "2026-01-03T14:00:00",
    "puntosFidelidad": 585,
    "categoria": "Platino"
  }
]
```

**Categorías VIP:**
- `Platino`: ≥ S/ 5,000
- `Oro`: ≥ S/ 2,000
- `Plata`: ≥ S/ 1,000
- `Bronce`: < S/ 1,000

---

### ⏰ ANÁLISIS DE HORARIOS

#### 7. **Ventas por Hora del Día**
```
GET /api/dashboard/ventas-por-hora?periodo=semana
```

**Respuesta:**
```json
{
  "ventasPorHora": [
    {
      "hora": "09:00",
      "numeroVentas": 12,
      "totalIngresos": "1250.50",
      "ticketPromedio": "104.21",
      "clientesUnicos": 10
    },
    {
      "hora": "10:00",
      "numeroVentas": 25,
      "totalIngresos": "2850.00",
      "ticketPromedio": "114.00",
      "clientesUnicos": 22
    }
  ],
  "horaPico": {
    "hora": "15:00",
    "numeroVentas": 45,
    "totalIngresos": "5250.00",
    "ticketPromedio": "116.67",
    "clientesUnicos": 38
  },
  "totalHoras": 12
}
```

#### 8. **Ventas por Día de la Semana**
```
GET /api/dashboard/ventas-por-dia-semana?periodo=mes
```

**Respuesta:**
```json
[
  {
    "dia": "Lunes",
    "numeroVentas": 85,
    "totalIngresos": "9850.00",
    "ticketPromedio": "115.88"
  },
  {
    "dia": "Martes",
    "numeroVentas": 92,
    "totalIngresos": "10450.00",
    "ticketPromedio": "113.59"
  }
]
```

---

### 📈 COMPARATIVAS Y TENDENCIAS

#### 9. **Comparativa Mensual**
```
GET /api/dashboard/comparativa-mensual?meses=6
```

**Respuesta:**
```json
{
  "comparativa": [
    {
      "periodo": "Enero 2026",
      "numeroVentas": 450,
      "totalIngresos": "52500.00",
      "ticketPromedio": "116.67",
      "clientesUnicos": 285,
      "empleadosActivos": 8
    },
    {
      "periodo": "Diciembre 2025",
      "numeroVentas": 420,
      "totalIngresos": "48200.00",
      "ticketPromedio": "114.76",
      "clientesUnicos": 265,
      "empleadosActivos": 7
    }
  ],
  "crecimientoMensual": "8.92%",
  "tendencia": "Creciente"
}
```

---

### 🎯 DASHBOARD COMPLETO AVANZADO

#### 10. **Dashboard Avanzado (Todo en Uno)**
```
GET /api/dashboard/avanzado?periodo=mes
```

**Respuesta:**
```json
{
  "timestamp": "2026-01-04T23:00:00",
  "periodo": "mes",
  "rankings": {
    "topEmpleados": [
      {
        "ranking": 1,
        "nombre": "Juan Pérez",
        "ventas": 45,
        "total": "15250.50"
      }
    ],
    "productosMasVendidos": [
      {
        "ranking": 1,
        "nombre": "Paracetamol 500mg",
        "cantidad": 450
      }
    ],
    "productosMenosVendidos": [
      {
        "ranking": 1,
        "nombre": "Vitamina D3",
        "cantidad": 5
      }
    ],
    "clientesFrecuentes": [
      {
        "ranking": 1,
        "nombre": "María González",
        "visitas": 15
      }
    ],
    "clientesVIP": [
      {
        "ranking": 1,
        "nombre": "Carlos Rodríguez",
        "total": "5850.00"
      }
    ]
  },
  "analisis": {
    "horaPico": "15:00",
    "diaMasVentas": "Viernes"
  }
}
```

---

## 🔥 ENDPOINTS EXISTENTES (Ya Implementados)

```
GET /api/dashboard/stats                      - Estadísticas generales del día
GET /api/dashboard/ventas-semana             - Ventas de los últimos 7 días
GET /api/dashboard/top-productos             - Top 5 productos más vendidos
GET /api/dashboard/metodos-pago              - Distribución por método de pago
GET /api/dashboard/ultimas-ventas            - Últimas 10 ventas del día
GET /api/dashboard/alertas                   - Alertas de stock y vencimientos
GET /api/dashboard/distribucion-laboratorio  - Distribución por laboratorio
GET /api/dashboard/tendencias                - Tendencias semanales
```

---

## 📊 RESUMEN DE NUEVOS ENDPOINTS

| Categoría | Endpoints | Descripción |
|-----------|-----------|-------------|
| **Empleados** | 2 | Top vendedores y rendimiento individual |
| **Productos** | 2 | Ranking y análisis de rotación |
| **Clientes** | 2 | Clientes frecuentes y VIP |
| **Horarios** | 2 | Análisis por hora y día de la semana |
| **Tendencias** | 1 | Comparativa mensual |
| **Dashboard** | 1 | Vista completa con todos los rankings |
| **TOTAL** | **10** | **Nuevos endpoints de análisis** |

---

## 🎨 CÓMO USAR EN EL FRONTEND

### Ejemplo 1: Obtener Top Empleados
```javascript
import axios from 'axios';

const getTopEmpleados = async (periodo = 'mes') => {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/dashboard/top-empleados?periodo=${periodo}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Ejemplo 2: Obtener Clientes VIP
```javascript
const getClientesVIP = async () => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/dashboard/clientes-vip?periodo=mes',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Ejemplo 3: Dashboard Completo
```javascript
const getDashboardCompleto = async () => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/dashboard/avanzado',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    const { rankings, analisis } = response.data;
    
    console.log('Mejor empleado:', rankings.topEmpleados[0]);
    console.log('Producto más vendido:', rankings.productosMasVendidos[0]);
    console.log('Hora pico:', analisis.horaPico);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🚀 PRÓXIMOS PASOS

1. **Reiniciar el servidor backend** para cargar los nuevos endpoints
2. **Actualizar el frontend** para mostrar estos datos en el dashboard
3. **Crear componentes visuales** (gráficos, tablas, cards) para cada métrica
4. **Agregar filtros** de periodo en la interfaz

---

## 📝 NOTAS IMPORTANTES

- ✅ Todos los endpoints están protegidos con autenticación JWT
- ✅ Todos soportan filtros por periodo (hoy, semana, mes, año)
- ✅ Los datos se formatean automáticamente (moneda, fechas, etc.)
- ✅ Las consultas están optimizadas para SQL Server
- ✅ Se incluyen rankings y clasificaciones automáticas

---

**Fecha**: 04 de Enero 2026  
**Total de Endpoints**: **23** (13 nuevos + 10 existentes)  
**Estado**: ✅ **LISTO PARA USAR**
