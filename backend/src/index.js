require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { sequelize, testConnection } = require("./config/jtools_db.js");
const db = require("./models/index.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const usuarios                     = require('./routes/usuariosRoutes.js');
const permisos                     = require('./routes/permisosRoutes.js');
const roles                        = require('./routes/rolesRoutes.js');
const authRoutes                   = require('./routes/authRoutes.js');
const {verifyToken}               = require('./middleware/authMiddleware.js');

// ================= REGISTRO DE RUTAS =================
// ── Rutas PÚBLICAS (no requieren token) ──
app.use('/api/auth', authRoutes);

// ── Rutas PROTEGIDAS (requieren token) ──
app.use('/api/empleados',               verifyToken, empleadosRoutes);
app.use('/api/ordenes-produccion',      verifyToken, ordenesProduccionRoutes);
app.use('/api/ventas',                  verifyToken, ventasRoutes);
app.use('/api/proveedores',             verifyToken, proveedoresRoutes);
app.use('/api/productos',               verifyToken, productosRoutes);
app.use('/api/pedidos',                 verifyToken, pedidosRoutes);
app.use('/api/novedades',               verifyToken, novedadesRoutes);
app.use('/api/insumos',                 verifyToken, insumosRoutes);
app.use('/api/insumo-producto',         verifyToken, insumoProductoRoutes);
app.use('/api/detalle-ventas',          verifyToken, detalleVentasRoutes);
app.use('/api/detalle-pedidos',         verifyToken, detallePedidosRoutes);
app.use('/api/detalle-orden',           verifyToken, detalleOrdenRoutes);
app.use('/api/detalle-compra-insumo',   verifyToken, detalleCompraInsumoRoutes);
app.use('/api/compras',                 verifyToken, comprasRoutes);
app.use('/api/clientes',                verifyToken, clientesRoutes);
app.use('/api/categorias',              verifyToken, categoriaProductosRoutes);
app.use('/api/usuarios',                verifyToken, usuarios);
app.use('/api/permisos',                verifyToken, permisos);
app.use('/api/roles',                   verifyToken, roles);

// ================= SINCRONIZAR BASE DE DATOS =================
sequelize.sync().then(() => {
    console.log("Tablas sincronizadas correctamente");
}).catch(err => {
    console.error("Error al sincronizar tablas:", err.message);
});

// ================= INICIAR SERVIDOR =================
app.listen(5000, () => {
    console.log("Servidor corriendo en http://localhost:5000");
});