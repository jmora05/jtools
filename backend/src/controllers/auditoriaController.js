const { Auditoria, Usuarios } = require('../models');

// GET /api/auditoria — devuelve el historial paginado
const getAuditoria = async (req, res) => {
    try {
        const page   = Math.max(1, Number(req.query.page  ?? 1));
        const limit  = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
        const offset = (page - 1) * limit;
        const accion = req.query.accion || null; // filtro opcional por tipo de acción

        const where = accion ? { accion } : {};

        const { count, rows } = await Auditoria.findAndCountAll({
            where,
            include: [{
                model:      Usuarios,
                as:         'usuario',
                attributes: ['id', 'email'],
                required:   false,
            }],
            order:  [['createdAt', 'DESC']],
            limit,
            offset,
        });

        return res.status(200).json({
            total:      count,
            page,
            totalPages: Math.ceil(count / limit),
            data:       rows,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Error al obtener auditoría', error: err.message });
    }
};

module.exports = { getAuditoria };
