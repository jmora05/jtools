const { Novedades, Empleados } = require('../models/index.js');
const { Op } = require('sequelize');

const ESTADOS_VALIDOS = ['registrada', 'aprobada_remunera', 'aprobada_sin_remuneracion', 'rechazada', 'anulada'];

// Estados terminales — no pueden cambiar de estado
const ESTADOS_TERMINALES = ['anulada', 'rechazada'];

const INCLUDE_EMPLEADOS = [
    { model: Empleados, as: 'empleadoAfectado', attributes: ['id', 'nombres', 'apellidos', 'cargo'] }
];

// Novedades con más de 14 días sin gestión se anulan automáticamente
const DIAS_MAX_SIN_GESTION = 14;

// Anula automáticamente cualquier novedad en estado 'registrada' con más de 14 días
const anularNovedadesVencidas = async () => {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - DIAS_MAX_SIN_GESTION);

    const vencidas = await Novedades.findAll({
        where: {
            estado: 'registrada',
            fecha_registro: { [Op.lt]: fechaLimite }
        }
    });

    for (const novedad of vencidas) {
        await novedad.update({ estado: 'anulada' });
    }

    return vencidas.length;
};

// GET - listar todas las novedades (aplica auto-anulación previa)
const getNovedades = async (req, res) => {
    try {
        await anularNovedadesVencidas();
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

        if (!ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                message: `Estado no válido. Use: ${ESTADOS_VALIDOS.join(', ')}`
            });
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
            empleado_afectado,
            horas_ausencia
        } = req.body;

        // Validar rango de fechas (máximo 14 días)
        if (fecha_inicio && fecha_finalizacion) {
            const inicio = new Date(fecha_inicio);
            const fin    = new Date(fecha_finalizacion);
            const diffDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
            if (diffDias > DIAS_MAX_SIN_GESTION) {
                return res.status(400).json({
                    message: `La duración de la ausencia no puede superar ${DIAS_MAX_SIN_GESTION} días`
                });
            }
        }

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
            empleado_afectado,
            horas_ausencia: horas_ausencia ?? null
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

// PUT - actualizar novedad (solo si está en estado 'registrada')
const updateNovedad = async (req, res) => {
    try {
        const { id } = req.params;
        const novedad = await Novedades.findByPk(id);

        if (!novedad) {
            return res.status(404).json({ message: 'Novedad no encontrada' });
        }

        if (novedad.estado !== 'registrada') {
            return res.status(400).json({
                message: `No se puede editar una novedad en estado "${novedad.estado}". Solo las novedades en estado "registrada" pueden editarse.`
            });
        }

        const {
            titulo,
            descripcion_detallada,
            fecha_inicio,
            fecha_finalizacion,
            empleado_afectado,
            horas_ausencia
        } = req.body;

        // Validar rango de fechas (máximo 14 días)
        const fi = fecha_inicio    || novedad.fecha_inicio;
        const ff = fecha_finalizacion || novedad.fecha_finalizacion;
        if (fi && ff) {
            const inicio = new Date(fi);
            const fin    = new Date(ff);
            const diffDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
            if (diffDias > DIAS_MAX_SIN_GESTION) {
                return res.status(400).json({
                    message: `La duración de la ausencia no puede superar ${DIAS_MAX_SIN_GESTION} días`
                });
            }
        }

        if (empleado_afectado) {
            const empleadoAf = await Empleados.findByPk(empleado_afectado);
            if (!empleadoAf) {
                return res.status(404).json({ message: 'El empleado afectado no existe' });
            }
        }

        await novedad.update({
            titulo,
            descripcion_detallada,
            fecha_inicio,
            fecha_finalizacion,
            empleado_afectado,
            horas_ausencia: horas_ausencia !== undefined ? horas_ausencia : novedad.horas_ausencia
        });

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

// PATCH - cambiar estado de la novedad con reglas de transición
const cambiarEstadoNovedad = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const novedad = await Novedades.findByPk(id);
        if (!novedad) {
            return res.status(404).json({ message: 'Novedad no encontrada' });
        }

        if (!ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                message: `Estado no válido. Use: ${ESTADOS_VALIDOS.join(', ')}`
            });
        }

        // Bloquear transiciones desde estados terminales
        if (ESTADOS_TERMINALES.includes(novedad.estado)) {
            return res.status(400).json({
                message: `No se puede cambiar el estado de una novedad que está "${novedad.estado}". Este estado es definitivo.`
            });
        }

        await novedad.update({ estado });
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

        if (novedad.estado !== 'registrada') {
            return res.status(400).json({
                message: `No se puede eliminar una novedad en estado "${novedad.estado}". Solo las novedades en estado "registrada" pueden eliminarse.`
            });
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
