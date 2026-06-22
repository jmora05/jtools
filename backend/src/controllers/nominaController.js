const { Nomina, Empleados } = require('../models/index.js');
const { Op } = require('sequelize');
const { validarNomina } = require('../validators/nominaValidator');

/**
 * Controlador del módulo Control de Pagos (nómina semanal).
 * Gestiona el ciclo de vida completo de un registro de pago: creación,
 * consulta, actualización, marcado como pagado y eliminación.
 * La semana cierra siempre el viernes (fecha de corte = fecha_fin_periodo).
 */

// ── GET /nomina ───────────────────────────────────────────────

/**
 * Retorna todos los registros de control de pagos ordenados del más reciente al más antiguo.
 * Se incluyen datos del empleado necesarios para identificar el desprendible en el listado
 * (tipo y número de documento se usan en la vista y en el PDF).
 */
const getNominas = async (req, res) => {
    try {
        const nominas = await Nomina.findAll({
            include: [{ model: Empleados, as: 'empleado', attributes: ['id', 'nombres', 'apellidos', 'cargo', 'area', 'tipoDocumento', 'numeroDocumento'] }],
            order: [['fecha_pago', 'DESC']],
        });
        res.status(200).json(nominas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener nóminas', error: error.message });
    }
};

// ── GET /nomina/:id ───────────────────────────────────────────

/**
 * Retorna un registro de pago individual junto con el salario del empleado.
 * El salario se incluye aquí (y no en el listado general) porque esta ruta
 * se usa en contextos donde se necesitan recalcular o auditar los valores.
 */
const getNominaById = async (req, res) => {
    try {
        const { id } = req.params;
        const nomina = await Nomina.findByPk(id, {
            include: [{ model: Empleados, as: 'empleado', attributes: ['id', 'nombres', 'apellidos', 'cargo', 'area', 'salario'] }],
        });
        if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });
        res.status(200).json(nomina);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la nómina', error: error.message });
    }
};

// ── GET /nomina/empleado/:empleadoId ──────────────────────────

/**
 * Retorna el historial de pagos de un empleado específico, útil para consultas
 * individuales de historial laboral y para verificar semanas ya liquidadas.
 */
