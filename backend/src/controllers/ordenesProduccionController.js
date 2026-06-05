const { Op } = require('sequelize');
const { OrdenesProduccion, Productos, Empleados, FichaTecnica, Insumos } = require('../models/index.js');
const { sequelize } = require('../config/jtools_db');
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

    const { productoId, cantidad, responsableId, tipoOrden, fechaEntrega, nota } = req.body;

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

    // 4. Generar código y crear orden
    const codigoOrden = await generarCodigoOrden();

    const orden = await OrdenesProduccion.create({
      codigoOrden,
      productoId:    Number(productoId),
      cantidad:      Number(cantidad),
      responsableId: Number(responsableId),
      tipoOrden,
      fechaEntrega,
      nota:          nota?.trim() || null,
      estado:        'Pendiente',
      insumosCalculados: [],
    }, { transaction });

    await transaction.commit();

    // 5. Obtener orden completa con relaciones
    const ordenCompleta = await OrdenesProduccion.findByPk(orden.id, { include: includeRelaciones });

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

    // 5a. Descontar insumos al pasar a "En Proceso" por primera vez
    if (estado === 'En Proceso' && orden.estado !== 'En Proceso' && !orden.fechaInicio) {
      const ficha = await FichaTecnica.findOne({
        where: { productoId: orden.productoId, estado: 'Activa' },
        transaction,
      });

      // Requerimos una ficha activa con insumos para iniciar producción
      if (!ficha) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'No existe una ficha técnica activa para este producto. Cree o active una ficha antes de iniciar producción.'
        });
      }

      const insumosFicha = Array.isArray(ficha.insumos) ? ficha.insumos : [];
      if (insumosFicha.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'La ficha técnica no contiene insumos. No se puede iniciar producción.'
        });
      }

      const insuficientes = [];
      const plan = [];

      for (const fichaInsumo of insumosFicha) {
        const nombreRaw = fichaInsumo.name || fichaInsumo.nombre || fichaInsumo.insumo || '';
        const cantidadPorUnidad = Number(fichaInsumo.quantity ?? fichaInsumo.cantidad ?? fichaInsumo.qty ?? 0) || 0;
        const nombre = String(nombreRaw).trim();
        const cantidadADescontar = cantidadPorUnidad * orden.cantidad;

        if (!nombre) {
          insuficientes.push('Una línea de insumo en la ficha no tiene nombre definido');
          continue;
        }
        if (cantidadADescontar <= 0) continue;

        const nombreNormalized = nombre.toLowerCase();

        // Buscar insumo por nombre (case-insensitive)
        const insumo = await Insumos.findOne({
          where: sequelize.where(sequelize.fn('lower', sequelize.col('nombreInsumo')), nombreNormalized),
          transaction,
        });

        if (!insumo) {
          insuficientes.push(`El insumo "${nombre}" no existe en inventario`);
          continue;
        }

        const cantidadActual = insumo.cantidad ?? 0;
        if (cantidadActual < cantidadADescontar) {
          insuficientes.push(
            `No hay suficiente "${insumo.nombreInsumo}". Requeridos: ${cantidadADescontar}, disponibles: ${cantidadActual}`
          );
          continue;
        }

        plan.push({ insumo, cantidadADescontar, cantidadActual });
      }

      if (insuficientes.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'No hay suficientes insumos para iniciar la orden',
          errores: insuficientes,
        });
      }

      const snapshot = [];
      for (const item of plan) {
        const cantidadNueva = item.cantidadActual - item.cantidadADescontar;
        await item.insumo.update({ cantidad: cantidadNueva }, { transaction });

        snapshot.push({
          insumosId:          item.insumo.id,
          nombre:             item.insumo.nombreInsumo,
          cantidadDescontada: item.cantidadADescontar,
        });

        console.info('Insumo descontado al iniciar producción', {
          codigoOrden: orden.codigoOrden,
          insumo: item.insumo.nombreInsumo,
          cantidadDescontada: item.cantidadADescontar,
          stockAnterior: item.cantidadActual,
          stockNuevo: cantidadNueva,
        });
      }

      if (snapshot.length > 0) {
        updates.insumosCalculados = snapshot;
      }
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

    await orden.update(updates, { transaction });

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

    const errores = validarAnularOrden(req.body, orden.estado);
    if (errores.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Error de validación', errores });
    }

    // Devolver insumos al stock si la orden ya había consumido insumos
    const insumosCalculados = Array.isArray(orden.insumosCalculados) ? orden.insumosCalculados : [];
    const insumosRestaurados = [];

    // insumosADevolver: array opcional con cantidades personalizadas a devolver
    // Formato: [{ insumosId: number, cantidadADevolver: number }, ...]
    const { motivoAnulacion, insumosADevolver } = req.body;

    for (const item of insumosCalculados) {
      if (!item.insumosId || !item.cantidadDescontada) continue;

      const insumo = await Insumos.findByPk(item.insumosId, { transaction });
      if (!insumo) continue;

      // Determinar cuánto devolver: si el cliente especificó una cantidad personalizada, usarla
      // limitada entre 0 y el total descontado; de lo contrario devolver todo.
      let cantidadARestaurar = item.cantidadDescontada;
      if (Array.isArray(insumosADevolver) && insumosADevolver.length > 0) {
        const override = insumosADevolver.find(d => Number(d.insumosId) === Number(item.insumosId));
        if (override !== undefined) {
          cantidadARestaurar = Math.floor(Math.max(0, Math.min(Number(override.cantidadADevolver) || 0, item.cantidadDescontada)));
        }
      }

      if (cantidadARestaurar <= 0) continue;

      const stockAnterior = insumo.cantidad ?? 0;
      const cantidadRestaurada = stockAnterior + cantidadARestaurar;
      await insumo.update({ cantidad: cantidadRestaurada }, { transaction });

      insumosRestaurados.push({
        insumosId: item.insumosId,
        nombre: insumo.nombreInsumo,
        cantidadRestaurada: cantidadARestaurar,
        stockAnterior,
        stockNuevo: cantidadRestaurada,
      });

      console.info('Insumo restaurado al anular orden', {
        codigoOrden: orden.codigoOrden,
        insumo: insumo.nombreInsumo,
        cantidadRestaurada: cantidadARestaurar,
        stockAnterior,
        stockNuevo: cantidadRestaurada,
      });
    }
    await orden.update(
      { estado: 'Anulada', motivoAnulacion: motivoAnulacion.trim(), insumosCalculados: [] },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      message: 'Orden anulada correctamente',
      orden,
      insumosRestaurados,
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error anulando orden de producción', { error: error.message, stack: error.stack });
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