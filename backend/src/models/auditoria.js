const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Auditoria = sequelize.define('auditoria', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'FK al usuario que realizó la acción (null si fue el sistema)',
    },
    accion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'ASIGNAR_PERMISOS | MODIFICAR_PERMISOS | CAMBIAR_ROL | ACCESO_NO_AUTORIZADO | CREAR_ROL | ELIMINAR_ROL | TOGGLE_ROL',
    },
    entidad: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: 'Nombre del recurso afectado: Rol, Usuario, Permiso, moduleKey',
    },
    entidadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'ID del recurso afectado',
    },
    detalle: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Datos adicionales del evento en formato JSON',
    },
    ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'auditoria',
    timestamps: true,
    updatedAt: false,
});

module.exports = Auditoria;
