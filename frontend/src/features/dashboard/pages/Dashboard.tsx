import React, { useState, useEffect } from 'react';
import { TrendingUpIcon, TrendingDownIcon, ChevronDownIcon } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    dailySalesAmount: 0,
    dailyOrders: 0,
    topClients: [],
    salesGrowth: { month: 0, sixMonths: 0, year: 0 },
    lowStockProducts: []
  });

  // Estado para el período de ventas seleccionado
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'sixMonths' | 'year'>('month');

  useEffect(() => {
    // Simulate loading dashboard data
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
        salesGrowth: {
          month: 15.4,
          sixMonths: 42.8,
          year: 68.5
        },
        lowStockProducts: [
          { id: 1, name: 'Banda de Tiempo Chevrolet', stock: 1, code: 'BD-GEN-006' },
          { id: 2, name: 'Amortiguador Delantero', stock: 2, code: 'AD-GEN-004' },
          { id: 3, name: 'Filtro de Aceite Toyota', stock: 3, code: 'FO-TOY-001' },
          { id: 4, name: 'Pastillas de Freno Honda', stock: 5, code: 'PF-HON-002' },
          { id: 5, name: 'Bujías NGK', stock: 8, code: 'BUJ-NGK-008' },
        ]
      });
    }, 500);
  }, []);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl text-gray-900 mb-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const getPeriodLabel = () => {
    switch(selectedPeriod) {
      case 'month': return 'este mes';
      case 'sixMonths': return 'los últimos 6 meses';
      case 'year': return 'este año';
    }
  };

  const getSalesGrowth = () => {
    switch(selectedPeriod) {
      case 'month': return stats.salesGrowth.month;
      case 'sixMonths': return stats.salesGrowth.sixMonths;
      case 'year': return stats.salesGrowth.year;
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Resumen general del sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Cantidad Total de Productos"
          value={stats.totalProducts.toLocaleString()}
          icon="📦"
          color="bg-blue-100"
          subtitle="En catálogo"
        />
        <StatCard
          title="Ventas del Día"
          value={`$${stats.dailySalesAmount.toLocaleString()}`}
          icon="💵"
          color="bg-green-100"
          subtitle="Valor acumulado"
        />
        <StatCard
          title="Pedidos del Día"
          value={stats.dailyOrders}
          icon="📋"
          color="bg-purple-100"
          subtitle="Total hoy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crecimiento de Ventas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-gray-900">Crecimiento de Ventas</h3>
              <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                getSalesGrowth() >= 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {getSalesGrowth() >= 0 ? '📈' : '📉'} {getSalesGrowth().toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-6">
            {/* Botones de selección de período */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all text-sm ${
                  selectedPeriod === 'month'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div>
                  <div>Este Mes</div>
                  <div className={`text-xs mt-1 ${selectedPeriod === 'month' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {stats.salesGrowth.month.toFixed(1)}%
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSelectedPeriod('sixMonths')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all text-sm ${
                  selectedPeriod === 'sixMonths'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div>
                  <div>6 Meses</div>
                  <div className={`text-xs mt-1 ${selectedPeriod === 'sixMonths' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {stats.salesGrowth.sixMonths.toFixed(1)}%
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`flex-1 py-3 px-4 rounded-lg transition-all text-sm ${
                  selectedPeriod === 'year'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div>
                  <div>Este Año</div>
                  <div className={`text-xs mt-1 ${selectedPeriod === 'year' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {stats.salesGrowth.year.toFixed(1)}%
                  </div>
                </div>
              </button>
            </div>

            {/* Información detallada */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-center mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Crecimiento en {getPeriodLabel()}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl text-blue-600">{getSalesGrowth().toFixed(1)}%</span>
                    {getSalesGrowth() >= 0 ? (
                      <TrendingUpIcon className="w-8 h-8 text-green-600" />
                    ) : (
                      <TrendingDownIcon className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Ventas Anteriores</p>
                    <p className="text-sm text-gray-900">$58,450,000</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Ventas Actuales</p>
                    <p className="text-sm text-blue-600">${(58450000 * (1 + getSalesGrowth() / 100)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clientes que más compraron en el mes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-gray-900">Clientes que más Compraron en el Mes</h3>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs">
                Top {stats.topClients.length}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.topClients.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600">{index + 1}°</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.purchases} compras este mes</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-900">${client.amount.toLocaleString()}</p>
                    <p className="text-xs text-green-600">Total gastado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Productos con Menos de 10 en Existencia */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 lg:col-span-2">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-gray-900">Productos con Stock Bajo</h3>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                ⚠️ Menos de 10 unidades
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-all">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-sm">📦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.code}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-red-600">{product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}</p>
                    <p className="text-xs text-gray-500">en stock</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm">
              Generar Orden de Compra
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-blue-50 border border-blue-200 p-4 rounded-lg hover:bg-blue-100 transition-colors text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📦</div>
            <p className="text-sm text-gray-700">Nuevo Producto</p>
          </button>
          <button className="bg-green-50 border border-green-200 p-4 rounded-lg hover:bg-green-100 transition-colors text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">👤</div>
            <p className="text-sm text-gray-700">Nuevo Cliente</p>
          </button>
          <button className="bg-purple-50 border border-purple-200 p-4 rounded-lg hover:bg-purple-100 transition-colors text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💵</div>
            <p className="text-sm text-gray-700">Nueva Venta</p>
          </button>
          <button className="bg-orange-50 border border-orange-200 p-4 rounded-lg hover:bg-orange-100 transition-colors text-center group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</div>
            <p className="text-sm text-gray-700">Ver Reportes</p>
          </button>
        </div>
      </div>
    </div>
  );
}