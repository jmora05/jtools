const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const TIPOS_VALIDOS = [
  'Recargo Nocturno',
  'Recargo Diurno Dominical',
  'Recargo Nocturno Dominical',
  'Hora Extra Diurna',
  'Hora Extra Nocturna',
  'Hora Extra Diurna Dominical/Festiva',
];

const HorasExtra = sequelize.define('HorasExtra', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empleadoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'empleados', key: 'id' },
  },
  tipo: {
    type: DataTypes.ENUM(...TIPOS_VALIDOS),
    allowNull: false,
    validate: {
      isIn: { args: [TIPOS_VALIDOS], msg: 'Tipo de recargo no válido' },
    },
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  horas: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    validate: {
      min: { args: [0.5], msg: 'Las horas deben ser al menos 0.5' },
      max: { args: [24],  msg: 'Las horas no pueden superar 24' },
    },
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('registrada', 'aprobada', 'rechazada'),
    allowNull: false,
    defaultValue: 'registrada',
  },
}, {
  tableName: 'horas_extra',
  timestamps: true,
});

module.exports = HorasExtra;
