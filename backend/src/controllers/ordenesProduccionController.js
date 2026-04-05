const { Op } = require('sequelize');
const { OrdenesProduccion, Productos, Empleados, Pedidos } = require('../models/index.js');
const {
  validarCrearOrden,
  validarActualizarOrden,
  validarAnularOrden,
} = require('../validators/ordenesProduccionValidator');

// ── Generador de código único tipo OP-2025-001 ───────────────────────────────
const generarCodigoOrden = async () => {
  const year = new Date().getFullYear();
  const lastOrden = await OrdenesProduccion.findOne({
    where: { codigoOrden: { [Op.like]: `OP-${year}-%` } },
    order: [['id', 'DESC']],
  });
  let nextNum = 1;
  if (lastOrden) {
    const parts = lastOrden.codigoOrden.split('-');
    nextNum = parseInt(parts[2]) + 1;
  }
  return `OP-${year}-${String(nextNum).padStart(3, '0')}`;
};

// ── Include estándar para relaciones ─────────────────────────────────────────
const includeRelaciones = [
  { model: Productos,  as: 'producto',    attributes: ['id', 'nombreProducto', 'referencia'] },
  { model: Empleados,  as: 'responsable', attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
  { model: Pedidos,    as: 'pedido',      attributes: ['id', 'fecha_pedido', 'total', 'ciudad'] },
];

// ────────────────────────────────────────────────────────────
//  GET /ordenes-produccion  —  listar todas
// ────────────────────────────────────────────────────────────
const getOrdenesProduccion = async (req, res) => {
  try {
    const ordenes = await OrdenesProduccion.findAll({
      include: includeRelaciones,
      order: [['id', 'DESC']],
    });
    res.status(200).json(ordenes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las órdenes de producción', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  GET /ordenes-produccion/:id  —  obtener por ID
// ────────────────────────────────────────────────────────────
const getOrdenProduccionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const orden = await OrdenesProduccion.findByPk(id, { include: includeRelaciones });
    if (!orden) {
      return res.status(404).json({ message: 'Orden de producción no encontrada' });
    }

    res.status(200).json(orden);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la orden de producción', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  POST /ordenes-produccion  —  crear
// ────────────────────────────────────────────────────────────
const createOrdenProduccion = async (req, res) => {
  try {
    // 1. Validaciones de negocio
    const errores = validarCrearOrden(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ message: 'Error de validación', errores });
    }

    const { productoId, cantidad, responsableId, pedidoId, fechaEntrega, nota } = req.body;

    // 2. Verificar que el producto existe
    const producto = await Productos.findByPk(productoId);
    if (!producto) {
      return res.status(404).json({ message: 'El producto especificado no existe' });
    }

    // 3. Verificar que el empleado existe y está activo
    const empleado = await Empleados.findByPk(responsableId);
    if (!empleado) {
      return res.status(404).json({ message: 'El empleado responsable no existe' });
    }
    if (empleado.estado === 'inactivo') {
      return res.status(400).json({ message: 'El empleado responsable está inactivo y no puede ser asignado' });
    }

    // 4. Verificar que el pedido existe si se proporcionó
    if (pedidoId) {
      const pedido = await Pedidos.findByPk(pedidoId);
      if (!pedido) {
        return res.status(404).json({ message: 'El pedido especificado no existe' });
      }
    }

    // 5. Generar código y crear
    const codigoOrden = await generarCodigoOrden();

    const orden = await OrdenesProduccion.create({
      codigoOrden,
      productoId:    Number(productoId),
      cantidad:      Number(cantidad),
      responsableId: Number(responsableId),
      pedidoId:      pedidoId ? Number(pedidoId) : null,
      fechaEntrega,
      nota:          nota?.trim() || null,
      estado:        'Pendiente',
    });

    const ordenCompleta = await OrdenesProduccion.findByPk(orden.id, { include: includeRelaciones });
    res.status(201).json({ message: 'Orden de producción creada correctamente', orden: ordenCompleta });

  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const mensajes = error.errors.map(e => e.message);
      return res.status(400).json({ message: 'Error de validación', errores: mensajes });
    }
    res.status(500).json({ message: 'Error al crear la orden de producción', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  PUT /ordenes-produccion/:id  —  actualizar
// ────────────────────────────────────────────────────────────
const updateOrdenProduccion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const orden = await OrdenesProduccion.findByPk(id);
    if (!orden) {
      return res.status(404).json({ message: 'Orden de producción no encontrada' });
    }

    // 1. Validaciones de negocio (incluye validación de transición de estado)
    const errores = validarActualizarOrden(req.body, orden.estado);
    if (errores.length > 0) {
      return res.status(400).json({ message: 'Error de validación', errores });
    }

    const { responsableId, fechaEntrega, nota, estado } = req.body;

    // 2. Verificar que el nuevo responsable existe y está activo
    if (responsableId) {
      const empleado = await Empleados.findByPk(responsableId);
      if (!empleado) {
        return res.status(404).json({ message: 'El empleado responsable no existe' });
      }
      if (empleado.estado === 'inactivo') {
        return res.status(400).json({ message: 'El empleado responsable está inactivo y no puede ser asignado' });
      }
    }

    // 3. Calcular fechas automáticas según el nuevo estado
    const updates = {
      responsableId: responsableId ? Number(responsableId) : orden.responsableId,
      fechaEntrega:  fechaEntrega  || orden.fechaEntrega,
      nota:          nota !== undefined ? (nota?.trim() || null) : orden.nota,
      estado:        estado        || orden.estado,
    };

    if (estado === 'En Proceso' && !orden.fechaInicio) {
      updates.fechaInicio = new Date().toISOString().split('T')[0];
    }
    if (estado === 'Finalizada' && !orden.fechaFin) {
      updates.fechaFin = new Date().toISOString().split('T')[0];
    }

    await orden.update(updates);

    const ordenActualizada = await OrdenesProduccion.findByPk(id, { include: includeRelaciones });
    res.status(200).json({ message: 'Orden de producción actualizada correctamente', orden: ordenActualizada });

  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const mensajes = error.errors.map(e => e.message);
      return res.status(400).json({ message: 'Error de validación', errores: mensajes });
    }
    res.status(500).json({ message: 'Error al actualizar la orden de producción', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  PUT /ordenes-produccion/:id/anular  —  anular
// ────────────────────────────────────────────────────────────
const anularOrdenProduccion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const orden = await OrdenesProduccion.findByPk(id);
    if (!orden) {
      return res.status(404).json({ message: 'Orden de producción no encontrada' });
    }

    // Validaciones de negocio para anulación
    const errores = validarAnularOrden(req.body, orden.estado);
    if (errores.length > 0) {
      return res.status(400).json({ message: 'Error de validación', errores });
    }

    const { motivoAnulacion } = req.body;
    await orden.update({ estado: 'Anulada', motivoAnulacion: motivoAnulacion.trim() });

    res.status(200).json({ message: 'Orden anulada correctamente', orden });

  } catch (error) {
    res.status(500).json({ message: 'Error al anular la orden de producción', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  DELETE /ordenes-produccion/:id  —  eliminar
// ────────────────────────────────────────────────────────────
const deleteOrdenProduccion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const orden = await OrdenesProduccion.findByPk(id);
    if (!orden) {
      return res.status(404).json({ message: 'Orden de producción no encontrada' });
    }

    if (!['Anulada', 'Pendiente'].includes(orden.estado)) {
      return res.status(400).json({
        message: `Solo se pueden eliminar órdenes en estado Pendiente o Anulada. Estado actual: "${orden.estado}"`,
      });
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
  deleteOrdenProduccion,
};