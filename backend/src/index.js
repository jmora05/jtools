require('dotenv').config();

const express = require("express");
const cors    = require("cors");
const { sequelize, testConnection } = require("./config/jtools_db.js");
const db = require("./models/index.js");

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================= RUTAS =================
const empleadosRoutes              = require('./routes/empleadosRoutes.js');
const ordenesProduccionRoutes      = require('./routes/ordenesProduccionRoutes.js');
const ventasRoutes                 = require('./routes/ventasRoutes.js');
const proveedoresRoutes            = require('./routes/proveedoresRoutes.js');
const productosRoutes              = require('./routes/productosRoutes.js');
const novedadesRoutes              = require('./routes/novedadesRoutes.js');
const insumosRoutes                = require('./routes/insumosRoutes.js');
const insumoProductoRoutes         = require('./routes/insumoProductoRoutes.js');
const detalleVentasRoutes          = require('./routes/detalleVentasRoutes.js');
const detalleOrdenRoutes           = require('./routes/detalleOrdenRoutes.js');
const detalleCompraInsumoRoutes    = require('./routes/detalleCompraInsumoRoutes.js');
const comprasRoutes                = require('./routes/comprasRoutes.js');
const clientesRoutes               = require('./routes/clientesRoutes.js');
const clienteMeRoutes              = require('./routes/clienteMeRoutes.js');
const categoriaProductosRoutes     = require('./routes/categoriaProductosRoutes.js');
const usuariosRoutes               = require('./routes/usuariosRoutes.js');
const permisosRoutes               = require('./routes/permisosRoutes.js');
const rolesRoutes                  = require('./routes/rolesRoutes.js');
const authRoutes                   = require('./routes/authRoutes.js');
const dashboardRoutes              = require('./routes/dashboardRoutes.js');
const fichaTecnicaRoutes           = require('./routes/fichaTecnicaRoutes.js');
const horasExtraRoutes             = require('./routes/horasExtraRoutes.js');
const nominaRoutes                 = require('./routes/nominaRoutes.js');
const { verifyToken, requireAdmin } = require('./middleware/authMiddleware.js');

// ================= REGISTRO DE RUTAS =================
// ── Rutas PÚBLICAS ──
app.use('/api/auth',      authRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);

// ── Rutas públicas (para el landing, sin autenticación) ──
const { getProductos: getPublicProductos } = require('./controllers/productosController');
const { getCategorias: getPublicCategorias } = require('./controllers/categoriaProductosController');
app.get('/api/public/productos', getPublicProductos);
app.get('/api/public/categorias', getPublicCategorias);

// ── Rutas PROTEGIDAS (cualquier usuario autenticado) ──
app.use('/api/productos',               verifyToken, productosRoutes);
app.use('/api/ventas',                  verifyToken, ventasRoutes);
app.use('/api/categorias',              verifyToken, categoriaProductosRoutes);
app.use('/api/cliente',                 verifyToken, clienteMeRoutes);
// Permite a cualquier usuario autenticado ver los permisos de su propio rol
app.use('/api/roles/:id/permisos', verifyToken, (req, res, next) => {
    const rolesController = require('./controllers/rolesController.js');
    return rolesController.getRolPermisos(req, res);
});
// ── Rutas SOLO ADMIN (bloquean el perfil 'client') ──
app.use('/api/usuarios',                verifyToken, requireAdmin, usuariosRoutes);
app.use('/api/roles',                   verifyToken, requireAdmin, rolesRoutes);
app.use('/api/permisos',                verifyToken, requireAdmin, permisosRoutes);
app.use('/api/clientes',                verifyToken, requireAdmin, clientesRoutes);
app.use('/api/proveedores',             verifyToken, requireAdmin, proveedoresRoutes);
app.use('/api/insumos',                 verifyToken, requireAdmin, insumosRoutes);
app.use('/api/compras',                 verifyToken, requireAdmin, comprasRoutes);
app.use('/api/empleados',               verifyToken, requireAdmin, empleadosRoutes);
app.use('/api/ordenes-produccion',      verifyToken, requireAdmin, ordenesProduccionRoutes);
app.use('/api/fichas-tecnicas',         verifyToken, requireAdmin, fichaTecnicaRoutes);
app.use('/api/novedades',               verifyToken, novedadesRoutes);
app.use('/api/insumo-producto',         verifyToken, requireAdmin, insumoProductoRoutes);
app.use('/api/detalle-ventas',          verifyToken, detalleVentasRoutes);
app.use('/api/detalle-orden',           verifyToken, requireAdmin, detalleOrdenRoutes);
app.use('/api/detalle-compra-insumo',   verifyToken, requireAdmin, detalleCompraInsumoRoutes);
app.use('/api/horas-extra',             verifyToken, requireAdmin, horasExtraRoutes);
app.use('/api/nomina',                  verifyToken, requireAdmin, nominaRoutes);

// ================= CONEXIÓN + SINCRONIZACIÓN =================
testConnection()
.then(() => {
    return sequelize.sync();
})
.then(async () => {
    // Migración idempotente: una query por columna para evitar fallo en bloque.
    // Cubre columnas añadidas al modelo DESPUÉS de que las tablas fueron creadas.
    const migraciones = [
        `ALTER TABLE roles     ADD COLUMN IF NOT EXISTS "isSystem"  BOOLEAN     NOT NULL DEFAULT false`,
        `ALTER TABLE roles     ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN     NOT NULL DEFAULT true`,
        `ALTER TABLE permisos  ADD COLUMN IF NOT EXISTS "isSystem"  BOOLEAN     NOT NULL DEFAULT false`,
        `ALTER TABLE permisos  ADD COLUMN IF NOT EXISTS "moduleKey" VARCHAR(50)          DEFAULT NULL`,
        `ALTER TABLE permisos  ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN     NOT NULL DEFAULT true`,
        `ALTER TABLE usuarios  ADD COLUMN IF NOT EXISTS "estado"    VARCHAR(10) NOT NULL DEFAULT 'activo'`,
        // Estado 'anulada' en novedades
        `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'anulada' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_novedades_estado')) THEN ALTER TYPE "enum_novedades_estado" ADD VALUE 'anulada'; END IF; END $$`,
        // Campo estado en ventas para soportar anulación
        `ALTER TABLE ventas ADD COLUMN IF NOT EXISTS "estado" VARCHAR(15) NOT NULL DEFAULT 'activa'`,
        // Reducir longitud de nombreInsumo a 30 caracteres
        `ALTER TABLE insumos ALTER COLUMN "nombreInsumo" TYPE VARCHAR(30)`,
        // Ampliar teléfono de proveedores a 15 dígitos
        `ALTER TABLE proveedores ALTER COLUMN "telefono" TYPE VARCHAR(15)`,
    ];
    for (const sql of migraciones) {
        try {
            await sequelize.query(sql);
        } catch (err) {
            console.warn('[migración]', err.message);
        }
    }
    console.log('Tablas sincronizadas y migradas correctamente');
    app.listen(process.env.PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
    });
})
.catch(err => {
    console.error('Error al iniciar:', err.message);
});
