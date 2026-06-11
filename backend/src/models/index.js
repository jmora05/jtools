const { sequelize } = require('../config/jtools_db');

const Auditoria             = require('./auditoria');
const CategoriaProductos    = require('./categoriaProductos');
const Clientes              = require('./clientes');
const Compras               = require('./compras');
const DetalleCompraInsumo   = require('./detalleCompraInsumo');
const DetalleOrden          = require('./detalleOrden');
const DetalleVentas         = require('./detalleVentas');
const Empleados             = require('./empleados');
const FichaTecnica          = require('./fichaTecnica');
const InsumoProducto        = require('./insumoProducto');
const InsumoProveedores     = require('./insumoProveedores');
const Insumos               = require('./insumos');
const HorasExtra            = require('./horasExtra');
const Novedades             = require('./novedades');
const Nomina                 = require('./nomina');
const OrdenesProduccion     = require('./ordenesProduccion');
const PasswordResetOtp      = require('./passwordResetOtp');
const Permisos              = require('./permisos');
const Productos             = require('./productos');
const Proveedores           = require('./proveedores');
const Roles                 = require('./roles');
const RolPermiso            = require('./rolPermiso');
const Usuarios              = require('./usuarios');
const Ventas                = require('./ventas');


// ================= RELACIONES =================

// Compras
Compras.belongsTo(Proveedores, { foreignKey: 'proveedoresId', as: 'proveedor' });
Proveedores.hasMany(Compras,   { foreignKey: 'proveedoresId', as: 'compras' });


// DetalleCompraInsumo
DetalleCompraInsumo.belongsTo(Compras, { foreignKey: 'comprasId', as: 'compra' });
Compras.hasMany(DetalleCompraInsumo,   { foreignKey: 'comprasId', as: 'detalles' });

DetalleCompraInsumo.belongsTo(Insumos, { foreignKey: 'insumosId', as: 'insumo' });
Insumos.hasMany(DetalleCompraInsumo,   { foreignKey: 'insumosId', as: 'detallesCompra' });


// DetalleOrden
DetalleOrden.belongsTo(OrdenesProduccion, { foreignKey: 'ordenProduccionId', as: 'ordenProduccion' });
DetalleOrden.belongsTo(Productos,         { foreignKey: 'productosId',       as: 'producto' });





// DetalleVentas
DetalleVentas.belongsTo(Ventas,    { foreignKey: 'ventasId' });
DetalleVentas.belongsTo(Productos, { foreignKey: 'productosId' });


// FichaTecnica
FichaTecnica.belongsTo(Productos, { foreignKey: 'productoId', as: 'producto' });
Productos.hasMany(FichaTecnica,   { foreignKey: 'productoId', as: 'fichasTecnicas' });


// InsumoProducto
InsumoProducto.belongsTo(Insumos,   { foreignKey: 'insumosId' });
InsumoProducto.belongsTo(Productos, { foreignKey: 'productosId' });


// Proveedores ↔ Insumos (FK legada — un solo proveedor principal)
Proveedores.hasMany(Insumos, { foreignKey: 'proveedoresId', as: 'insumos',    constraints: false });
Insumos.belongsTo(Proveedores, { foreignKey: 'proveedoresId', as: 'proveedor', constraints: false });

// Proveedores ↔ Insumos (many-to-many — múltiples proveedores)
Insumos.belongsToMany(Proveedores, {
    through: InsumoProveedores,
    foreignKey: 'insumoId',
    otherKey:   'proveedorId',
    as: 'proveedores',
});
Proveedores.belongsToMany(Insumos, {
    through: InsumoProveedores,
    foreignKey: 'proveedorId',
    otherKey:   'insumoId',
    as: 'insumosRelacionados',
});


// HorasExtra
HorasExtra.belongsTo(Empleados, { foreignKey: 'empleadoId', as: 'empleado' });
Empleados.hasMany(HorasExtra,   { foreignKey: 'empleadoId', as: 'horasExtra' });


// Novedades
Novedades.belongsTo(Empleados, { foreignKey: 'empleado_afectado', as: 'empleadoAfectado', constraints: false });


// OrdenesProduccion
OrdenesProduccion.belongsTo(Productos, { foreignKey: 'productoId',    as: 'producto' });
OrdenesProduccion.belongsTo(Empleados, { foreignKey: 'responsableId', as: 'responsable' });




// Productos
Productos.belongsTo(CategoriaProductos, { foreignKey: 'categoriaProductoId', as: 'categoria' });
CategoriaProductos.hasMany(Productos,   { foreignKey: 'categoriaProductoId', as: 'productos' });


// Usuarios → Roles
Usuarios.belongsTo(Roles, { foreignKey: 'rolesId', as: 'rol' });
Roles.hasMany(Usuarios,   { foreignKey: 'rolesId', as: 'usuarios' });

// Roles y Permisos
RolPermiso.belongsTo(Roles,    { foreignKey: 'rolesId' });
RolPermiso.belongsTo(Permisos, { foreignKey: 'permisosId' });

Roles.belongsToMany(Permisos, { through: RolPermiso, foreignKey: 'rolesId',    otherKey: 'permisosId', as: 'permisos' });
Permisos.belongsToMany(Roles, { through: RolPermiso, foreignKey: 'permisosId', otherKey: 'rolesId',    as: 'roles' });

// Usuarios ↔ Clientes
Usuarios.hasOne(Clientes,    { foreignKey: 'email', sourceKey: 'email', as: 'cliente', constraints: false });
Clientes.belongsTo(Usuarios, { foreignKey: 'email', targetKey: 'email', as: 'usuario', constraints: false });

// Ventas
Ventas.belongsTo(Clientes,         { foreignKey: 'clientesId',  as: 'cliente' });
Clientes.hasMany(Ventas,           { foreignKey: 'clientesId',  as: 'ventas' });
Ventas.hasMany(DetalleVentas,      { foreignKey: 'ventasId',    as: 'detalles' });
DetalleVentas.belongsTo(Ventas,    { foreignKey: 'ventasId' });
DetalleVentas.belongsTo(Productos, { foreignKey: 'productosId', as: 'producto' });


// PasswordResetOtp → Usuarios
PasswordResetOtp.belongsTo(Usuarios, { foreignKey: 'usuarioId', as: 'usuario' });
Usuarios.hasMany(PasswordResetOtp,   { foreignKey: 'usuarioId', as: 'otps' });

// Auditoria → Usuarios
Auditoria.belongsTo(Usuarios, { foreignKey: 'usuarioId', as: 'usuario', constraints: false });
Usuarios.hasMany(Auditoria,   { foreignKey: 'usuarioId', as: 'auditorias', constraints: false });

//nomina
Nomina.belongsTo(Empleados, { foreignKey: 'empleado_id', as: 'empleado' });
Empleados.hasMany(Nomina, { foreignKey: 'empleado_id', as: 'nominas' });

Nomina.belongsTo(Novedades, { foreignKey: 'novedades_id', as: 'novedades' });
Novedades.hasMany(Nomina, { foreignKey: 'novedades_id', as: 'nominas' });

// ================= EXPORTACIÓN =================

module.exports = {
    Auditoria,
    CategoriaProductos,
    Clientes,
    Compras,
    DetalleCompraInsumo,
    DetalleOrden,
    DetalleVentas,
    Empleados,
    FichaTecnica,
    HorasExtra,
    InsumoProducto,
    InsumoProveedores,
    Insumos,
    Novedades,
    Nomina,
    OrdenesProduccion,
    PasswordResetOtp,
    Permisos,
    Productos,
    Proveedores,
    Roles,
    RolPermiso,
    Usuarios,
    Ventas
};