const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

// ─── Regex reutilizables ──────────────────────────────────────────────────────
const SOLO_TEXTO       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]+$/;
const SOLO_DESCRIPCION = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]+$/;

const CategoriaProductos = sequelize.define('CategoriaProductos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    nombreCategoria: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'unique_category_name',
            msg: 'Este nombre de categoría ya existe.',
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoría no puede estar vacío.',
            },
            len: {
                args: [2, 50],
                msg: 'El nombre debe tener entre 2 y 50 caracteres.',
            },
            sinCaracteresEspeciales(value) {
                if (!SOLO_TEXTO.test(value)) {
                    throw new Error(
                        'El nombre no puede contener caracteres especiales como $, %, @, #, &, *, etc.'
                    );
                }
            },
        },
    },

    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: {
                args: [0, 255],
                msg: 'La descripción no puede exceder 255 caracteres.',
            },
            sinCaracteresEspeciales(value) {
                if (value && !SOLO_DESCRIPCION.test(value)) {
                    throw new Error(
                        'La descripción contiene caracteres no permitidos (como $, %, @, #, &, *, etc.).'
                    );
                }
            },
        },
    },

    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
        validate: {
            isIn: {
                args: [['activo', 'inactivo']],
                msg: 'El estado solo puede ser "activo" o "inactivo".',
            },
        },
    },
}, {
    tableName: 'categoriaProductos',
    timestamps: false,
});

module.exports = CategoriaProductos;