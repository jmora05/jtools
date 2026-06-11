const jwt = require('jsonwebtoken');

// ── verifyToken ───────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // { id, email, rolesId, userType, rolName }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

// ── requireAdmin ──────────────────────────────────────────────────────────────
// Bloquea usuarios con userType === 'client'. Debe usarse DESPUÉS de verifyToken.
const requireAdmin = (req, res, next) => {
    const userType = (req.usuario?.userType || '').toLowerCase();
    if (userType === 'client') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: se requiere perfil administrador',
        });
    }
    next();
};

// ── requirePermiso ────────────────────────────────────────────────────────────
// Verifica que el rol del usuario tenga asignado el permiso con el moduleKey dado.
// El rol 'Administrador' (isSystem) siempre tiene acceso total sin query adicional.
// Debe usarse DESPUÉS de verifyToken y requireAdmin.
const requirePermiso = (moduleKey) => async (req, res, next) => {
    try {
        // El Administrador del sistema nunca se bloquea
        if (req.usuario?.rolName === 'Administrador') return next();

        const { RolPermiso, Permisos } = require('../models');

        const tiene = await RolPermiso.findOne({
            where: { rolesId: req.usuario.rolesId },
            include: [{
                model: Permisos,
                where: { moduleKey, isActive: true },
                required: true,
            }],
        });

        if (!tiene) {
            // Registrar intento de acceso no autorizado de forma asíncrona
            setImmediate(async () => {
                try {
                    const { registrar } = require('../services/auditoriaService');
                    await registrar({
                        usuarioId: req.usuario?.id,
                        accion:    'ACCESO_NO_AUTORIZADO',
                        entidad:   moduleKey,
                        detalle:   { method: req.method, path: req.path, rolName: req.usuario?.rolName },
                        ip:        req.ip,
                    });
                } catch (_) {}
            });

            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para realizar esta acción.',
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { verifyToken, requireAdmin, requirePermiso };
