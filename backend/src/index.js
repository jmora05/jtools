const express = require("express");
const cors = require("cors");
const { sequelize, testConnection } = require("./config/jtools_db.js");
const db = require("./models/index.js");

const app = express();
app.use(express.json());
app.use(cors());

// probar conexión
testConnection();

// ================= RUTAS =================
const empleadosRoutes              = require('./routes/empleadosRoutes.js');
const ordenesProduccionRoutes      = require('./routes/ordenesProduccionRoutes.js');
const ventasRoutes                 = require('./routes/ventasRoutes.js');
const proveedoresRoutes            = require('./routes/proveedoresRoutes.js');
const productosRoutes              = require('./routes/productosRoutes.js');
const pedidosRoutes                = require('./routes/pedidosRoutes.js');
const novedadesRoutes              = require('./routes/novedadesRoutes.js');
const insumosRoutes                = require('./routes/insumosRoutes.js');
const insumoProductoRoutes         = require('./routes/insumoProductoRoutes.js');
const detalleVentasRoutes          = require('./routes/detalleVentasRoutes.js');
const detallePedidosRoutes         = require('./routes/detallePedidosRoutes.js');
const detalleOrdenRoutes           = require('./routes/detalleOrdenRoutes.js');
const detalleCompraInsumoRoutes    = require('./routes/detalleCompraInsumoRoutes.js');
const comprasRoutes                = require('./routes/comprasRoutes.js');
const clientesRoutes               = require('./routes/clientesRoutes.js');
const categoriaProductosRoutes     = require('./routes/categoriaProductosRoutes.js');

// ================= REGISTRO DE RUTAS =================
app.use('/api/empleados',               empleadosRoutes);
app.use('/api/ordenes-produccion',      ordenesProduccionRoutes);
app.use('/api/ventas',                  ventasRoutes);
app.use('/api/proveedores',             proveedoresRoutes);
app.use('/api/productos',               productosRoutes);
app.use('/api/pedidos',                 pedidosRoutes);
app.use('/api/novedades',               novedadesRoutes);
app.use('/api/insumos',                 insumosRoutes);
app.use('/api/insumo-producto',         insumoProductoRoutes);
app.use('/api/detalle-ventas',          detalleVentasRoutes);
app.use('/api/detalle-pedidos',         detallePedidosRoutes);
app.use('/api/detalle-orden',           detalleOrdenRoutes);
app.use('/api/detalle-compra-insumo',   detalleCompraInsumoRoutes);
app.use('/api/compras',                 comprasRoutes);
app.use('/api/clientes',                clientesRoutes);
app.use('/api/categorias',              categoriaProductosRoutes);

// ================= SINCRONIZAR BASE DE DATOS =================
const startServer = async () => {
    try {
      // 1. probar conexión
        await testConnection();

      // 2. sincronizar modelos (crear tablas)
        await sequelize.sync({ alter: true });

        console.log("Tablas sincronizadas correctamente");

      // 3. levantar servidor
        app.listen(3000, () => {
            console.log("Servidor corriendo en http://localhost:3000");
        });

    } catch (error) {
        console.error("Error al iniciar:", error.message);
    }
};

startServer();