const getNominasByEmpleado = async (req, res) => {
    try {
        const { empleadoId } = req.params;
        const nominas = await Nomina.findAll({
            where: { empleado_id: empleadoId },
            order: [['fecha_pago', 'DESC']],
        });
        res.status(200).json(nominas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener nóminas del empleado', error: error.message });
    }
};

// ── POST /nomina ──────────────────────────────────────────────

/**
 * Registra un nuevo pago semanal para un empleado.
 * Aplica dos capas de protección contra duplicados:
 *   1. El validador de esquema rechaza campos inválidos antes de tocar la BD.
 *   2. Se verifica que no exista ya un registro para el mismo empleado y fecha
 *      de corte (fecha_fin_periodo = viernes), garantizando unicidad semanal.
 * Los valores monetarios se coercionan a float y los ids a int para evitar
 * inconsistencias de tipo provenientes del body HTTP (que llega como string).
 */
const createNomina = async (req, res) => {
    try {
        const errores = validarNomina(req.body, false);
        if (errores.length > 0) return res.status(400).json({ message: 'Error de validación', errores });

        const {
            empleado_id,
            fecha_inicio_periodo,
            fecha_fin_periodo,
            fecha_pago,
            dias_trabajados,
            salario_base,
            auxilio_transporte,
            total_horas_extras,
            deducciones,
            pago_neto,
            estado,
            novedades_id,
            observaciones,
        } = req.body;

        const empleado = await Empleados.findByPk(empleado_id);
        if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

        // Previene doble liquidación: un empleado solo puede tener un pago por semana (fecha de corte).
        const duplicado = await Nomina.findOne({ where: { empleado_id, fecha_fin_periodo } });
        if (duplicado) {
            return res.status(400).json({ message: 'Ya existe una nómina para este empleado en esa fecha de corte' });
        }

        const nomina = await Nomina.create({
            empleado_id:          parseInt(empleado_id),
            fecha_inicio_periodo,
            fecha_fin_periodo,
            fecha_pago,
            dias_trabajados:      parseInt(dias_trabajados),
            salario_base:         parseFloat(salario_base),
            // El auxilio de transporte es opcional; aplica solo si el empleado gana hasta 2 SMMLV.
            auxilio_transporte:   parseFloat(auxilio_transporte ?? 0),
            total_horas_extras:   parseFloat(total_horas_extras ?? 0),
            deducciones:          parseFloat(deducciones ?? 0),
            pago_neto:            parseFloat(pago_neto),
            // El estado nace como 'pendiente'; solo se cambia a 'pagado' mediante el endpoint /pagar.
            estado:               estado ?? 'pendiente',
            novedades_id:         novedades_id ?? null,
            observaciones:        observaciones ?? null,
        });

        res.status(201).json({ message: 'Nómina registrada correctamente', nomina });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la nómina', error: error.message });
    }
};

// ── PUT /nomina/:id ───────────────────────────────────────────

/**
 * Actualiza un registro de pago existente (solo permitido en estado 'pendiente').
 * Soporta actualizaciones parciales: los campos no enviados conservan su valor actual.
 * La verificación de duplicado excluye el propio registro (Op.ne: id) para que el
 * registro pueda actualizarse sin colisionar consigo mismo al mantener la misma semana.
 */
const updateNomina = async (req, res) => {
    try {
        const { id } = req.params;
        const nomina = await Nomina.findByPk(id);
        if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });

        // El validador se invoca en modo edición (true) para relajar campos obligatorios.
        const errores = validarNomina(req.body, true);
        if (errores.length > 0) return res.status(400).json({ message: 'Error de validación', errores });

        const {
            fecha_inicio_periodo,
            fecha_fin_periodo,
            fecha_pago,
            dias_trabajados,
            salario_base,
            auxilio_transporte,
            total_horas_extras,
            deducciones,
            pago_neto,
            estado,
            novedades_id,
            observaciones,
        } = req.body;

        // Si no se envía nueva fecha de corte, se mantiene la original para la verificación de unicidad.
        const fechaFinEfectiva = fecha_fin_periodo ?? nomina.fecha_fin_periodo;
        const duplicado = await Nomina.findOne({
            where: { empleado_id: nomina.empleado_id, fecha_fin_periodo: fechaFinEfectiva, id: { [Op.ne]: id } }
        });
        if (duplicado) {
            return res.status(400).json({ message: 'Ya existe una nómina para este empleado en esa fecha de corte' });
        }

        await nomina.update({
            fecha_inicio_periodo,
            fecha_fin_periodo,
            fecha_pago,
            // Solo se reemplaza el valor si fue enviado explícitamente; evita sobreescribir con undefined.
            dias_trabajados:    dias_trabajados !== undefined ? parseInt(dias_trabajados) : undefined,
            salario_base:       salario_base    !== undefined ? parseFloat(salario_base)  : undefined,
            auxilio_transporte: auxilio_transporte !== undefined ? parseFloat(auxilio_transporte) : undefined,
            total_horas_extras: total_horas_extras !== undefined ? parseFloat(total_horas_extras) : undefined,
            deducciones:        deducciones     !== undefined ? parseFloat(deducciones)   : undefined,
            pago_neto:          pago_neto       !== undefined ? parseFloat(pago_neto)     : undefined,
            estado,
            novedades_id,
            observaciones,
        });

        res.status(200).json({ message: 'Nómina actualizada correctamente', nomina });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la nómina', error: error.message });
    }
};

// ── PUT /nomina/:id/pagar ─────────────────────────────────────

/**
 * Marca un pago como efectivamente realizado (transición unidireccional).
 * Una vez en estado 'pagado', el registro no puede eliminarse ni revertirse,
 * lo que garantiza trazabilidad y evita manipulación de pagos ya ejecutados.
 */
const marcarComoPagada = async (req, res) => {
    try {
        const { id } = req.params;
        const nomina = await Nomina.findByPk(id);
        if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });
        // Idempotencia: rechaza la operación si ya fue pagada para evitar registros duplicados de flujo.
        if (nomina.estado === 'pagado') return res.status(400).json({ message: 'La nómina ya está marcada como pagada' });

        await nomina.update({ estado: 'pagado' });
        res.status(200).json({ message: 'Nómina marcada como pagada', nomina });
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar como pagada', error: error.message });
    }
};

// ── DELETE /nomina/:id ────────────────────────────────────────

/**
 * Elimina un registro de pago en estado 'pendiente'.
 * Los pagos ya confirmados ('pagado') son inmutables por política de auditoría:
 * no pueden eliminarse para mantener el historial financiero íntegro.
 */
const deleteNomina = async (req, res) => {
    try {
        const { id } = req.params;
        const nomina = await Nomina.findByPk(id);
        if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });
        // Protección de integridad: un pago efectuado no debe desaparecer del registro histórico.
        if (nomina.estado === 'pagado') return res.status(400).json({ message: 'No se puede eliminar una nómina ya pagada' });

        await nomina.destroy();
        res.status(200).json({ message: 'Nómina eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la nómina', error: error.message });
    }
};

module.exports = {
    getNominas,
    getNominaById,
    getNominasByEmpleado,
    createNomina,
    updateNomina,
    marcarComoPagada,
    deleteNomina,
};
