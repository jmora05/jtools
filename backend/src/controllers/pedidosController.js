const { Pedidos, Clientes, DetallePedidos, Productos, OrdenesProduccion } = require('../models/index.js');
const { sequelize } = require('../config/jtools_db');
const FichaTecnica = require('../models/fichaTecnica');
const DetalleOrden = require('../models/detalleOrden');
const { Op } = require('sequelize');

// GET - listar todos los pedidos
const getPedidos = async (req, res) => {
    try {
        const pedidos = await Pedidos.findAll({
            include: [
                { model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'] },
                {
                    model: DetallePedidos, as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }]
                }
            ]
        });
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los pedidos', error: error.message });
    }
};

// GET - obtener pedido por ID

const getPedidoById = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await Pedidos.findByPk(id, {
            include: [
                { model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'] },
                {
                    model: DetallePedidos, as: 'detalles',
                    include: [{ model: Productos, as: 'producto', attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }]
                },
                { model: OrdenesProduccion, as: 'ordenes', attributes: ['id', 'cantidad', 'fechaEntrega', 'nota'] }
            ]
        });

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        res.status(200).json(pedido);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el pedido', error: error.message });
    }
};

// ── Generador de código único tipo OP-2025-001 ───────────────────────────────
const generarCodigoOrden = async (transaction) => {
  const year = new Date().getFullYear();
  const lastOrden = await OrdenesProduccion.findOne({
    where: { codigoOrden: { [Op.like]: `OP-${year}-%` } },
    order: [['id', 'DESC']],
    transaction
  });
  let nextNum = 1;
  if (lastOrden) {
    const parts = lastOrden.codigoOrden.split('-');
    nextNum = parseInt(parts[2]) + 1;
  }
  return `OP-${year}-${String(nextNum).padStart(3, '0')}`;
};

