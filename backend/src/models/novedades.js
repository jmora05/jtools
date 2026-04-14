const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Novedades = sequelize.define('Novedades', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la novedad'
    },

    titulo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    descripcion_detallada: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    estado: {
        type: DataTypes.ENUM('registrada', 'aprobada', 'rechazada'),
        allowNull: false,
        defaultValue: 'registrada',
        validate: {
            isIn: {
                args: [['registrada', 'aprobada', 'rechazada']],
                msg: 'El estado debe ser uno de los valores permitidos'
            }
        }
    },

    fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    
    fecha_finalizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },

    registrado_por: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },


    empleado_responsable: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID del empleado responsable de la novedad (puede ser nulo si aún no se ha asignado)'
    },

    // ← NUEVO
    empleado_afectado: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID del empleado afectado por la novedad (puede ser nulo)'
    }
},
{
    tableName: 'novedades',
    timestamps: false
});


module.exports = Novedades;