const { Novedades, Empleados } = require('../models/index.js');

// Include base reutilizable con los tres empleados asociados
const INCLUDE_EMPLEADOS = [
    { model: Empleados, as: 'registradoPor',        attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
    { model: Empleados, as: 'empleadoResponsable',  attributes: ['id', 'nombres', 'apellidos', 'cargo'] },
    { model: Empleados, as: 'empleadoAfectado',     attributes: ['id', 'nombres', 'apellidos', 'cargo'] } // ← NUEVO
];

// GET - listar todas las novedades
const getNovedades = async (req, res) => {
    try {
        const novedades = await Novedades.findAll({ include: INCLUDE_EMPLEADOS });
        res.status(200).json(novedades);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las novedades', error: error.message });
    }
};

// GET - obtener novedad por ID
const getNovedadById = async (req, res) => {
    try {
        const { id } = req.params;
        const novedad = await Novedades.findByPk(id, { include: INCLUDE_EMPLEADOS });

        if (!novedad) {
            return res.status(404).json({ message: 'Novedad no encontrada' });
        }

        res.status(200).json(novedad);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la novedad', error: error.message });
    }
};

// GET - listar novedades por estado
const getNovedadesByEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        const estadosValidos = ['registrada', 'aprobada', 'rechazada'];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido. Use: registrada, aprobada o rechazada' });
        }

        const novedades = await Novedades.findAll({ where: { estado }, include: INCLUDE_EMPLEADOS });
        res.status(200).json(novedades);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las novedades por estado', error: error.message });
    }
};

// POST - crear novedad
const createNovedad = async (req, res) => {
    try {
        const {
            titulo,
            descripcion_detallada,
            estado,
            fecha_registro,
            fecha_inicio,
            fecha_finalizacion,
            registrado_por,
            empleado_responsable,
            empleado_afectado       // ← NUEVO
        } = req.body;

        // verificar que el empleado que registra existe y está activo
        const empleadoRegistra = await Empleados.findByPk(registrado_por);
        if (!empleadoRegistra) {
            return res.status(404).json({ message: 'El empleado que registra la novedad no existe' });
        }
        if (empleadoRegistra.estado === 'inactivo') {
            return res.status(400).json({ message: 'El empleado que registra está inactivo' });
        }

        // verificar que el empleado responsable existe si se especificó
        if (empleado_responsable) {
            const empleadoResp = await Empleados.findByPk(empleado_responsable);
            if (!empleadoResp) {
                return res.status(404).json({ message: 'El empleado responsable no existe' });
            }
            if (empleadoResp.estado === 'inactivo') {
                return res.status(400).json({ message: 'El empleado responsable está inactivo' });
            }
        }

        // verificar que el empleado afectado existe si se especificó ← NUEVO
        if (empleado_afectado) {
            const empleadoAf = await Empleados.findByPk(empleado_afectado);
            if (!empleadoAf) {
                return res.status(404).json({ message: 'El empleado afectado no existe' });
            }
            if (empleadoAf.estado === 'inactivo') {
                return res.status(400).json({ message: 'El empleado afectado está inactivo' });
            }
        }

        const novedad = await Novedades.create({
            titulo,
            descripcion_detallada,
            estado,
            fecha_registro,
            fecha_inicio,
            fecha_finalizacion,
            registrado_por,
            empleado_responsable,
            empleado_afectado       // ← NUEVO
        });

        await novedad.reload({ include: INCLUDE_EMPLEADOS });

        res.status(201).json(novedad);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al crear la novedad', error: error.message });
    }
};

// PUT - actualizar novedad (solo campos editables, no el estado)
const updateNovedad = async (req, res) => {
    try {
        const { id } = req.params;
        const novedad = await Novedades.findByPk(id);

        if (!novedad) {
            return res.status(404).json({ message: 'Novedad no encontrada' });
        }

        // no permitir editar novedades ya aprobadas o rechazadas
        if (novedad.estado !== 'registrada') {
            return res.status(400).json({ message: `No se puede editar una novedad que ya fue ${novedad.estado}` });
        }

        const {
            titulo,
            descripcion_detallada,
            fecha_inicio,
            fecha_finalizacion,
            empleado_responsable,
            empleado_afectado       // ← NUEVO
        } = req.body;

        // verificar que el empleado responsable existe si se actualizó
        if (empleado_responsable) {
            const empleadoResp = await Empleados.findByPk(empleado_responsable);
            if (!empleadoResp) {
                return res.status(404).json({ message: 'El empleado responsable no existe' });
            }
        }

        // verificar que el empleado afectado existe si se actualizó ← NUEVO
        if (empleado_afectado) {
            const empleadoAf = await Empleados.findByPk(empleado_afectado);
            if (!empleadoAf) {
                return res.status(404).json({ message: 'El empleado afectado no existe' });
            }
        }

        await novedad.update({ titulo, descripcion_detallada, fecha_inicio,
            fecha_finalizacion, empleado_responsable, empleado_afectado });

        // Recargar con asociaciones para devolver el objeto completo
        await novedad.reload({ include: INCLUDE_EMPLEADOS });

        res.status(200).json(novedad);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación', errores: mensajes });
        }
        res.status(500).json({ message: 'Error al actualizar la novedad', error: error.message });
    }
};

// PATCH - cambiar estado de la novedad (aprobar o rechazar)
const cambiarEstadoNovedad = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const novedad = await Novedades.findByPk(id);
        if (!novedad) {
            return res.status(404).json({ message: 'Novedad no encontrada' });
        }

        const estadosValidos = ['registrada', 'aprobada', 'rechazada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido. Use: registrada, aprobada o rechazada' });
        }

        // no permitir volver a registrada si ya fue aprobada o rechazada
        if (novedad.estado !== 'registrada' && estado === 'registrada') {
            return res.status(400).json({ message: 'No se puede volver al estado registrada' });
        }

        await novedad.update({ estado });

        // Recargar con asociaciones para devolver el objeto completo
        await novedad.reload({ include: INCLUDE_EMPLEADOS });

        res.status(200).json(novedad);
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado de la novedad', error: error.message });
    }
};

// DELETE - eliminar novedad (solo si está en estado registrada)
const deleteNovedad = async (req, res) => {
    try {
        const { id } = req.params;
        const novedad = await Novedades.findByPk(id);

        if (!novedad) {
            return res.status(404).json({ message: 'Novedad no encontrada' });
        }

        // solo se puede eliminar si aún no ha sido procesada
        if (novedad.estado !== 'registrada') {
            return res.status(400).json({ message: `No se puede eliminar una novedad que ya fue ${novedad.estado}` });
        }

        await novedad.destroy();
        res.status(200).json({ message: 'Novedad eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la novedad', error: error.message });
    }
};

module.exports = {
    getNovedades,
    getNovedadById,
    getNovedadesByEstado,
    createNovedad,
    updateNovedad,
    cambiarEstadoNovedad,
    deleteNovedad
};