import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Download, Plus, RefreshCw,
  ShoppingCart, Factory, DollarSign, AlertTriangle,
  Users, Package,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { getApiBaseUrl, buildAuthHeaders } from '@/services/http';

const API              = getApiBaseUrl();
const POLL_MS          = 30_000; // actualización automática cada 30 s
const SECONDARY        = '#0058be';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface StatsData {
  totalProducts: number;
  dailySalesAmount: number;
  dailyOrders: number;
  topClients: { id: number; name: string; purchases: number; amount: number }[];
  salesGrowth: { month: number; sixMonths: number; year: number };
  lowStockProducts: { id: number; name: string; stock: number; code: string }[];
}
interface ChartData {
  labels: string[];
  data: number[];
  stats: { total: number; promedio: number; mes_pico: string; crecimiento?: number; variacion?: number };
}
interface PeriodData { labels: string[]; data: number[]; variaciones: number[] }
interface ProductoData { nombre: string; cantidad: number; variacion: number; stock: number; unidad: string }
interface ProduccionData { total: number; activas: number; finalizadas: number; porcentaje: number; variacion: number }

// ── Helpers ────────────────────────────────────────────────────────────────────
const COP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const NUM = (n: number) => n.toLocaleString('es-CO');

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: buildAuthHeaders() });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

function periodUrl(desde: string, hasta: string) {
  return `/dashboard/ventas-periodo-grafica?desde=${desde}&hasta=${hasta}`;
}
function monthRange(meses: number) {
  const now = new Date();
  const h = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const d = new Date(now.getFullYear(), now.getMonth() - meses + 1, 1);
  const fmt = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
  return { desde: fmt(d), hasta: fmt(h) };
}

// ── Skeleton inline ───────────────────────────────────────────────────────────
const SK = ({ h = 'h-4', w = 'w-full', rounded = 'rounded' }: { h?: string; w?: string; rounded?: string }) => (
  <div className={`${h} ${w} ${rounded} bg-gray-200 animate-pulse`} />
);

// ── Badge % ───────────────────────────────────────────────────────────────────
function Badge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${pos ? 'bg-[#fcdeb5] text-[#98805d]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
      {pos ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

// ── Custom Bar Tooltip ────────────────────────────────────────────────────────
function BarTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold">{label}</p>
      <p>{COP(payload[0].value)}</p>
    </div>
  );
}

