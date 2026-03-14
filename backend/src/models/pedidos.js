const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Pedidos = sequelize.define('Pedidos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del pedido'
    },

    clienteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'El cliente es obligatorio' },
            isInt: { msg: 'El cliente_id debe ser un número entero' }
        }
    },

    fecha_pedido: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
            notNull: { msg: 'La fecha del pedido es obligatoria' },
            isDate: { msg: 'La fecha del pedido debe ser una fecha válida' }
        }
    },

    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notNull: { msg: 'El total es obligatorio' },
            isDecimal: { msg: 'El total debe ser un número válido' },
            min: {
                args: [0],
                msg: 'El total no puede ser negativo'
            }
        }
    },

    direccion: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La dirección no puede estar vacía' },
            len: {
                args: [5, 150],
                msg: 'La dirección debe tener entre 5 y 150 caracteres'
            }
        }
    },

    ciudad: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La ciudad no puede estar vacía' },
            len: {
                args: [2, 100],
                msg: 'La ciudad debe tener entre 2 y 100 caracteres'
            }
        }
    },

    instrucciones_entrega: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 500],
                msg: 'Las instrucciones no pueden superar 500 caracteres'
            }
        }
    },

    notas_observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 500],
                msg: 'Las notas no pueden superar 500 caracteres'
            }
        }
    }

}, {
    tableName: 'pedidos',
    timestamps: true
});



module.exports = Pedidos;