const { Nomina, Empleados } = require('../models/index.js');
const { validarNomina } = require('../validators/nominaValidator');

// ── GET /nomina ───────────────────────────────────────────────
const getNominas = async (req, res) => {
    try {
        const nominas = await Nomina.findAll({
            include: [{ model: Empleados, as: 'empleado', attributes: ['id', 'nombres', 'apellidos', 'cargo', 'area'] }],
            order: [['fecha_pago', 'DESC']],
        });
        res.status(200).json(nominas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener nóminas', error: error.message });
    }
};

// ── GET /nomina/:id ───────────────────────────────────────────
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

        const nomina = await Nomina.create({
            empleado_id:          parseInt(empleado_id),
            fecha_inicio_periodo,
            fecha_fin_periodo,
            fecha_pago,
            dias_trabajados:      parseInt(dias_trabajados),
            salario_base:         parseFloat(salario_base),
            auxilio_transporte:   parseFloat(auxilio_transporte ?? 0),
            total_horas_extras:   parseFloat(total_horas_extras ?? 0),
            deducciones:          parseFloat(deducciones ?? 0),
            pago_neto:            parseFloat(pago_neto),
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
const updateNomina = async (req, res) => {
    try {
        const { id } = req.params;
        const nomina = await Nomina.findByPk(id);
        if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });

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

        await nomina.update({
            fecha_inicio_periodo,
            fecha_fin_periodo,
            fecha_pago,
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
const marcarComoPagada = async (req, res) => {
    try {
        const { id } = req.params;
        const nomina = await Nomina.findByPk(id);
        if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });
        if (nomina.estado === 'pagado') return res.status(400).json({ message: 'La nómina ya está marcada como pagada' });

        await nomina.update({ estado: 'pagado' });
        res.status(200).json({ message: 'Nómina marcada como pagada', nomina });
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar como pagada', error: error.message });
    }
};

// ── DELETE /nomina/:id ────────────────────────────────────────
const deleteNomina = async (req, res) => {
    try {
        const { id } = req.params;
        const nomina = await Nomina.findByPk(id);
        if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });
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
