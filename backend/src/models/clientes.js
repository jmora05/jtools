const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Clientes = sequelize.define('Clientes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identificador único del cliente'
  },

  razon_social: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      name: 'unique_client_name',
      msg: 'Este nombre de cliente ya existe'
    },
    validate: {
      notEmpty: { msg: 'El nombre del cliente no puede estar vacío' },
      len: { args: [2, 70], msg: 'El nombre debe tener entre 2 y 70 caracteres' }
    }
  },

  tipo_documento: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: {
        args: [['cedula', 'nit', 'cedula de extranjeria', 'pasaporte', 'rut']],
        msg: 'Tipo de documento no válido'
      },
      notEmpty: { msg: 'El tipo de documento del cliente no puede estar vacío' }
    }
  },

  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: null,
    validate: {
      notEmpty: { msg: 'El número de documento del cliente no puede estar vacío' }
    }
  },

  direccion: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
    validate: {
      len: { args: [0, 100], msg: 'La dirección debe tener máximo 100 caracteres' }
    }
  },

  ciudad: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: null,
    validate: {
      len: { args: [0, 50], msg: 'La ciudad debe tener máximo 50 caracteres' }
    }
  },

  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: null,
    validate: {
      len: { args: [0, 20], msg: 'El teléfono debe tener máximo 20 caracteres' }
    }
  },

  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: null,
    validate: {
      notEmpty: { msg: 'El email no puede estar vacío' },
      isEmail: { msg: 'El email no tiene un formato válido' },
      contieneArroba(value) {
        if (!value.includes('@')) {
          throw new Error('El email debe contener el símbolo @');
        }
      },
      len: { args: [0, 50], msg: 'El email debe tener máximo 50 caracteres' }
    }
  },

  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    allowNull: false,
    defaultValue: 'activo'
  },

  foto: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  nombres: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: null,
    validate: {
      notEmpty: { msg: 'El nombre del cliente no puede estar vacío' },
      len: { args: [2, 50], msg: 'El nombre debe tener entre 2 y 50 caracteres' }
    }
  },

  apellidos: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: null,
    validate: {
      notEmpty: { msg: 'El apellido del cliente no puede estar vacío' },
      len: { args: [2, 50], msg: 'El apellido debe tener entre 2 y 50 caracteres' }
    }
  }

}, {
  tableName: 'clientes',
  timestamps: true
});



module.exports = Clientes;