/**
 * Controlador de Novedades (ausencias e incidencias del módulo de RRHH).
 * Gestiona el ciclo de vida completo: registro, aprobación/rechazo y anulación automática.
 * Las novedades aprobadas sin remuneración o rechazadas afectan el cálculo de nómina.
 */
const { Novedades, Empleados } = require('../models/index.js');
const { Op } = require('sequelize');

// Catálogo completo de estados; cualquier valor fuera de este conjunto se rechaza en las rutas de mutación
const ESTADOS_VALIDOS = ['registrada', 'aprobada_remunera', 'aprobada_sin_remuneracion', 'rechazada', 'anulada'];

// Estados terminales — no pueden cambiar de estado
// Una vez anulada o rechazada, la novedad no puede reactivarse para proteger la integridad del historial
const ESTADOS_TERMINALES = ['anulada', 'rechazada'];

// Fragmento de include reutilizable para adjuntar datos del empleado afectado en cada consulta
const INCLUDE_EMPLEADOS = [
    { model: Empleados, as: 'empleadoAfectado', attributes: ['id', 'nombres', 'apellidos', 'cargo'] }
];

// Política de negocio: novedades sin gestión por más de 14 días se anulán automáticamente
// para evitar que queden en limbo afectando la nómina de forma indefinida
const DIAS_MAX_SIN_GESTION = 14;

/**
 * Busca todas las novedades en estado 'registrada' con más de DIAS_MAX_SIN_GESTION días
 * y las marca como 'anulada'. Se invoca antes de cada listado general para garantizar
 * que el frontend siempre muestre estados actualizados sin requerir un job en background.
 * @returns {Promise<number>} Cantidad de novedades anuladas en esta pasada
 */
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

/**
 * Lista todas las novedades del sistema.
 * Aplica la anulación automática por vencimiento antes de retornar, de modo que el cliente
 * nunca recibe registros bloqueados en estado 'registrada' por más de 14 días.
 */
const getNovedades = async (req, res) => {
    try {
        await anularNovedadesVencidas();
        const novedades = await Novedades.findAll({ include: INCLUDE_EMPLEADOS });
        res.status(200).json(novedades);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las novedades', error: error.message });
    }
};

/**
 * Retorna una novedad específica por su PK, incluyendo datos del empleado afectado.
 * Usado principalmente por el frontend al abrir el diálogo de detalle o edición.
 */
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

/**
 * Filtra novedades por estado en el servidor.
 * Valida que el estado solicitado exista en el catálogo antes de consultar,
 * evitando consultas vacías o inyecciones de valores arbitrarios.
 */
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

/**
 * Crea una nueva novedad de ausencia o incidencia.
 * Valida dos reglas de negocio antes de persistir:
 *   1. El rango de fechas no puede exceder DIAS_MAX_SIN_GESTION, alineándose con el
 *      plazo máximo de gestión para evitar ausencias de duración indeterminada.
 *   2. Si se asocia un empleado afectado, debe existir y estar activo en el sistema.
 *      Un empleado inactivo no puede generar nuevas novedades que afecten su nómina.
 */
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

        // La duración máxima iguala el plazo de auto-anulación: una ausencia no puede durar
        // más de lo que el sistema espera para gestionarla, de lo contrario se auto-anularía
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

        // empleado_afectado es opcional; si se provee, se valida existencia y estado activo
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
            horas_ausencia: horas_ausencia ?? null  // null explícito para distinguir "no aplica" de 0
        });

        // Recarga para obtener el empleadoAfectado anidado sin una segunda query de selección
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

/**
 * Actualiza los datos de una novedad existente.
 * Solo permite edición cuando el estado es 'registrada'; cualquier otro estado indica que
 * la novedad ya fue gestionada y sus datos no deben modificarse para preservar la trazabilidad.
 * La validación de rango de fechas usa fallback a los valores actuales del registro para
 * soportar actualizaciones parciales (solo un campo de fecha a la vez).
 */
const updateNovedad = async (req, res) => {
    try {
        const { id } = req.params;
        const novedad = await Novedades.findByPk(id);

        if (!novedad) {
            return res.status(404).json({ message: 'Novedad no encontrada' });
        }

        // Bloquear edición de novedades ya gestionadas; el estado actúa como candado de escritura
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

        // Usa el valor guardado como fallback para poder validar cuando solo se actualiza un extremo del rango
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
            // Preservar el valor actual si el campo no viene en el body (undefined ≠ null)
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

/**
 * Cambia el estado de una novedad respetando las reglas de transición del flujo de aprobación:
 *   registrada → aprobada_remunera | aprobada_sin_remuneracion | rechazada | anulada
 * Los estados 'anulada' y 'rechazada' son terminales: una vez alcanzados, no se permiten
 * más transiciones para garantizar la integridad del historial y del cálculo de nómina.
 */
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

        // Bloquear transiciones desde estados terminales; rechazadas y anuladas son inmutables
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

/**
 * Elimina físicamente una novedad del sistema.
 * Solo se permite eliminar novedades en estado 'registrada' porque son las únicas
 * que aún no han impactado el cálculo de nómina ni el historial de gestión.
 * Novedades en estados más avanzados deben anularse en lugar de eliminarse.
 */
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
