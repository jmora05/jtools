const {sequelize} = require('../config/jtools_db');

const CategoriaProductos = require('./categoriaProductos');
const Clientes = require('./clientes');
const Compras = require('./compras');
const DetalleCompraInsumo = require('./detalleCompraInsumo');
const DetalleOrden = require('./detalleOrden');
const DetallePedidos = require('./detallePedidos');
const DetalleVentas = require('./detalleVentas');
const Empleados = require('./empleados');
const FichaTecnica = require('./fichaTecnica');
const InsumoProducto = require('./insumoProducto');
const Insumos = require('./insumos');
const Novedades = require('./novedades');
const OrdenesProduccion = require('./ordenesProduccion');
const Pedidos = require('./pedidos');
const Permisos = require('./permisos');
const Productos = require('./productos');
const Proveedores = require('./proveedores');
const Roles = require('./roles');
const RolPermiso = require('./rolPermiso');
const Usuarios = require('./usuarios');
const Ventas = require('./ventas');


// ================= RELACIONES =================

// Compras
Compras.belongsTo(Proveedores, {
    foreignKey: 'proveedoresId'
});


// DetalleCompraInsumo
DetalleCompraInsumo.belongsTo(Compras, {
    foreignKey: 'comprasId'
});

DetalleCompraInsumo.belongsTo(Insumos, {
    foreignKey: 'insumosId'
});


// DetalleOrden
DetalleOrden.belongsTo(OrdenesProduccion, {
    foreignKey: 'ordenProduccionId',
    as: 'ordenProduccion'
});

DetalleOrden.belongsTo(Productos, {
    foreignKey: 'productosId',
    as: 'producto'
});


// DetallePedidos
DetallePedidos.belongsTo(Pedidos, {
    foreignKey: 'pedidosId'
});

DetallePedidos.belongsTo(Productos, {
    foreignKey: 'productosId'
});


// DetalleVentas
DetalleVentas.belongsTo(Ventas, {
    foreignKey: 'ventasId'
});

DetalleVentas.belongsTo(Productos, {
    foreignKey: 'productosId'
});


// FichaTecnica
FichaTecnica.belongsTo(Productos, {
    foreignKey: 'productoId',
    as: 'producto'
});

Productos.hasMany(FichaTecnica, {
    foreignKey: 'productoId',
    as: 'fichasTecnicas'
});


// InsumoProducto
InsumoProducto.belongsTo(Insumos, {
    foreignKey: 'insumosId'
});

InsumoProducto.belongsTo(Productos, {
    foreignKey: 'productosId'
});


// Novedades
Novedades.belongsTo(Empleados, {
    foreignKey: 'registrado_por'
});

Novedades.belongsTo(Empleados, {
    foreignKey: 'empleado_responsable'
});


// OrdenesProduccion
OrdenesProduccion.belongsTo(Productos, {
    foreignKey: 'productoId',
    as: 'producto'
});

OrdenesProduccion.belongsTo(Empleados, {
    foreignKey: 'responsableId',
    as: 'responsable'
});

OrdenesProduccion.belongsTo(Pedidos, {
    foreignKey: 'pedidoId',
    as: 'pedido'
});


// Pedidos
Pedidos.belongsTo(Clientes, {
    foreignKey: 'clienteId',
    as: 'cliente'
});


// Productos
// Productos
Productos.belongsTo(CategoriaProductos, {
    foreignKey: 'categoriaProductoId',
    as: 'categoria'
});

CategoriaProductos.hasMany(Productos, {
    foreignKey: 'categoriaProductoId',
    as: 'productos'
});


// Roles y Permisos
RolPermiso.belongsTo(Roles, {
    foreignKey: 'rolesId'
});

RolPermiso.belongsTo(Permisos, {
    foreignKey: 'permisosId'
});


// Ventas
Ventas.belongsTo(Clientes, {
    foreignKey: 'clientesId'
});

// ================= EXPORTACIÓN =================

module.exports = {
    CategoriaProductos,
    Clientes,
    Compras,
    DetalleCompraInsumo,
    DetalleOrden,
    DetallePedidos,
    DetalleVentas,
    Empleados,
    FichaTecnica,
    InsumoProducto,
    Insumos,
    Novedades,
    OrdenesProduccion,
    Pedidos,
    Permisos,
    Productos,
    Proveedores,
    Roles,
    RolPermiso,
    Usuarios,
    Ventas
};
// Compras
Compras.belongsTo(Proveedores, { foreignKey: 'proveedoresId', as: 'proveedor' });
Proveedores.hasMany(Compras, { foreignKey: 'proveedoresId', as: 'compras' });

// DetalleCompraInsumo
DetalleCompraInsumo.belongsTo(Compras, { foreignKey: 'comprasId', as: 'compra' });
Compras.hasMany(DetalleCompraInsumo, { foreignKey: 'comprasId', as: 'detalles' });
DetalleCompraInsumo.belongsTo(Insumos, { foreignKey: 'insumosId', as: 'insumo' });
Insumos.hasMany(DetalleCompraInsumo, { foreignKey: 'insumosId', as: 'detalles' });