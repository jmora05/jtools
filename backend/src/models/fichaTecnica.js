const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const FichaTecnica = sequelize.define('FichaTecnica', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la ficha técnica'
    },

    codigoFicha: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: {
            name: 'unique_codigo_ficha',
            msg: 'Este código de ficha ya existe'
        },
        comment: 'Código único de la ficha (ej: FT-2025-001)'
    },

    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'El producto es obligatorio' },
            isInt: { msg: 'El productoId debe ser un número entero' }
        },
        comment: 'Producto al que pertenece esta ficha técnica'
    },

    estado: {
        type: DataTypes.ENUM('Activa', 'Inactiva'),
        allowNull: false,
        defaultValue: 'Activa',
        comment: 'Estado de la ficha técnica'
    },

    // Materiales, procesos, medidas e insumos se guardan como JSON
    materiales: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Lista de materiales requeridos [{name, quantity, unit}]'
    },

    procesos: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Pasos del proceso de fabricación [{step, description, duration}]'
    },

    medidas: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Medidas y especificaciones [{parameter, value, tolerance}]'
    },

    insumos: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Insumos requeridos [{name, quantity, unit}]'
    },

    notas: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas o instrucciones adicionales'
    }

}, {
    timestamps: true,
    tableName: 'fichas_tecnicas',
    comment: 'Tabla que almacena las fichas técnicas de los productos'
});

module.exports = FichaTecnica;