const { OrdenesProduccion, Productos, Empleados, Pedidos } = require('../models/index.js');

// Genera un código único tipo OP-2025-001
const generarCodigoOrden = async () => {
    const year = new Date().getFullYear();
    const lastOrden = await OrdenesProduccion.findOne({
        where: { codigoOrden: { [require('sequelize').Op.like]: `OP-${year}-%` } },
        order: [['id', 'DESC']]
    });
    let nextNum = 1;
    if (lastOrden) {
        const parts = lastOrden.codigoOrden.split('-');
        nextNum = parseInt(parts[2]) + 1;
    }
    return `OP-${year}-${String(nextNum).padStart(3, '0')}`;
};

// GET - listar todas las órdenes de producción
const getOrdenesProduccion = async (req, res) => {
    try {
        const ordenes = await OrdenesProduccion.findAll({
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia'] },
                { model: Empleados, as: 'responsable', attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
                { model: Pedidos, as: 'pedido', attributes: ['id', 'fecha_pedido', 'total', 'ciudad'] }
            ],
            order: [['id', 'DESC']]
        });
        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las órdenes de producción', error: error.message });
    }
};

// GET - obtener orden de producción por ID
const getOrdenProduccionById = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenesProduccion.findByPk(id, {
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia'] },
                { model: Empleados, as: 'responsable', attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
                { model: Pedidos, as: 'pedido', attributes: ['id', 'fecha_pedido', 'total', 'ciudad'] }
            ]
        });

        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }

        res.status(200).json(orden);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la orden de producción', error: error.message });
    }
};

// POST - crear orden de producción
const createOrdenProduccion = async (req, res) => {
    try {
        const { productoId, cantidad, responsableId, pedidoId, fechaEntrega, nota } = req.body;

        // Verificar que el producto existe
        const producto = await Productos.findByPk(productoId);
        if (!producto) {
            return res.status(404).json({ message: 'El producto especificado no existe' });
        }

        // Verificar que el empleado existe y está activo
        const empleado = await Empleados.findByPk(responsableId);
        if (!empleado) {
            return res.status(404).json({ message: 'El empleado responsable no existe' });
        }
        if (empleado.estado === 'inactivo') {
            return res.status(400).json({ message: 'El empleado responsable está inactivo' });
        }

        // Verificar que el pedido existe si se proporcionó
        if (pedidoId) {
            const pedido = await Pedidos.findByPk(pedidoId);
            if (!pedido) {
                return res.status(404).json({ message: 'El pedido especificado no existe' });
            }
        }

        const codigoOrden = await generarCodigoOrden();

        const orden = await OrdenesProduccion.create({
            codigoOrden,
            productoId,
            cantidad,
            responsableId,
            pedidoId: pedidoId || null,
            fechaEntrega,
            nota,
            estado: 'Pendiente'
        });

        // Recargar con relaciones para devolver datos completos
        const ordenCompleta = await OrdenesProduccion.findByPk(orden.id, {
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia'] },
                { model: Empleados, as: 'responsable', attributes: ['id', 'nombres', 'apellidos', 'cargo'] }
            ]
        });

        res.status(201).json({ message: 'Orden de producción creada correctamente', orden: ordenCompleta });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la orden de producción', error: error.message });
    }
};

// PUT - actualizar orden de producción (responsable, fechaEntrega, nota, estado)
const updateOrdenProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenesProduccion.findByPk(id);

        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }

        if (orden.estado === 'Anulada') {
            return res.status(400).json({ message: 'No se puede modificar una orden anulada' });
        }

        const { responsableId, fechaEntrega, nota, estado } = req.body;

        // Verificar que el empleado existe si se está actualizando
        if (responsableId) {
            const empleado = await Empleados.findByPk(responsableId);
            if (!empleado) {
                return res.status(404).json({ message: 'El empleado responsable no existe' });
            }
            if (empleado.estado === 'inactivo') {
                return res.status(400).json({ message: 'El empleado responsable está inactivo' });
            }
        }

        // Calcular fechas automáticas según el nuevo estado
        const updates = { responsableId, fechaEntrega, nota, estado };

        if (estado === 'En Proceso' && !orden.fechaInicio) {
            updates.fechaInicio = new Date().toISOString().split('T')[0];
        }
        if (estado === 'Finalizada') {
            updates.fechaFin = new Date().toISOString().split('T')[0];
        }

        await orden.update(updates);

        const ordenActualizada = await OrdenesProduccion.findByPk(id, {
            include: [
                { model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia'] },
                { model: Empleados, as: 'responsable', attributes: ['id', 'nombres', 'apellidos', 'cargo'] }
            ]
        });

        res.status(200).json({ message: 'Orden de producción actualizada correctamente', orden: ordenActualizada });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la orden de producción', error: error.message });
    }
};

// PUT - anular orden de producción
const anularOrdenProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivoAnulacion } = req.body;

        const orden = await OrdenesProduccion.findByPk(id);
        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }
        if (orden.estado === 'Anulada') {
            return res.status(400).json({ message: 'La orden ya está anulada' });
        }
        if (orden.estado === 'Finalizada') {
            return res.status(400).json({ message: 'No se puede anular una orden finalizada' });
        }
        if (!motivoAnulacion || !motivoAnulacion.trim()) {
            return res.status(400).json({ message: 'El motivo de anulación es obligatorio' });
        }

        await orden.update({ estado: 'Anulada', motivoAnulacion });

        res.status(200).json({ message: 'Orden anulada correctamente', orden });
    } catch (error) {
        res.status(500).json({ message: 'Error al anular la orden de producción', error: error.message });
    }
};

// DELETE - eliminar orden (solo si está Anulada o Pendiente)
const deleteOrdenProduccion = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await OrdenesProduccion.findByPk(id);

        if (!orden) {
            return res.status(404).json({ message: 'Orden de producción no encontrada' });
        }

        if (!['Anulada', 'Pendiente'].includes(orden.estado)) {
            return res.status(400).json({ message: 'Solo se pueden eliminar órdenes en estado Pendiente o Anulada' });
        }

        await orden.destroy();
        res.status(200).json({ message: 'Orden de producción eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la orden de producción', error: error.message });
    }
};

module.exports = {
    getOrdenesProduccion,
    getOrdenProduccionById,
    createOrdenProduccion,
    updateOrdenProduccion,
    anularOrdenProduccion,
    deleteOrdenProduccion
};