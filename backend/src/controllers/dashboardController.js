const { Op } = require('sequelize');
const { sequelize } = require('../config/jtools_db');
const {
    Productos,
    Ventas,
    DetalleVentas,
    Clientes,
    Compras,
    OrdenesProduccion,
} = require('../models/index.js');

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function pct(actual, anterior) {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

function buildMonthRange(meses) {
    const hoy = new Date();
    const result = [];
    for (let i = meses - 1; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        result.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
}

// ── GET /api/dashboard/stats ───────────────────────────────────────────────────
const getDashboardStats = async (_req, res) => {
    try {
        const hoy = new Date();
        const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
        const finDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const inicioMesAnterior  = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finMesAnterior     = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
        const inicioSeisMeses    = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        const inicioSeisMesesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 12, 1);
        const finSeisMesesAnt    = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 0, 23, 59, 59);
        const inicioAnio         = new Date(hoy.getFullYear(), 0, 1);
        const inicioAnioAnt      = new Date(hoy.getFullYear() - 1, 0, 1);
        const finAnioAnt         = new Date(hoy.getFullYear() - 1, 11, 31, 23, 59, 59);

        const totalProducts = await Productos.count({ where: { estado: 'activo' } }).catch(() => 0);

        const ventasHoy = await Ventas.findAll({
            where: { fecha: { [Op.between]: [inicioDia, finDia] } },
            attributes: ['total'],
        }).catch(() => []);
        const dailySalesAmount = ventasHoy.reduce((s, v) => s + Number(v.total || 0), 0);
        const dailyOrders = ventasHoy.length;

        const calcTotal = async (desde, hasta) => {
            const rows = await Ventas.findAll({
                where: { fecha: { [Op.between]: [desde, hasta] } },
                attributes: ['total'],
            }).catch(() => []);
            return rows.reduce((s, v) => s + Number(v.total || 0), 0);
        };

        const [ventasMesActual, ventasMesAnterior, ventasSeisMeses, ventasSeisMesesAnt, ventasAnio, ventasAnioAnt] =
            await Promise.all([
                calcTotal(inicioMes, hoy),
                calcTotal(inicioMesAnterior, finMesAnterior),
                calcTotal(inicioSeisMeses, hoy),
                calcTotal(inicioSeisMesesAnt, finSeisMesesAnt),
                calcTotal(inicioAnio, hoy),
                calcTotal(inicioAnioAnt, finAnioAnt),
            ]);

        const salesGrowth = {
            month:     pct(ventasMesActual, ventasMesAnterior),
            sixMonths: pct(ventasSeisMeses, ventasSeisMesesAnt),
            year:      pct(ventasAnio, ventasAnioAnt),
        };

        let topClients = [];
        try {
            const ventasMes = await Ventas.findAll({
                where: { fecha: { [Op.between]: [inicioMes, hoy] } },
                include: [{ model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'razon_social'] }],
                attributes: ['clientesId', 'total'],
            });
            const clientMap = {};
            for (const v of ventasMes) {
                const cid = v.clientesId;
                if (!cid) continue;
                if (!clientMap[cid]) {
                    const c = v.cliente;
                    const name = c
                        ? (c.nombres && c.nombres !== 'N/A'
                            ? `${c.nombres} ${c.apellidos || ''}`.trim()
                            : c.razon_social || `Cliente ${cid}`)
                        : `Cliente ${cid}`;
                    clientMap[cid] = { id: cid, name, purchases: 0, amount: 0 };
                }
                clientMap[cid].purchases += 1;
                clientMap[cid].amount    += Number(v.total || 0);
            }
            topClients = Object.values(clientMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
        } catch (_) {}

        let lowStockProducts = [];
        try {
            const productos = await Productos.findAll({
                where: { estado: 'activo', stock: { [Op.lt]: 10 } },
                attributes: ['id', 'nombreProducto', 'stock', 'referencia'],
                order: [['stock', 'ASC']],
                limit: 20,
            });
            lowStockProducts = productos.map(p => ({
                id: p.id, name: p.nombreProducto, stock: p.stock, code: p.referencia || `P-${p.id}`,
            }));
        } catch (_) {}

        return res.status(200).json({ totalProducts, dailySalesAmount, dailyOrders, topClients, salesGrowth, lowStockProducts });
    } catch (error) {
        console.error('Error en getDashboardStats:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

// ── GET /api/dashboard/ventas-mensuales?meses=6 ────────────────────────────────
const getVentasMensuales = async (req, res) => {
    try {
        const meses = Math.min(Math.max(Number(req.query.meses) || 6, 1), 24);
        const hoy   = new Date();
        const desde = new Date(hoy.getFullYear(), hoy.getMonth() - meses + 1, 1);

        const ventas = await Ventas.findAll({
            where: { fecha: { [Op.gte]: desde } },
            attributes: ['fecha', 'total'],
            raw: true,
        }).catch(() => []);

        const rango = buildMonthRange(meses);
        const labels = rango.map(({ month }) => MESES[month]);
        const data   = rango.map(({ year, month }) =>
            ventas
                .filter(v => { const d = new Date(v.fecha); return d.getFullYear() === year && d.getMonth() === month; })
                .reduce((s, v) => s + Number(v.total || 0), 0)
        );

        const total   = data.reduce((s, v) => s + v, 0);
        const promedio = data.length ? Math.round(total / data.length) : 0;
        const maxIdx  = data.indexOf(Math.max(...data, 0));
        const crecimiento = data.length >= 2 && data[data.length - 2] !== 0
            ? pct(data[data.length - 1], data[data.length - 2])
            : 0;

        return res.status(200).json({
            labels,
            data,
            stats: { total, promedio, mes_pico: labels[maxIdx] ?? '', crecimiento },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener ventas mensuales', error: error.message });
    }
};

// ── GET /api/dashboard/compras-mensuales?meses=6 ───────────────────────────────
const getComprasMensuales = async (req, res) => {
    try {
        const meses = Math.min(Math.max(Number(req.query.meses) || 6, 1), 24);
        const hoy   = new Date();
        const desde = new Date(hoy.getFullYear(), hoy.getMonth() - meses + 1, 1);

        const rows = await sequelize.query(
            `SELECT DATE_TRUNC('month', c.fecha) AS mes,
                    COALESCE(SUM(d.cantidad * d."precioUnitario"), 0) AS total
             FROM compras c
             LEFT JOIN "detalleCompraInsumo" d ON d."comprasId" = c.id
             WHERE c.fecha >= :desde
             GROUP BY DATE_TRUNC('month', c.fecha)
             ORDER BY mes ASC`,
            { replacements: { desde }, type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);

        const rango = buildMonthRange(meses);
        const labels = rango.map(({ month }) => MESES[month]);
        const data   = rango.map(({ year, month }) => {
            const r = rows.find(row => {
                const d = new Date(row.mes);
                return d.getFullYear() === year && d.getMonth() === month;
            });
            return r ? Number(r.total) : 0;
        });

        const total    = data.reduce((s, v) => s + v, 0);
        const promedio = data.length ? Math.round(total / data.length) : 0;
        const maxIdx   = data.indexOf(Math.max(...data, 0));
        const variacion = data.length >= 2 && data[data.length - 2] !== 0
            ? pct(data[data.length - 1], data[data.length - 2])
            : 0;

        return res.status(200).json({
            labels,
            data,
            stats: { total, promedio, mes_pico: labels[maxIdx] ?? '', variacion },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener compras mensuales', error: error.message });
    }
};

// ── GET /api/dashboard/ventas-periodo-grafica?desde=YYYY-MM&hasta=YYYY-MM ──────
const getVentasPeriodoGrafica = async (req, res) => {
    try {
        const hoy = new Date();
        let desde, hasta;

        if (req.query.desde && req.query.hasta) {
            const [dy, dm] = req.query.desde.split('-').map(Number);
            const [hy, hm] = req.query.hasta.split('-').map(Number);
            desde = new Date(dy, dm - 1, 1);
            hasta = new Date(hy, hm, 0, 23, 59, 59);
        } else {
            desde = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
            hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
        }

        const ventas = await Ventas.findAll({
            where: { fecha: { [Op.between]: [desde, hasta] } },
            attributes: ['fecha', 'total'],
            raw: true,
        }).catch(() => []);

        const months = [];
        let cur = new Date(desde.getFullYear(), desde.getMonth(), 1);
        while (cur <= hasta) {
            months.push({ year: cur.getFullYear(), month: cur.getMonth() });
            cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }

        const labels = months.map(({ month }) => MESES_LARGO[month]);
        const data   = months.map(({ year, month }) =>
            ventas
                .filter(v => { const d = new Date(v.fecha); return d.getFullYear() === year && d.getMonth() === month; })
                .reduce((s, v) => s + Number(v.total || 0), 0)
        );
        const variaciones = data.map((val, i) =>
            i === 0 ? 0 : data[i - 1] === 0 ? 0 : pct(val, data[i - 1])
        );

        return res.status(200).json({ labels, data, variaciones });
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener ventas del período', error: error.message });
    }
};

// ── GET /api/dashboard/producto-mas-vendido ────────────────────────────────────
const getProductoMasVendido = async (_req, res) => {
    try {
        const hoy = new Date();
        const inicioMes    = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const inicioMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finMesAnt    = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);

        const top = await sequelize.query(
            `SELECT dv."productosId", SUM(dv.cantidad) AS total_vendido,
                    p."nombreProducto", p.stock
             FROM "detalleVentas" dv
             JOIN ventas v   ON v.id  = dv."ventasId"
             JOIN productos p ON p.id = dv."productosId"
             WHERE v.fecha >= :desde
             GROUP BY dv."productosId", p."nombreProducto", p.stock
             ORDER BY total_vendido DESC
             LIMIT 1`,
            { replacements: { desde: inicioMes }, type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);

        if (!top.length) {
            return res.status(200).json({ nombre: 'Sin datos', cantidad: 0, variacion: 0, stock: 0, unidad: 'Unidades' });
        }

        const { productosId, total_vendido, nombreProducto, stock } = top[0];

        const antRow = await sequelize.query(
            `SELECT COALESCE(SUM(dv.cantidad), 0) AS cantidad
             FROM "detalleVentas" dv
             JOIN ventas v ON v.id = dv."ventasId"
             WHERE dv."productosId" = :pid AND v.fecha BETWEEN :desde AND :hasta`,
            { replacements: { pid: productosId, desde: inicioMesAnt, hasta: finMesAnt }, type: sequelize.QueryTypes.SELECT }
        ).catch(() => [{ cantidad: 0 }]);

        const cantAnt  = Number(antRow[0]?.cantidad || 0);
        const cantActual = Number(total_vendido);
        const variacion = pct(cantActual, cantAnt);

        return res.status(200).json({
            nombre: nombreProducto,
            cantidad: cantActual,
            variacion,
            stock: Number(stock),
            unidad: 'Unidades',
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener producto más vendido', error: error.message });
    }
};

// ── GET /api/dashboard/produccion-resumen ─────────────────────────────────────
const getProduccionResumen = async (_req, res) => {
    try {
        const hoy       = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const inicioAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finAnt    = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);

        const [total, activas, finalizadas, mesActual, mesAnterior] = await Promise.all([
            OrdenesProduccion.count().catch(() => 0),
            OrdenesProduccion.count({ where: { estado: { [Op.in]: ['Pendiente', 'En Proceso', 'Pausada'] } } }).catch(() => 0),
            OrdenesProduccion.count({ where: { estado: 'Finalizada' } }).catch(() => 0),
            OrdenesProduccion.count({ where: { createdAt: { [Op.gte]: inicioMes } } }).catch(() => 0),
            OrdenesProduccion.count({ where: { createdAt: { [Op.between]: [inicioAnt, finAnt] } } }).catch(() => 0),
        ]);

        const porcentaje = total === 0 ? 0 : Math.round((finalizadas / total) * 100);
        const variacion  = pct(mesActual, mesAnterior);

        return res.status(200).json({ total, activas, finalizadas, porcentaje, variacion });
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener resumen de producción', error: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getVentasMensuales,
    getComprasMensuales,
    getVentasPeriodoGrafica,
    getProductoMasVendido,
    getProduccionResumen,
};
