const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/jtools_db');
const {
    Productos,
    Ventas,
    DetalleVentas,
    Clientes,
} = require('../models/index.js');

/**
 * GET /api/dashboard/stats
 * Devuelve todas las métricas del dashboard en una sola llamada.
 * Requiere autenticación (verifyToken aplicado en index.js).
 */
const getDashboardStats = async (_req, res) => {
    try {
        const hoy = new Date();
        const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
        const finDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

        // Inicio del mes actual
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        // Inicio del mes anterior
        const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finMesAnterior    = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);

        // Inicio hace 6 meses
        const inicioSeisMeses = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        const inicioSeisMesesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 12, 1);
        const finSeisMesesAnterior    = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 0, 23, 59, 59);

        // Inicio del año actual
        const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
        const inicioAnioAnterior = new Date(hoy.getFullYear() - 1, 0, 1);
        const finAnioAnterior    = new Date(hoy.getFullYear() - 1, 11, 31, 23, 59, 59);

        // ── Total de productos activos ──────────────────────────────────────
        const totalProducts = await Productos.count({
            where: { estado: 'activo' },
        }).catch(() => 0);

        // ── Ventas del día ──────────────────────────────────────────────────
        const ventasHoy = await Ventas.findAll({
            where: { fecha: { [Op.between]: [inicioDia, finDia] } },
            attributes: ['total'],
        }).catch(() => []);
        const dailySalesAmount = ventasHoy.reduce((sum, v) => sum + Number(v.total || 0), 0);

        // ── Pedidos del día (ventas del día) ────────────────────────────────
        const dailyOrders = ventasHoy.length;

        // ── Crecimiento de ventas ───────────────────────────────────────────
        const calcTotal = async (desde, hasta) => {
            const rows = await Ventas.findAll({
                where: { fecha: { [Op.between]: [desde, hasta] } },
                attributes: ['total'],
            }).catch(() => []);
            return rows.reduce((sum, v) => sum + Number(v.total || 0), 0);
        };

        const calcGrowth = (actual, anterior) => {
            if (anterior === 0) return actual > 0 ? 100 : 0;
            return ((actual - anterior) / anterior) * 100;
        };

        const [
            ventasMesActual, ventasMesAnterior,
            ventasSeisMeses, ventasSeisMesesAnt,
            ventasAnio,      ventasAnioAnt,
        ] = await Promise.all([
            calcTotal(inicioMes,            hoy),
            calcTotal(inicioMesAnterior,    finMesAnterior),
            calcTotal(inicioSeisMeses,      hoy),
            calcTotal(inicioSeisMesesAnterior, finSeisMesesAnterior),
            calcTotal(inicioAnio,           hoy),
            calcTotal(inicioAnioAnterior,   finAnioAnterior),
        ]);

        const salesGrowth = {
            month:     calcGrowth(ventasMesActual,   ventasMesAnterior),
            sixMonths: calcGrowth(ventasSeisMeses,   ventasSeisMesesAnt),
            year:      calcGrowth(ventasAnio,        ventasAnioAnt),
        };

        // ── Top clientes del mes ────────────────────────────────────────────
        let topClients = [];
        try {
            const ventasMes = await Ventas.findAll({
                where: { fecha: { [Op.between]: [inicioMes, hoy] } },
                include: [{ model: Clientes, as: 'cliente', attributes: ['id', 'nombres', 'apellidos', 'razon_social'] }],
                attributes: ['clientesId', 'total'],
            });

            // Agrupar por cliente
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

            topClients = Object.values(clientMap)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5);
        } catch (_) { /* si falla, devuelve array vacío */ }

        // ── Productos con stock bajo (<10 unidades) ─────────────────────────
        let lowStockProducts = [];
        try {
            const productos = await Productos.findAll({
                where: {
                    estado: 'activo',
                    stock: { [Op.lt]: 10 },
                },
                attributes: ['id', 'nombreProducto', 'stock', 'referencia'],
                order: [['stock', 'ASC']],
                limit: 20,
            });
            lowStockProducts = productos.map((p) => ({
                id:    p.id,
                name:  p.nombreProducto,
                stock: p.stock,
                code:  p.referencia || `P-${p.id}`,
            }));
        } catch (_) { /* si falla, devuelve array vacío */ }

        return res.status(200).json({
            totalProducts,
            dailySalesAmount,
            dailyOrders,
            topClients,
            salesGrowth,
            lowStockProducts,
        });
    } catch (error) {
        console.error('Error en getDashboardStats:', error);
        return res.status(500).json({
            message: 'Error al obtener estadísticas del dashboard',
            error: error.message,
        });
    }
};

module.exports = { getDashboardStats };
