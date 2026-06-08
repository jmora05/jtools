const { DetalleVentas, Ventas, Productos, Clientes } = require('../models/index.js');

// Resuelve el clientesId del usuario autenticado; null si no es cliente o no existe registro
const _resolveClienteId = async (req) => {
    if (req.usuario?.userType !== 'client') return null;
    const cliente = await Clientes.findOne({ where: { email: req.usuario.email } });
    return cliente ? cliente.id : undefined;
};

// GET - listar detalles por venta (clientes solo pueden ver sus propias ventas)
const getDetallesByVenta = async (req, res) => {
    try {
        const { ventasId } = req.params;

        const venta = await Ventas.findByPk(ventasId);
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        if (req.usuario?.userType === 'client') {
            const clienteId = await _resolveClienteId(req);
            if (clienteId === undefined || venta.clientesId !== clienteId) {
                return res.status(403).json({ message: 'Acceso denegado' });
            }
        }

        const detalles = await DetalleVentas.findAll({
            where: { ventasId },
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }
            ]
        });

        res.status(200).json(detalles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los detalles de la venta', error: error.message });
    }
};

// GET - obtener detalle por ID (clientes solo pueden ver los de sus propias ventas)
const getDetalleVentaById = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await DetalleVentas.findByPk(id, {
            include: [
                { model: Ventas, as: 'venta', attributes: ['id', 'clientesId', 'fecha', 'metodoPago', 'total'] },
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }
            ]
        });

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de venta no encontrado' });
        }

        if (req.usuario?.userType === 'client') {
            const clienteId = await _resolveClienteId(req);
            if (clienteId === undefined || detalle.venta?.clientesId !== clienteId) {
                return res.status(403).json({ message: 'Acceso denegado' });
            }
        }

        res.status(200).json(detalle);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el detalle de venta', error: error.message });
    }
};

// POST - agregar detalle a una venta
const createDetalleVenta = async (req, res) => {
    if (req.usuario?.userType === 'client') {
        return res.status(403).json({ message: 'Acceso denegado: se requiere perfil administrador' });
    }
    try {
        const { ventasId, productosId, cantidad, precioUnitario } = req.body;

        // verificar que la venta existe
        const venta = await Ventas.findByPk(ventasId);
        if (!venta) {
            return res.status(404).json({ message: 'La venta especificada no existe' });
        }

        // verificar que el producto existe y está activo
        const producto = await Productos.findByPk(productosId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }
        if (producto.estado === 'inactivo') {
            return res.status(400).json({ message: 'El producto está inactivo' });
        }

        // verificar que hay stock suficiente
        if (producto.stock < cantidad) {
            return res.status(400).json({ message: `Stock insuficiente. Stock disponible: ${producto.stock}` });
        }

        // calcular total del detalle automáticamente
        const total = cantidad * precioUnitario;

        const detalle = await DetalleVentas.create({
            ventasId,
            productosId,
            cantidad,
            precioUnitario,
            total
        });

        // descontar stock del producto
        await producto.update({ stock: producto.stock - cantidad });

        // actualizar total de la venta
        const todosLosDetalles = await DetalleVentas.findAll({ where: { ventasId } });
        const nuevoTotal = todosLosDetalles.reduce((sum, d) => sum + parseFloat(d.total), 0);
        await venta.update({ total: nuevoTotal });

        res.status(201).json({ message: 'Detalle de venta agregado correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al agregar el detalle de venta', error: error.message });
    }
};

// PUT - actualizar detalle de venta
const updateDetalleVenta = async (req, res) => {
    if (req.usuario?.userType === 'client') {
        return res.status(403).json({ message: 'Acceso denegado: se requiere perfil administrador' });
    }
    try {
        const { id } = req.params;
        const detalle = await DetalleVentas.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de venta no encontrado' });
        }

        const { cantidad, precioUnitario } = req.body;

        // verificar stock si se actualiza la cantidad
        if (cantidad) {
            const producto = await Productos.findByPk(detalle.productosId);
            const diferencia = cantidad - detalle.cantidad;

            if (diferencia > 0 && producto.stock < diferencia) {
                return res.status(400).json({ message: `Stock insuficiente. Stock disponible: ${producto.stock}` });
            }

            // ajustar stock según diferencia
            await producto.update({ stock: producto.stock - diferencia });
        }

        const nuevoTotal = (cantidad || detalle.cantidad) * (precioUnitario || detalle.precioUnitario);
        await detalle.update({ cantidad, precioUnitario, total: nuevoTotal });

        // recalcular total de la venta
        const venta = await Ventas.findByPk(detalle.ventasId);
        const todosLosDetalles = await DetalleVentas.findAll({ where: { ventasId: detalle.ventasId } });
        const nuevoTotalVenta = todosLosDetalles.reduce((sum, d) => sum + parseFloat(d.total), 0);
        await venta.update({ total: nuevoTotalVenta });

        res.status(200).json({ message: 'Detalle de venta actualizado correctamente', detalle });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el detalle de venta', error: error.message });
    }
};

// DELETE - eliminar detalle de venta y restaurar stock
const deleteDetalleVenta = async (req, res) => {
    if (req.usuario?.userType === 'client') {
        return res.status(403).json({ message: 'Acceso denegado: se requiere perfil administrador' });
    }
    try {
        const { id } = req.params;
        const detalle = await DetalleVentas.findByPk(id);

        if (!detalle) {
            return res.status(404).json({ message: 'Detalle de venta no encontrado' });
        }

        // restaurar stock del producto
        const producto = await Productos.findByPk(detalle.productosId);
        if (producto) {
            await producto.update({ stock: producto.stock + detalle.cantidad });
        }

        const ventasId = detalle.ventasId;
        await detalle.destroy();

        // recalcular total de la venta
        const venta = await Ventas.findByPk(ventasId);
        const todosLosDetalles = await DetalleVentas.findAll({ where: { ventasId } });
        const nuevoTotal = todosLosDetalles.reduce((sum, d) => sum + parseFloat(d.total), 0);
        await venta.update({ total: nuevoTotal });

        res.status(200).json({ message: 'Detalle de venta eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el detalle de venta', error: error.message });
    }
};

module.exports = {
    getDetallesByVenta,
    getDetalleVentaById,
    createDetalleVenta,
    updateDetalleVenta,
    deleteDetalleVenta
};