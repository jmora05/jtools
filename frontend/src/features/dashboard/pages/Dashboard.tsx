import { useState, useEffect } from 'react';
import {
  Package, DollarSign, ClipboardList, TrendingUp, TrendingDown,
  AlertTriangle, Users, ShoppingCart, BarChart3, ArrowRight,
} from 'lucide-react';

interface TopClient { id: number; name: string; purchases: number; amount: number; }
interface LowStockProduct { id: number; name: string; stock: number; code: string; }
interface StatsState {
  totalProducts: number;
  dailySalesAmount: number;
  dailyOrders: number;
  topClients: TopClient[];
  salesGrowth: { month: number; sixMonths: number; year: number };
  lowStockProducts: LowStockProduct[];
}

export function Dashboard() {
  const [stats, setStats] = useState<StatsState>({
    totalProducts: 0,
    dailySalesAmount: 0,
    dailyOrders: 0,
    topClients: [],
    salesGrowth: { month: 0, sixMonths: 0, year: 0 },
    lowStockProducts: [],
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'sixMonths' | 'year'>('month');

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalProducts: 2847,
        dailySalesAmount: 15420000,
        dailyOrders: 23,
        topClients: [
          { id: 1, name: 'Auto Servicio López', purchases: 15, amount: 12500000 },
          { id: 2, name: 'Taller El Repuesto', purchases: 12, amount: 8900000 },
          { id: 3, name: 'Carlos Medina', purchases: 10, amount: 6300000 },
          { id: 4, name: 'María González', purchases: 8, amount: 4200000 },
          { id: 5, name: 'Jorge Ramírez', purchases: 7, amount: 3100000 },
        ],
        salesGrowth: { month: 15.4, sixMonths: 42.8, year: 68.5 },
        lowStockProducts: [
          { id: 1, name: 'Banda de Tiempo Chevrolet', stock: 1, code: 'BD-GEN-006' },
          { id: 2, name: 'Amortiguador Delantero', stock: 2, code: 'AD-GEN-004' },
          { id: 3, name: 'Filtro de Aceite Toyota', stock: 3, code: 'FO-TOY-001' },
          { id: 4, name: 'Pastillas de Freno Honda', stock: 5, code: 'PF-HON-002' },
          { id: 5, name: 'Bujías NGK', stock: 8, code: 'BUJ-NGK-008' },
        ],
      });
    }, 400);
  }, []);

  const getPeriodLabel = () =>
    ({ month: 'este mes', sixMonths: 'los últimos 6 meses', year: 'este año' })[selectedPeriod];

  const getSalesGrowth = () =>
    ({ month: stats.salesGrowth.month, sixMonths: stats.salesGrowth.sixMonths, year: stats.salesGrowth.year })[selectedPeriod];

  const growth = getSalesGrowth();
  const isPositive = growth >= 0;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-blue-100 text-sm">Resumen general del sistema — hoy</p>
            </div>
          </div>
        </div>
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Productos */}
        <div className="relative overflow-hidden rounded-2xl p-6 shadow-md bg-gradient-to-br from-blue-500 to-blue-700">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Productos</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalProducts.toLocaleString()}</h3>
              <p className="text-xs text-blue-200 mt-1">En catálogo activo</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        </div>

        {/* Ventas del día */}
        <div className="relative overflow-hidden rounded-2xl p-6 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-emerald-100">Ventas del Día</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                ${(stats.dailySalesAmount / 1_000_000).toFixed(1)}M
              </h3>
              <p className="text-xs text-emerald-200 mt-1">Valor acumulado hoy</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        </div>

        {/* Pedidos del día */}
        <div className="relative overflow-hidden rounded-2xl p-6 shadow-md bg-gradient-to-br from-violet-500 to-violet-700">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-violet-100">Pedidos del Día</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.dailyOrders}</h3>
              <p className="text-xs text-violet-200 mt-1">Órdenes procesadas hoy</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Crecimiento de Ventas ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Crecimiento de Ventas</h3>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {growth.toFixed(1)}%
            </span>
          </div>
          <div className="p-5">
            {/* Period selector */}
            <div className="flex gap-2 mb-5">
              {([
                { key: 'month', label: 'Este Mes', value: stats.salesGrowth.month },
                { key: 'sixMonths', label: '6 Meses', value: stats.salesGrowth.sixMonths },
                { key: 'year', label: 'Este Año', value: stats.salesGrowth.year },
              ] as const).map(({ key, label, value }) => (
                <button
                  key={key}
                  onClick={() => setSelectedPeriod(key)}
                  className={`flex-1 py-2.5 px-3 rounded-xl transition-all text-sm font-medium ${
                    selectedPeriod === key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className={`text-xs mt-0.5 ${selectedPeriod === key ? 'text-blue-100' : 'text-gray-400'}`}>
                    {value.toFixed(1)}%
                  </div>
                </button>
              ))}
            </div>

            {/* Growth display */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <p className="text-sm text-gray-500 text-center mb-2">Crecimiento en {getPeriodLabel()}</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-bold text-blue-600">{growth.toFixed(1)}%</span>
                {isPositive
                  ? <TrendingUp className="w-10 h-10 text-emerald-500" />
                  : <TrendingDown className="w-10 h-10 text-red-500" />
                }
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Ventas Anteriores</p>
                  <p className="font-semibold text-gray-700 text-sm">$58,450,000</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Ventas Actuales</p>
                  <p className="font-semibold text-blue-600 text-sm">
                    ${(58450000 * (1 + growth / 100)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top Clientes ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Clientes Top del Mes</h3>
            </div>
            <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium">
              Top {stats.topClients.length}
            </span>
          </div>
          <div className="p-5 space-y-2.5">
            {stats.topClients.map((client: any, index: number) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-400">{client.purchases} compras</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ${(client.amount / 1_000_000).toFixed(1)}M
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stock Bajo ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Productos con Stock Bajo</h3>
              <p className="text-xs text-gray-400">Menos de 10 unidades disponibles</p>
            </div>
          </div>
          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">
            Alerta
          </span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockProducts.map((product: any) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-all"
              >
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.code}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-sm font-bold ${product.stock <= 2 ? 'text-red-600' : 'text-orange-600'}`}>
                    {product.stock}
                  </span>
                  <p className="text-xs text-gray-400">uds</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-xl hover:from-red-600 hover:to-red-700 transition-all text-sm font-medium shadow-md shadow-red-100 flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Generar Orden de Compra
          </button>
        </div>
      </div>

      {/* ── Acciones Rápidas ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-xl hover:shadow-md transition-all text-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-md shadow-blue-200">
              <Package className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-blue-900">Nuevo Producto</p>
          </button>
          <button className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-4 rounded-xl hover:shadow-md transition-all text-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-md shadow-emerald-200">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-emerald-900">Nuevo Cliente</p>
          </button>
          <button className="group relative overflow-hidden bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 p-4 rounded-xl hover:shadow-md transition-all text-center">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-md shadow-violet-200">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-violet-900">Nueva Venta</p>
          </button>
          <button className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-xl hover:shadow-md transition-all text-center">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-md shadow-orange-200">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-orange-900">Ver Reportes</p>
          </button>
        </div>
      </div>
    </div>
  );
}
