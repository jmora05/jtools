const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Nomina = sequelize.define('Nomina', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    empleado_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    // Periodo semanal (sábado → viernes)
    fecha_inicio_periodo: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },

    fecha_fin_periodo: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },

    fecha_pago: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Siempre el viernes del periodo'
    },

    dias_trabajados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },

    salario_base: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },

    auxilio_transporte: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },

    // Monto total de horas extras y recargas (suma de los 7 tipos)
    total_horas_extras: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },

    deducciones: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Salud (4%) + Pensión (4%) sobre salario proporcional'
    },

    pago_neto: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },

    estado: {
        type: DataTypes.ENUM('pendiente', 'pagado'),
        allowNull: false,
        defaultValue: 'pendiente',
    },

    // Referencia opcional a novedades de la semana
    novedades_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
},
{
    tableName: 'nomina',
    timestamps: false,
});

module.exports = Nomina;
