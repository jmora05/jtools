import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'venta_model.dart';
import 'venta_provider.dart';

class VentaDetallePage extends StatefulWidget {
  final int ventaId;
  const VentaDetallePage({super.key, required this.ventaId});
  @override State<VentaDetallePage> createState() => _VentaDetallePageState();
}

class _VentaDetallePageState extends State<VentaDetallePage> {
  Venta? _venta;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _cargar(); }

  Future<void> _cargar() async {
    setState(() { _loading = true; _error = null; });
    try {
      final v = await context.read<VentaProvider>().cargarDetalle(widget.ventaId);
      setState(() => _venta = v);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    return Scaffold(
      backgroundColor: kBg,
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: kPrimary))
        : _error != null
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.error_outline, color: kError, size: 48),
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: kError)),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _cargar, child: const Text('Reintentar')),
            ]))
          : _venta == null ? const SizedBox()
          : CustomScrollView(slivers: [
              _appBar(),
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  _infoCard(fmt),
                  const SizedBox(height: 12),
                  if (_venta!.cliente != null) ...[_clienteCard(), const SizedBox(height: 12)],
                  _detallesCard(fmt),
                  const SizedBox(height: 12),
                  _totalesCard(fmt),
                  if (_tieneAcciones()) ...[const SizedBox(height: 12), _accionesCard()],
                  const SizedBox(height: 60),
                ]),
              )),
            ]),
    );
  }

  bool _tieneAcciones() {
    final e = _venta?.estado ?? '';
    return e == 'pendiente';
  }

  SliverAppBar _appBar() {
    final v = _venta!;
    Color c1, c2;
    switch (v.estado) {
      case 'activa':    c1 = const Color(0xFF065F46); c2 = const Color(0xFF059669); break;
      case 'pendiente': c1 = const Color(0xFF92400E); c2 = const Color(0xFFD97706); break;
      case 'anulada':   c1 = const Color(0xFF7F1D1D); c2 = const Color(0xFFDC2626); break;
      default:          c1 = const Color(0xFF1E3A8A); c2 = const Color(0xFF1D4ED8);
    }
    return SliverAppBar(
      expandedHeight: 140, pinned: true,
      backgroundColor: c1, foregroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(gradient: LinearGradient(
            colors: [c1, c2], begin: Alignment.topLeft, end: Alignment.bottomRight)),
          child: SafeArea(child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 36, 20, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Pedido #${v.id}',
                  style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white)),
                _estadoBadge(v.estado),
              ]),
              const SizedBox(height: 4),
              Text(v.tipoVenta == 'pedido' ? 'Pedido de cliente' : 'Venta directa',
                style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ]),
          )),
        ),
      ),
    );
  }

  Widget _infoCard(NumberFormat fmt) => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('INFORMACIÓN GENERAL', style: kLabel),
        const SizedBox(height: 12),
        _fila(Icons.calendar_today_outlined, 'Fecha',
          _venta!.fecha.length >= 10 ? _venta!.fecha.substring(0, 10) : _venta!.fecha),
        _fila(Icons.payment_outlined, 'Método de pago', _venta!.metodoPago),
        _fila(Icons.shopping_bag_outlined, 'Tipo',
          _venta!.tipoVenta == 'pedido' ? 'Pedido' : 'Venta directa'),
      ]),
    ),
  );

  Widget _clienteCard() {
    final cl = _venta!.cliente!;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('CLIENTE', style: kLabel),
          const SizedBox(height: 12),
          _fila(Icons.person_outline, 'Nombre', cl.nombreCompleto),
          _fila(Icons.email_outlined, 'Correo', cl.email),
          _fila(Icons.phone_outlined, 'Teléfono', cl.telefono),
        ]),
      ),
    );
  }

  Widget _detallesCard(NumberFormat fmt) => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('PRODUCTOS', style: kLabel),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: kChipBg, borderRadius: BorderRadius.circular(20)),
            child: Text('${_venta!.detalles.length}',
              style: const TextStyle(color: kChipText, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ]),
        const SizedBox(height: 12),
        if (_venta!.detalles.isEmpty)
          const Text('Sin productos registrados.',
            style: TextStyle(color: kTextMuted, fontStyle: FontStyle.italic))
        else ...[
          Row(children: const [
            Expanded(child: Text('Producto', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
            SizedBox(width: 8),
            SizedBox(width: 50, child: Text('Cant.', textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
            SizedBox(width: 8),
            SizedBox(width: 80, child: Text('Precio', textAlign: TextAlign.right,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
            SizedBox(width: 8),
            SizedBox(width: 80, child: Text('Subtotal', textAlign: TextAlign.right,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
          ]),
          const Divider(),
          ..._venta!.detalles.map((d) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(d.nombreProducto ?? 'Producto #${d.productosId}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: kText)),
                if (d.referencia != null)
                  Text(d.referencia!, style: const TextStyle(color: kTextMuted, fontSize: 11)),
              ])),
              const SizedBox(width: 8),
              SizedBox(width: 50, child: Container(
                padding: const EdgeInsets.symmetric(vertical: 3),
                decoration: BoxDecoration(color: kChipBg, borderRadius: BorderRadius.circular(6)),
                child: Text('×${d.cantidad}', textAlign: TextAlign.center,
                  style: const TextStyle(color: kChipText, fontWeight: FontWeight.w700, fontSize: 13)),
              )),
              const SizedBox(width: 8),
              SizedBox(width: 80, child: Text(fmt.format(d.precio), textAlign: TextAlign.right,
                style: const TextStyle(color: kTextMuted, fontSize: 12))),
              const SizedBox(width: 8),
              SizedBox(width: 80, child: Text(fmt.format(d.subtotal), textAlign: TextAlign.right,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: kText))),
            ]),
          )),
        ],
      ]),
    ),
  );

  Widget _totalesCard(NumberFormat fmt) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF1D4ED8), Color(0xFF3B82F6)],
        begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      const Text('Total',
        style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 15)),
      Text(fmt.format(_venta!.total),
        style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white, fontSize: 22)),
    ]),
  );

  Widget _accionesCard() => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('ACCIONES', style: kLabel),
        const SizedBox(height: 12),
        if (_venta!.estado == 'pendiente')
          _botonAccion('Marcar como activo', Icons.check_circle_outline,
            const Color(0xFF0F766E), _confirmarActivar),
        _botonAccion('Anular pedido', Icons.cancel_outlined, kError, _confirmarAnular),
      ]),
    ),
  );

  Widget _botonAccion(String label, IconData icon, Color color, VoidCallback onTap) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        icon: Icon(icon, size: 18), label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: color, side: BorderSide(color: color),
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: onTap,
      ),
    ),
  );

  Future<void> _confirmarActivar() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Marcar como activa', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Marcar el pedido #${_venta!.id} como activo (procesado/entregado)?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<VentaProvider>().cambiarEstado(_venta!.id, 'activa');
      await _cargar();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Pedido marcado como activo'),
        backgroundColor: Color(0xFF0F766E), behavior: SnackBarBehavior.floating));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
  }

  Future<void> _confirmarAnular() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Anular pedido', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Anular el pedido #${_venta!.id}? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Anular'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<VentaProvider>().anular(_venta!.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Pedido #${_venta!.id} anulado'),
          backgroundColor: kError, behavior: SnackBarBehavior.floating));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
  }

  Widget _estadoBadge(String estado) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: Colors.white24, border: Border.all(color: Colors.white54),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(Venta.estadoLabel[estado] ?? estado,
      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
  );

  Widget _fila(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [
      Icon(icon, size: 16, color: kTextMuted),
      const SizedBox(width: 8),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: kLabel),
        Text(value, style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );
}