// POST - crear pedido
const createPedido = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const {
            clienteId,
            fecha_pedido,
            total,
            direccion,
            ciudad,
            instrucciones_entrega,
            notas_observaciones,
            detalles = [],
            responsableId,  // Responsable para las órdenes de producción
            fechaEntrega    // Fecha de entrega para las órdenes de producción
        } = req.body;

        // 1. Validar cliente
        const cliente = await Clientes.findByPk(clienteId, { transaction });
        if (!cliente) {
            await transaction.rollback();
            return res.status(404).json({ message: 'El cliente especificado no existe' });
        }
        if (cliente.estado === 'inactivo') {
            await transaction.rollback();
            return res.status(400).json({ message: 'El cliente está inactivo' });
        }

        // 2. Validar responsable si se proporciona
        if (responsableId) {
            const { Empleados } = require('../models/index.js');
            const empleado = await Empleados.findByPk(responsableId, { transaction });
            if (!empleado) {
                await transaction.rollback();
                return res.status(404).json({ message: 'El empleado responsable no existe' });
            }
            if (empleado.estado === 'inactivo') {
                await transaction.rollback();
                return res.status(400).json({ message: 'El empleado responsable está inactivo' });
            }
        }

        // 3. Crear pedido
        const pedido = await Pedidos.create({
            clienteId, fecha_pedido, total, direccion, ciudad,
            instrucciones_entrega, notas_observaciones
        }, { transaction });

        // 4. Crear detalles del pedido
        if (detalles.length > 0) {
            await DetallePedidos.bulkCreate(
                detalles.map(d => ({
                    pedidosId:      pedido.id,
                    productosId:    d.productoId,
                    cantidad:       d.cantidad,
                    precioUnitario: d.precio_unitario,
                    total:          d.cantidad * d.precio_unitario,
                })),
                { transaction }
            );
        }

        // 5. Crear órdenes de producción automáticamente para cada producto
        const ordenesCreadas = [];
        const erroresOrdenes = [];

        for (const detalle of detalles) {
            try {
                // 5.1. Verificar que el producto existe y está activo
                const producto = await Productos.findByPk(detalle.productoId, { transaction });
                if (!producto) {
                    erroresOrdenes.push({
                        productoId: detalle.productoId,
                        error: 'Producto no encontrado'
                    });
                    continue;
                }
                if (producto.estado === 'inactivo') {
                    erroresOrdenes.push({
                        productoId: detalle.productoId,
                        producto: producto.nombreProducto,
                        error: 'Producto inactivo'
                    });
                    continue;
                }

                // 5.2. Buscar ficha técnica activa del producto
                const fichaTecnica = await FichaTecnica.findOne({
                    where: { productoId: detalle.productoId, estado: 'Activa' },
                    transaction
                });

                if (!fichaTecnica) {
                    erroresOrdenes.push({
                        productoId: detalle.productoId,
                        producto: producto.nombreProducto,
                        error: 'No tiene ficha técnica activa'
                    });
                    continue;
                }

                // 5.3. Validar que la ficha técnica tiene procesos
                if (!fichaTecnica.procesos || fichaTecnica.procesos.length === 0) {
                    erroresOrdenes.push({
                        productoId: detalle.productoId,
                        producto: producto.nombreProducto,
                        error: 'La ficha técnica no tiene procesos definidos'
                    });
                    continue;
                }

                // 5.4. Calcular insumos según cantidad
                const insumosCalculados = (fichaTecnica.insumos || []).map(insumo => ({
                    name: insumo.name,
                    unit: insumo.unit,
                    quantity: parseFloat((insumo.quantity * detalle.cantidad).toFixed(2))
                }));

                // 5.5. Generar código y crear orden de producción
                const codigoOrden = await generarCodigoOrden(transaction);

                // 5.6. Determinar responsable y fecha de entrega
                // Si no se proporciona responsableId, usar el primer responsable de la ficha técnica
                let responsableOrden = responsableId;
                if (!responsableOrden && fichaTecnica.procesos.length > 0) {
                    responsableOrden = fichaTecnica.procesos[0].responsableId;
                }

                // Si no hay responsable, no podemos crear la orden
                if (!responsableOrden) {
                    erroresOrdenes.push({
                        productoId: detalle.productoId,
                        producto: producto.nombreProducto,
                        error: 'No se pudo determinar un responsable para la orden'
                    });
                    continue;
                }

                // Fecha de entrega: usar la proporcionada o calcular 7 días desde hoy
                const fechaEntregaOrden = fechaEntrega || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const orden = await OrdenesProduccion.create({
                    codigoOrden,
                    productoId:    Number(detalle.productoId),
                    cantidad:      Number(detalle.cantidad),
                    responsableId: Number(responsableOrden),
                    pedidoId:      pedido.id,
                    tipoOrden:     'Pedido',
                    fechaEntrega:  fechaEntregaOrden,
                    nota:          `Orden generada automáticamente para pedido #${pedido.id}`,
                    estado:        'Pendiente',
                    insumosCalculados
                }, { transaction });

                // 5.7. Crear detalle_orden con los procesos de la ficha técnica
                const detalleOrdenRecords = fichaTecnica.procesos.map(proceso => ({
                    ordenProduccionId: orden.id,
                    productosId: detalle.productoId,
                    step: proceso.step,
                    description: proceso.description,
                    duration: proceso.duration,
                    responsableId: proceso.responsableId
                }));

                await DetalleOrden.bulkCreate(detalleOrdenRecords, { transaction });

                ordenesCreadas.push({
                    codigoOrden,
                    producto: producto.nombreProducto,
                    cantidad: detalle.cantidad
                });

                console.info('Production order auto-created from pedido', {
                    pedidoId: pedido.id,
                    codigoOrden,
                    productoId: detalle.productoId,
                    cantidad: detalle.cantidad,
                    procesosCreados: detalleOrdenRecords.length,
                    timestamp: new Date().toISOString()
                });

            } catch (ordenError) {
                console.error('Error creating production order for product', {
                    pedidoId: pedido.id,
                    productoId: detalle.productoId,
                    error: ordenError.message,
                    timestamp: new Date().toISOString()
                });
                
                erroresOrdenes.push({
                    productoId: detalle.productoId,
                    error: ordenError.message
                });
            }
        }

        await transaction.commit();

        // 6. Recargar pedido con relaciones
        await pedido.reload({
            include: [
                { model: Clientes, as: 'cliente',
                  attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono'] },
                { model: DetallePedidos, as: 'detalles',
                  include: [{ model: Productos, as: 'producto',
                              attributes: ['id', 'nombreProducto', 'referencia', 'precio'] }] },
                { model: OrdenesProduccion, as: 'ordenes',
                  attributes: ['id', 'codigoOrden', 'cantidad', 'fechaEntrega', 'estado'] }
            ]
        });

        // 7. Preparar respuesta
        const response = {
            message: 'Pedido creado correctamente',
            pedido,
            ordenesProduccion: {
                creadas: ordenesCreadas.length,
                detalles: ordenesCreadas
            }
        };

        // Si hubo errores al crear algunas órdenes, incluirlos en la respuesta
        if (erroresOrdenes.length > 0) {
            response.advertencias = {
                message: 'Algunas órdenes de producción no pudieron ser creadas',
                errores: erroresOrdenes
            };
        }

        res.status(201).json(response);

    } catch (error) {
        await transaction.rollback();
        
        console.error('Error creating pedido', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                message: 'Error de validación',
                errores: error.errors.map(e => e.message) 
            });
        }
        res.status(500).json({ message: 'Error al crear el pedido', error: error.message });
    }
};

// PUT - actualizar pedido
const updatePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await Pedidos.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const {
            clienteId,
            fecha_pedido,
            total,
            direccion,
            ciudad,
            instrucciones_entrega,
            notas_observaciones,
            estado,
        } = req.body;

        // verificar que el cliente existe si se está actualizando
        if (clienteId) {
            const cliente = await Clientes.findByPk(clienteId);
            if (!cliente) {
                return res.status(404).json({ message: 'El cliente especificado no existe' });
            }
            if (cliente.estado === 'inactivo') {
                return res.status(400).json({ message: 'El cliente está inactivo' });
            }
        }

        await pedido.update({
            clienteId,
            fecha_pedido,
            total,
            direccion,
            ciudad,
            instrucciones_entrega,
            notas_observaciones,
            estado,              
        });

        res.status(200).json({ message: 'Pedido actualizado correctamente', pedido });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar el pedido', error: error.message });
    }
};

// DELETE - eliminar pedido (solo si no tiene órdenes de producción asociadas)
const deletePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await Pedidos.findByPk(id);

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        // verificar si tiene órdenes de producción asociadas
        const ordenesAsociadas = await OrdenesProduccion.findOne({
            where: { pedidoId: id }
        });

        if (ordenesAsociadas) {
            return res.status(400).json({ message: 'No se puede eliminar el pedido porque tiene órdenes de producción asociadas' });
        }

        await pedido.destroy();
        res.status(200).json({ message: 'Pedido eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el pedido', error: error.message });
    }
};

module.exports = {
    getPedidos,
    getPedidoById,
    createPedido,
    updatePedido,
    deletePedido
};