// ── Custom Area Tooltip ───────────────────────────────────────────────────────
function AreaTip({ active, payload, label, variaciones, labels }: any) {
  if (!active || !payload?.length) return null;
  const idx = (labels as string[])?.indexOf(label) ?? -1;
  const v   = variaciones?.[idx];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-xl min-w-32">
      <p className="font-semibold text-gray-900">{label}</p>
      <p style={{ color: SECONDARY }} className="font-medium">{COP(payload[0].value)}</p>
      {v != null && idx > 0 && (
        <p className={`text-xs mt-0.5 ${v >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {v >= 0 ? '+' : ''}{v}% vs mes anterior
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function Dashboard({ userType = 'admin' }: { userType?: 'admin' | 'client' }) {
  const isAdmin = userType !== 'client';

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastAt,     setLastAt]     = useState<Date | null>(null);

  const [stats,      setStats]      = useState<StatsData | null>(null);
  const [ventasM,    setVentasM]    = useState<ChartData | null>(null);
  const [comprasM,   setComprasM]   = useState<ChartData | null>(null);
  const [periodoD,   setPeriodoD]   = useState<PeriodData | null>(null);
  const [producto,   setProducto]   = useState<ProductoData | null>(null);
  const [produccion, setProduccion] = useState<ProduccionData | null>(null);

  const [chartType,  setChartType]  = useState<'ventas' | 'compras'>('ventas');
  const [periodoCarta, setPeriodoCarta] = useState<'hoy' | 'mes' | 'anio'>('mes');
  const [periodF,   setPeriodF]     = useState<'last6' | 'currentYear' | 'custom'>('last6');
  const [customD,   setCustomD]     = useState('');
  const [customH,   setCustomH]     = useState('');
  const [noServer,  setNoServer]    = useState(false);

  // ── Fetch período chart ────────────────────────────────────────────────────
  const loadPeriod = useCallback(async (f: string, d = customD, h = customH) => {
    if (f === 'custom' && (!d || !h || d > h)) return;
    let url: string;
    if (f === 'custom') {
      url = periodUrl(d, h);
    } else {
      const { desde, hasta } = monthRange(f === 'currentYear' ? new Date().getMonth() + 1 : 6);
      url = periodUrl(desde, hasta);
    }
    const data = await safeGet<PeriodData>(url);
    if (data) setPeriodoD(data);
  }, [customD, customH]);

  // ── Fetch todo ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setNoServer(false);
    const [s, vm, cm, p, prod, per] = await Promise.all([
      safeGet<StatsData>('/dashboard/stats'),
      safeGet<ChartData>('/dashboard/ventas-mensuales?meses=7'),
      safeGet<ChartData>('/dashboard/compras-mensuales?meses=6'),
      safeGet<ProductoData>('/dashboard/producto-mas-vendido'),
      safeGet<ProduccionData>('/dashboard/produccion-resumen'),
      (() => { const { desde, hasta } = monthRange(6); return safeGet<PeriodData>(periodUrl(desde, hasta)); })(),
    ]);
    if (s)    setStats(s);
    if (vm)   setVentasM(vm);
    if (cm)   setComprasM(cm);
    if (p)    setProducto(p);
    if (prod) setProduccion(prod);
    if (per)  setPeriodoD(per);
    if (!s && !vm) setNoServer(true);
    setLastAt(new Date());
  }, []);

  // ── Mount + auto-refresh ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => { setLoading(true); await loadAll(); setLoading(false); })();
  }, [loadAll]);

  useEffect(() => {
    const timer = setInterval(() => { loadAll(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [loadAll]);

  // ── Botón refresh manual ───────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // ── Datos derivados para "Ventas del período" (card 3) ────────────────────
  const ventasPeriodoCard = useMemo(() => {
    if (!ventasM) return { total: 0, variacion: 0, mensaje: '' };
    const arr    = ventasM.data;
    const n      = arr.length;
    const actual = periodoCarta === 'hoy'
      ? (stats?.dailySalesAmount ?? 0)
      : periodoCarta === 'mes'
        ? (arr[n - 1] ?? 0)
        : arr.reduce((s, v) => s + v, 0);

    const prev = periodoCarta === 'mes' ? (arr[n - 2] ?? 0) : 0;
    const variacion = prev === 0 ? 0 : Math.round(((actual - prev) / prev) * 1000) / 10;
    const abs = Math.abs(Math.round(variacion));
    const mensaje = periodoCarta === 'hoy'
      ? 'Total de ventas registradas hoy'
      : variacion > 0
        ? `El ingreso aumentó un ${abs}% respecto al mes anterior`
        : variacion < 0
          ? `El ingreso disminuyó un ${abs}% respecto al mes anterior`
          : 'El ingreso se mantiene igual al mes anterior';
    return { total: actual, variacion, mensaje };
  }, [ventasM, stats, periodoCarta]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const activeChart = chartType === 'ventas' ? ventasM : comprasM;
  const barData = (activeChart?.labels ?? []).map((name, i) => ({ name, value: activeChart!.data[i] ?? 0 }));
  const areaData = (periodoD?.labels ?? []).map((name, i) => ({ name, value: periodoD!.data[i] ?? 0 }));

  // ── "hace X segundos" ──────────────────────────────────────────────────────
  const [sinceStr, setSinceStr] = useState('');
  useEffect(() => {
    const tick = setInterval(() => {
      if (!lastAt) return;
      const s = Math.round((Date.now() - lastAt.getTime()) / 1000);
      setSinceStr(s < 60 ? `hace ${s}s` : `hace ${Math.floor(s / 60)}min`);
    }, 1000);
    return () => clearInterval(tick);
  }, [lastAt]);

  // ── Error state ────────────────────────────────────────────────────────────
  if (!loading && noServer) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 gap-3">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600 text-sm">No se pudo conectar con el servidor.</p>
        <button onClick={handleRefresh}
          className="px-4 py-2 text-sm text-white rounded-lg"
          style={{ background: SECONDARY }}>
          Reintentar
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 bg-[#f7f9fb] min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumen de Operaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control centralizado de métricas administrativas y de producción.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sinceStr && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Actualizado {sinceStr}
            </span>
          )}
          <button onClick={handleRefresh} disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar reporte</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: SECONDARY }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* ── 3 KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Card 1 — Producto más vendido */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" style={{ color: SECONDARY }} />
            </div>
            {loading ? <SK h="h-5" w="w-16" rounded="rounded-full" /> : producto && <Badge value={producto.variacion} />}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Producto más vendido</p>

          {loading ? (
            <div className="space-y-2">
              <SK h="h-6" w="w-3/4" />
              <SK h="h-4" w="w-1/2" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-900 leading-tight">{producto?.nombre ?? '—'}</p>
              <p className="text-base font-semibold text-gray-700 mt-1">
                {NUM(producto?.cantidad ?? 0)} {producto?.unidad}
              </p>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
            {loading
              ? <SK h="h-3" w="w-40" />
              : <span className="text-xs text-gray-500">Stock disponible: <strong className={`${(producto?.stock ?? 0) < 10 ? 'text-red-600' : 'text-gray-700'}`}>{NUM(producto?.stock ?? 0)}</strong></span>
            }
          </div>
        </div>

        {/* Card 2 — Producción */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center">
              <Factory className="w-5 h-5" style={{ color: SECONDARY }} />
            </div>
            {loading ? <SK h="h-5" w="w-16" rounded="rounded-full" /> : produccion && <Badge value={produccion.variacion} />}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Órdenes de producción</p>

          {loading ? (
            <div className="space-y-3">
              <SK h="h-8" w="w-1/2" />
              <SK h="h-2" rounded="rounded-full" />
              <SK h="h-3" w="w-3/4" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">{NUM(produccion?.total ?? 0)}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso global de órdenes</span>
                  <span className="font-semibold" style={{ color: SECONDARY }}>{produccion?.porcentaje ?? 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${produccion?.porcentaje ?? 0}%`, background: SECONDARY }} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: SECONDARY }} />
                  {NUM(produccion?.activas ?? 0)} Activas
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  {NUM(produccion?.finalizadas ?? 0)} Finalizadas
                </span>
              </div>
            </>
          )}
        </div>

        {/* Card 3 — Ventas del período */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center">
              <DollarSign className="w-5 h-5" style={{ color: SECONDARY }} />
            </div>
            <select
              value={periodoCarta}
              onChange={e => setPeriodoCarta(e.target.value as any)}
              className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 cursor-pointer"
              style={{ '--tw-ring-color': SECONDARY } as any}
            >
              <option value="hoy">Hoy</option>
              <option value="mes">Mes</option>
              <option value="anio">6 meses</option>
            </select>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Ventas del período</p>

          {loading ? (
            <div className="space-y-2">
              <SK h="h-10" w="w-2/3" />
              <SK h="h-4" w="w-full" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {COP(ventasPeriodoCard.total)}
              </p>
              <div className="mt-3 flex items-start gap-2">
                {ventasPeriodoCard.variacion >= 0
                  ? <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" style={{ color: SECONDARY }} />
                  : <TrendingDown className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                }
                <p className="text-xs text-gray-500 leading-relaxed">{ventasPeriodoCard.mensaje}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Desempeño Operativo ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Desempeño Operativo</h2>
            <p className="text-xs text-gray-400 mt-0.5">Análisis detallado de flujos financieros mensuales.</p>
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(['ventas', 'compras'] as const).map(t => (
              <button key={t}
                onClick={() => setChartType(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartType === t ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
                style={chartType === t ? { background: SECONDARY } : {}}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
         <div className="p-4">
          {[
            {
              label: 'Total período',
              value: loading ? null : COP(activeChart?.stats.total ?? 0),
            },
            {
              label: 'Promedio mensual',
              value: loading ? null : COP(activeChart?.stats.promedio ?? 0),
            },
            {
              label: 'Mes pico',
              value: loading ? null : (activeChart?.stats.mes_pico || '—'),
            },
            {
              label: 'Crecimiento',
              value: loading ? null : (() => {
                const v = activeChart?.stats.crecimiento ?? activeChart?.stats.variacion ?? 0;
                return (
                  <span className={`font-bold text-lg ${v >= 0 ? '' : 'text-red-600'}`}
                    style={v >= 0 ? { color: SECONDARY } : {}}>
                    {v >= 0 ? '+' : ''}{v}%
                  </span>
                );
              })(),
            },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
              {value === null
                ? <SK h="h-6" w="w-24" />
                : typeof value === 'string'
                  ? <p className="text-lg font-bold text-gray-900">{value}</p>
                  : value
              }
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="p-5 pt-2">
          {loading ? (
            <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={28} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`}
                    width={54}
                  />
                  <Tooltip content={<BarTip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill={SECONDARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── Ventas por período (area chart) ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ventas por Período</h2>
            <p className="text-xs text-gray-400 mt-0.5">Evolución mensual de ingresos.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              { key: 'last6',       label: 'Últimos 6 meses' },
              { key: 'currentYear', label: 'Año actual'       },
              { key: 'custom',      label: 'Personalizado'    },
            ] as const).map(({ key, label }) => (
              <button key={key}
                onClick={() => { setPeriodF(key); if (key !== 'custom') loadPeriod(key); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  periodF === key ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                style={periodF === key ? { background: SECONDARY } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {periodF === 'custom' && (
          <div className="px-5 pt-3 flex flex-wrap items-center gap-2">
            <input type="month" value={customD} onChange={e => setCustomD(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2" />
            <span className="text-gray-400 text-sm">hasta</span>
            <input type="month" value={customH} onChange={e => setCustomH(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2" />
            <button
              onClick={() => loadPeriod('custom', customD, customH)}
              disabled={!customD || !customH || customD > customH}
              className="px-4 py-1.5 text-white text-xs font-medium rounded-lg disabled:opacity-50 hover:opacity-90"
              style={{ background: SECONDARY }}
            >
              Aplicar
            </button>
          </div>
        )}

        <div className="p-5">
          {loading ? (
            <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={SECONDARY} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={SECONDARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`}
                    width={54}
                  />
                  <Tooltip content={(p: any) => <AreaTip {...p} variaciones={periodoD?.variaciones} labels={periodoD?.labels} />} />
                  <Area type="monotone" dataKey="value" stroke={SECONDARY} strokeWidth={2.5} fill="url(#aGrad)"
                    dot={{ fill: '#fff', stroke: SECONDARY, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: SECONDARY }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Clientes top + Stock bajo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center">
                <Users className="w-4 h-4" style={{ color: SECONDARY }} />
              </div>
              <span className="font-semibold text-gray-900 text-sm">Clientes Top del Mes</span>
            </div>
            {!loading && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-gray-500 bg-gray-100">
                Top {stats?.topClients.length ?? 0}
              </span>
            )}
          </div>
          <div className="p-4 space-y-2">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)
              : (stats?.topClients ?? []).length === 0
                ? <p className="text-center text-gray-400 text-sm py-6">Sin ventas este mes</p>
                : (stats?.topClients ?? []).map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : SECONDARY }}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.purchases} compras</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">${(c.amount / 1_000_000).toFixed(1)}M</p>
                    </div>
                  ))
            }
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 text-sm">Stock Bajo</span>
                <p className="text-xs text-gray-400">Menos de 10 unidades</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-red-600 bg-red-50">
              {loading ? '—' : `${stats?.lowStockProducts.length ?? 0} productos`}
            </span>
          </div>
          <div className="p-4">
            {loading
              ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              : (stats?.lowStockProducts ?? []).length === 0
                ? <p className="text-center text-gray-400 text-sm py-6">Sin productos con stock bajo</p>
                : (
                    <div className="space-y-2">
                      {(stats?.lowStockProducts ?? []).slice(0, 6).map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/50">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.code}</p>
                          </div>
                          <span className={`text-sm font-bold shrink-0 ${p.stock <= 2 ? 'text-red-600' : 'text-orange-500'}`}>
                            {p.stock} uds
                          </span>
                        </div>
                      ))}
                    </div>
                  )
            }
          </div>
        </div>
      </div>

    </div>
  );
}
