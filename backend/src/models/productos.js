// src/models/Productos.js  (o donde esté actualmente)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

// ─── Regex reutilizables ──────────────────────────────────────────────────────
const SOLO_TEXTO       = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,()]+$/;
const SOLO_REFERENCIA  = /^[a-zA-Z0-9\-_./]+$/;
const SOLO_DESCRIPCION = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,();:'"!?/]+$/;

// ─── Extensiones de imagen permitidas ────────────────────────────────────────
const EXTENSIONES_IMAGEN  = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const MSG_IMAGEN_INVALIDA = 'Solo se permiten links directos de imágenes válidas (.png, .jpg, .jpeg, .webp...) o imágenes en base64.';

const Productos = sequelize.define(
    'Productos',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Identificador único del producto',
        },

        nombreProducto: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: {
                name: 'unique_product_name',
                msg: 'Este nombre de producto ya existe.',
            },
            validate: {
                notEmpty: { msg: 'El nombre del producto no puede estar vacío.' },
                len: { args: [2, 100], msg: 'El nombre del producto debe tener entre 2 y 100 caracteres.' },
                sinCaracteresEspeciales(value) {
                    if (!SOLO_TEXTO.test(value)) {
                        throw new Error('El nombre no puede contener caracteres especiales como $, %, @, #, &, *, etc.');
                    }
                },
            },
        },

        referencia: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: {
                name: 'unique_product_reference',
                msg: 'Esta referencia de producto ya existe.',
            },
            validate: {
                notEmpty: { msg: 'La referencia del producto no puede estar vacía.' },
                len: { args: [2, 50], msg: 'La referencia debe tener entre 2 y 50 caracteres.' },
                formatoReferencia(value) {
                    if (!SOLO_REFERENCIA.test(value)) {
                        throw new Error('La referencia solo puede contener letras, números, guiones (-), guión bajo (_), punto (.) y barra (/).');
                    }
                },
            },
        },

        categoriaProductoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'ID de la categoría a la que pertenece el producto',
            validate: {
                notNull: { msg: 'La categoría es obligatoria.' },
                isInt:   { msg: 'El ID de categoría debe ser un número entero.' },
                min: { args: [1], msg: 'El ID de categoría debe ser mayor a 0.' },
            },
        },

        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
            validate: {
                len: { args: [0, 255], msg: 'La descripción no puede superar los 255 caracteres.' },
                sinCaracteresEspeciales(value) {
                    if (value && !SOLO_DESCRIPCION.test(value)) {
                        throw new Error('La descripción contiene caracteres no permitidos (como $, %, @, #, &, *, etc.).');
                    }
                },
            },
        },

        precio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                notNull:   { msg: 'El precio es obligatorio.' },
                isDecimal: { msg: 'El precio debe ser un número válido.' },
                min: { args: [0.01],         msg: 'El precio debe ser mayor a 0.' },
                max: { args: [999999999.99], msg: 'El precio supera el valor máximo permitido.' },
            },
        },

        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                notNull: { msg: 'El stock es obligatorio.' },
                isInt:   { msg: 'El stock debe ser un número entero válido.' },
                min: { args: [0],      msg: 'El stock no puede ser negativo.' },
                max: { args: [999999], msg: 'El stock no puede superar 999,999 unidades.' },
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

        imagenUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
            validate: {
                /**
                 * Acepta:
                 *   a) data URL base64  →  data:image/png;base64,...
                 *   b) URL HTTP/HTTPS con extensión de imagen en la ruta
                 *
                 * Rechaza:
                 *   - https://google.com
                 *   - https://flamingo.com
                 *   - strings aleatorios
                 */
                esUrlValida(value) {
                    if (!value) return;

                    // a) Data URL base64 — generada por subida desde PC
                    if (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(value)) return;

                    // b) URL HTTP/HTTPS
                    let url;
                    try {
                        url = new URL(value);
                    } catch {
                        throw new Error(MSG_IMAGEN_INVALIDA);
                    }

                    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                        throw new Error(MSG_IMAGEN_INVALIDA);
                    }

                    // La ruta debe terminar en extensión de imagen
                    const pathname = url.pathname.toLowerCase().split('?')[0];
                    if (!EXTENSIONES_IMAGEN.some(ext => pathname.endsWith(ext))) {
                        throw new Error(MSG_IMAGEN_INVALIDA);
                    }
                },
            },
        },
    },
    {
        tableName: 'productos',
        timestamps: false,
    }
);

// RELACIONES (definidas en models/index.js)
module.exports = Productos;