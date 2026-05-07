const { Op } = require('sequelize');
const { OrdenesProduccion, Productos, Empleados, Pedidos } = require('../models/index.js');
const { sequelize } = require('../config/jtools_db');
const FichaTecnica = require('../models/fichaTecnica');
const DetalleOrden = require('../models/detalleOrden');
const Insumos = require('../models/insumos');
const {
  validarCrearOrden,
  validarActualizarOrden,
  validarAnularOrden,
} = require('../validators/ordenesProduccionValidator');

// ── Calcula el estado del pedido según el conjunto de estados de sus órdenes ──
function calcularEstadoPedido(estadosOrdenes) {
  if (estadosOrdenes.some(e => e === 'En Proceso')) return 'En Proceso';
  if (estadosOrdenes.some(e => e === 'Pausada'))    return 'Pausada';
  if (estadosOrdenes.every(e => e === 'Anulada'))   return 'Anulada';
  if (estadosOrdenes.every(e => e === 'Finalizada' || e === 'Anulada'))
    return 'Finalizada';
  return 'Pendiente';
}

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
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Validaciones de formato y negocio
    const errores = validarCrearOrden(req.body);
    if (errores.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Error de validación', errores });
    }

    const { productoId, cantidad, responsableId, pedidoId, tipoOrden, fechaEntrega, nota } = req.body;

    // 2. Verificar que el producto existe y está activo
    const producto = await Productos.findByPk(productoId);
    if (!producto) {
      await transaction.rollback();
      return res.status(404).json({ message: 'El producto especificado no existe' });
    }
    if (producto.estado === 'inactivo') {
      await transaction.rollback();
      return res.status(400).json({ message: 'No se puede crear una orden para un producto inactivo' });
    }

    // 3. Verificar que el empleado existe y está activo
    const empleado = await Empleados.findByPk(responsableId);
    if (!empleado) {
      await transaction.rollback();
      return res.status(404).json({ message: 'El empleado responsable no existe' });
    }
    if (empleado.estado === 'inactivo') {
      await transaction.rollback();
      return res.status(400).json({ message: 'El empleado responsable está inactivo y no puede ser asignado' });
    }

    // 4. Si viene pedidoId, verificar que el pedido existe
    if (pedidoId) {
      const pedido = await Pedidos.findByPk(pedidoId);
      if (!pedido) {
        await transaction.rollback();
        return res.status(404).json({ message: 'El pedido especificado no existe' });
      }
    }

    // 5. Buscar ficha técnica activa del producto
    const fichaTecnica = await FichaTecnica.findOne({
      where: { productoId, estado: 'Activa' },
      transaction
    });

    if (!fichaTecnica) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'No se puede crear la orden: el producto no tiene una ficha técnica activa' 
      });
    }

    // 6. Validar que la ficha técnica tiene procesos
    if (!fichaTecnica.procesos || fichaTecnica.procesos.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'No se puede crear la orden: la ficha técnica no tiene procesos de fabricación definidos' 
      });
    }

    // 7. Calcular insumos según cantidad
    const insumosCalculados = (fichaTecnica.insumos || []).map(insumo => ({
      name: insumo.name,
      unit: insumo.unit,
      quantity: parseFloat((insumo.quantity * cantidad).toFixed(2))
    }));

    // 8. Generar código y crear orden
    const codigoOrden = await generarCodigoOrden();

    const orden = await OrdenesProduccion.create({
      codigoOrden,
      productoId:    Number(productoId),
      cantidad:      Number(cantidad),
      responsableId: Number(responsableId),
      pedidoId:      pedidoId ? Number(pedidoId) : null,
      tipoOrden,
      fechaEntrega,
      nota:          nota?.trim() || null,
      estado:        'Pendiente',
      insumosCalculados
    }, { transaction });

    // 9. Crear detalle_orden con los procesos de la ficha técnica
    const detalleOrdenRecords = fichaTecnica.procesos.map(proceso => ({
      ordenProduccionId: orden.id,
      productosId: productoId,
      step: proceso.step,
      description: proceso.description,
      duration: proceso.duration,
      responsableId: proceso.responsableId
    }));

    await DetalleOrden.bulkCreate(detalleOrdenRecords, { transaction });

    await transaction.commit();

    // 10. Obtener orden completa con relaciones
    const ordenCompleta = await OrdenesProduccion.findByPk(orden.id, { include: includeRelaciones });
    
    console.info('Production order created from ficha técnica', {
      codigoOrden,
      productoId,
      cantidad,
      procesosCreados: detalleOrdenRecords.length,
      insumosCalculados: insumosCalculados.length,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ message: 'Orden de producción creada correctamente', orden: ordenCompleta });

  } catch (error) {
    await transaction.rollback();
    
    console.error('Error creating production order', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
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
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El ID proporcionado no es válido' });
    }

    const orden = await OrdenesProduccion.findByPk(id, { transaction });
    if (!orden) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Orden de producción no encontrada' });
    }

    // 1. Validaciones de negocio (estado actual como contexto)
    const errores = validarActualizarOrden(req.body, orden.estado);
    if (errores.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Error de validación', errores });
    }

    const { responsableId, fechaEntrega, nota, estado } = req.body;

    // 2. Verificar que el nuevo responsable existe y está activo
    if (responsableId) {
      const empleado = await Empleados.findByPk(responsableId, { transaction });
      if (!empleado) {
        await transaction.rollback();
        return res.status(404).json({ message: 'El empleado responsable no existe' });
      }
      if (empleado.estado === 'inactivo') {
        await transaction.rollback();
        return res.status(400).json({ message: 'El empleado responsable está inactivo y no puede ser asignado' });
      }
    }

    // 3. Bloquear cambio de estado a 'Anulada' por esta ruta — usar /anular
    if (estado === 'Anulada') {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Para anular una orden usa el endpoint PUT /ordenes-produccion/:id/anular',
      });
    }

    // 4. Construir objeto de actualización (solo campos permitidos)
    const updates = {
      responsableId: responsableId ? Number(responsableId) : orden.responsableId,
      fechaEntrega:  fechaEntrega  || orden.fechaEntrega,
      nota:          nota !== undefined ? (nota?.trim() || null) : orden.nota,
      estado:        estado        || orden.estado,
    };

    // 5. Asignar fechas automáticas según transición de estado
    if (estado === 'En Proceso' && !orden.fechaInicio) {
      updates.fechaInicio = new Date().toISOString().split('T')[0];
    }
    if (estado === 'Finalizada' && !orden.fechaFin) {
      updates.fechaFin = new Date().toISOString().split('T')[0];
    }

    // 5b. Aumentar stock del producto al finalizar la orden
    if (estado === 'Finalizada' && orden.estado !== 'Finalizada') {
      const producto = await Productos.findByPk(orden.productoId, { transaction });
      if (producto) {
        const stockNuevo = producto.stock + orden.cantidad;
        await producto.update({ stock: stockNuevo }, { transaction });
        console.info('Product stock updated on order finalization', {
          codigoOrden: orden.codigoOrden,
          productoId: orden.productoId,
          cantidadAgregada: orden.cantidad,
          stockAnterior: producto.stock,
          stockNuevo,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 6. Descontar insumos al cambiar de "Pendiente" a "En Proceso"
    if (orden.estado === 'Pendiente' && estado === 'En Proceso') {
      const insumosCalculados = orden.insumosCalculados || [];
      
      if (insumosCalculados.length > 0) {
        console.info('Descounting insumos for production order', {
          codigoOrden: orden.codigoOrden,
          insumosCount: insumosCalculados.length,
          timestamp: new Date().toISOString()
        });

        for (const insumoCalc of insumosCalculados) {
          // Buscar el insumo por nombre
          const insumo = await Insumos.findOne({
            where: { nombreInsumo: insumoCalc.name },
            transaction
          });

          if (insumo) {
            const nuevaCantidad = insumo.cantidad - insumoCalc.quantity;
            
            if (nuevaCantidad < 0) {
              await transaction.rollback();
              return res.status(400).json({
                message: `Stock insuficiente para el insumo "${insumoCalc.name}". Stock actual: ${insumo.cantidad}, requerido: ${insumoCalc.quantity}`
              });
            }

            await insumo.update({ cantidad: nuevaCantidad }, { transaction });
            
            console.info('Insumo stock updated', {
              insumo: insumoCalc.name,
              cantidadDescontada: insumoCalc.quantity,
              stockAnterior: insumo.cantidad,
              stockNuevo: nuevaCantidad,
              timestamp: new Date().toISOString()
            });
          } else {
            console.warn('Insumo not found in database', {
              insumo: insumoCalc.name,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    await orden.update(updates, { transaction });

    // Sincronizar estado del pedido asociado cuando cambia el estado de la orden
    if (estado && orden.pedidoId) {
      const todasOrdenes = await OrdenesProduccion.findAll({
        where: { pedidoId: orden.pedidoId },
        transaction,
      });
      const estadosActuales = todasOrdenes.map(o =>
        o.id === Number(id) ? updates.estado : o.estado
      );
      const nuevoPedidoEstado = calcularEstadoPedido(estadosActuales);
      await Pedidos.update(
        { estado: nuevoPedidoEstado },
        { where: { id: orden.pedidoId }, transaction }
      );
    }

    await transaction.commit();

    const ordenActualizada = await OrdenesProduccion.findByPk(id, { include: includeRelaciones });
    res.status(200).json({ message: 'Orden de producción actualizada correctamente', orden: ordenActualizada });

  } catch (error) {
    await transaction.rollback();
    
    console.error('Error updating production order', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
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

    const errores = validarAnularOrden(req.body, orden.estado);
    if (errores.length > 0) {
      return res.status(400).json({ message: 'Error de validación', errores });
    }

    const { motivoAnulacion } = req.body;
    await orden.update({ estado: 'Anulada', motivoAnulacion: motivoAnulacion.trim() });

    // Sincronizar estado del pedido asociado
    if (orden.pedidoId) {
      const todasOrdenes = await OrdenesProduccion.findAll({
        where: { pedidoId: orden.pedidoId },
      });
      const estadosActuales = todasOrdenes.map(o =>
        o.id === Number(id) ? 'Anulada' : o.estado
      );
      const nuevoPedidoEstado = calcularEstadoPedido(estadosActuales);
      await Pedidos.update({ estado: nuevoPedidoEstado }, { where: { id: orden.pedidoId } });
    }

    res.status(200).json({ message: 'Orden anulada correctamente', orden });

  } catch (error) {
    res.status(500).json({ message: 'Error al anular la orden de producción', error: error.message });
  }
};

// ────────────────────────────────────────────────────────────
//  DELETE /ordenes-produccion/:id  —  eliminar físico
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