import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'compra_model.dart';
import 'compra_provider.dart';
import 'compra_merma_page.dart';

class CompraDetallePage extends StatefulWidget {
  final int compraId;
  const CompraDetallePage({super.key, required this.compraId});
  @override State<CompraDetallePage> createState() => _CompraDetallePageState();
}

class _CompraDetallePageState extends State<CompraDetallePage> {
  Compra? _compra;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() { _loading = true; _error = null; });
    try {
      final c = await context.read<CompraProvider>().cargarDetalle(widget.compraId);
      setState(() { _compra = c; });
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      setState(() { _loading = false; });
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
          : _compra == null ? const SizedBox()
          : CustomScrollView(slivers: [
              _appBar(),
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  _infoCard(fmt),
                  const SizedBox(height: 12),
                  _detallesCard(fmt),
                  const SizedBox(height: 12),
                  _totalesCard(fmt),
                  if (_tieneAcciones()) ...[
                    const SizedBox(height: 12),
                    _accionesCard(),
                  ],
                  const SizedBox(height: 60),
                ]),
              )),
            ]),
    );
  }

  // Hay acciones disponibles para pendiente o completada
  bool _tieneAcciones() {
    final e = _compra?.estado ?? '';
    return e == 'pendiente' || e == 'completada';
  }

  SliverAppBar _appBar() => SliverAppBar(
    expandedHeight: 140,
    pinned: true,
    backgroundColor: kPrimaryDark,
    foregroundColor: Colors.white,
    flexibleSpace: FlexibleSpaceBar(
      background: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
            begin: Alignment.topLeft, end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 36, 20, 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Compra #${_compra!.id}',
                style: const TextStyle(
                  fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white)),
              _estadoBadge(_compra!.estado),
            ]),
            const SizedBox(height: 4),
            Text(_compra!.nombreProveedor ?? 'Proveedor #${_compra!.proveedoresId}',
              style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        )),
      ),
    ),
  );

  Widget _infoCard(NumberFormat fmt) => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('INFORMACIÓN GENERAL', style: kLabel),
        const SizedBox(height: 12),
        _fila(Icons.calendar_today_outlined, 'Fecha',
          _compra!.fecha.length >= 10 ? _compra!.fecha.substring(0, 10) : _compra!.fecha),
        _fila(Icons.payment_outlined, 'Método de pago', _compra!.metodoPago),
        _fila(Icons.business_outlined, 'Proveedor',
          _compra!.nombreProveedor ?? 'ID #${_compra!.proveedoresId}'),
      ]),
    ),
  );

  Widget _detallesCard(NumberFormat fmt) => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('INSUMOS ADQUIRIDOS', style: kLabel),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: kChipBg, borderRadius: BorderRadius.circular(20)),
            child: Text('${_compra!.detalles.length}',
              style: const TextStyle(
                color: kChipText, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ]),
        const SizedBox(height: 12),
        if (_compra!.detalles.isEmpty)
          const Text('Sin insumos registrados.',
            style: TextStyle(color: kTextMuted, fontStyle: FontStyle.italic))
        else ...[
          Row(children: const [
            Expanded(child: Text('Insumo', style: TextStyle(
              fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
            SizedBox(width: 8),
            SizedBox(width: 50, child: Text('Cant.', textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
            SizedBox(width: 8),
            SizedBox(width: 80, child: Text('Precio u.', textAlign: TextAlign.right,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
            SizedBox(width: 8),
            SizedBox(width: 80, child: Text('Subtotal', textAlign: TextAlign.right,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: kTextMuted))),
          ]),
          const Divider(),
          ..._compra!.detalles.map((d) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(d.nombreInsumo ?? 'ID #${d.insumosId}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 13, color: kText)),
                if (d.unidadMedida != null)
                  Text(d.unidadMedida!,
                    style: const TextStyle(color: kTextMuted, fontSize: 11)),
              ])),
              const SizedBox(width: 8),
              SizedBox(width: 50, child: Container(
                padding: const EdgeInsets.symmetric(vertical: 3),
                decoration: BoxDecoration(
                  color: kChipBg, borderRadius: BorderRadius.circular(6)),
                child: Text('×${d.cantidad}', textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: kChipText, fontWeight: FontWeight.w700, fontSize: 13)),
              )),
              const SizedBox(width: 8),
              SizedBox(width: 80, child: Text(
                fmt.format(d.precioUnitario), textAlign: TextAlign.right,
                style: const TextStyle(color: kTextMuted, fontSize: 12))),
              const SizedBox(width: 8),
              SizedBox(width: 80, child: Text(
                fmt.format(d.subtotal), textAlign: TextAlign.right,
                style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 13, color: kText))),
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
    child: Column(children: [
      _totalFila('Subtotal', fmt.format(_compra!.subtotal)),
      _totalFila('IVA (19%)', fmt.format(_compra!.iva)),
      const Divider(color: Colors.white24, height: 20),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('Total con IVA',
          style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 15)),
        Text(fmt.format(_compra!.total),
          style: const TextStyle(
            fontWeight: FontWeight.w800, color: Colors.white, fontSize: 20)),
      ]),
    ]),
  );

  Widget _totalFila(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13)),
      Text(value, style: const TextStyle(color: Colors.white, fontSize: 13)),
    ]),
  );

  Widget _accionesCard() => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('ACCIONES', style: kLabel),
        const SizedBox(height: 12),

        // Completar solo desde pendiente
        if (_compra!.estado == 'pendiente')
          _botonAccion('Completar compra', Icons.check_circle_outline,
            const Color(0xFF0F766E), _confirmarCompletar),

        // Merma solo en completada
        if (_compra!.estado == 'completada')
          _botonAccion('Registrar merma', Icons.warning_amber_outlined,
            kWarning, _irAMerma),

        // Anular desde pendiente o completada
        _botonAccion('Anular compra', Icons.cancel_outlined, kError, _confirmarAnular),
      ]),
    ),
  );

  Widget _botonAccion(String label, IconData icon, Color color, VoidCallback onTap) =>
    Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          icon: Icon(icon, size: 18),
          label: Text(label),
          style: OutlinedButton.styleFrom(
            foregroundColor: color,
            side: BorderSide(color: color),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: onTap,
        ),
      ),
    );

  Future<void> _confirmarCompletar() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Completar compra',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text(
          '¿Marcar la compra #${_compra!.id} como completada? '
          'El stock de insumos será actualizado.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Completar'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<CompraProvider>().cambiarEstado(_compra!.id, 'completada');
      await _cargar();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Compra completada. Stock actualizado.'),
        backgroundColor: Color(0xFF0F766E),
        behavior: SnackBarBehavior.floating,
      ));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
  }

  void _irAMerma() => Navigator.push(context,
    MaterialPageRoute(builder: (_) => CompraMermaPage(compraId: _compra!.id)));

  Future<void> _confirmarAnular() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Anular compra',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text(
          '¿Anular la compra #${_compra!.id}? '
          '${_compra!.estado == 'completada' ? 'El stock será devuelto al inventario. ' : ''}'
          'Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Anular'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<CompraProvider>().anular(_compra!.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Compra #${_compra!.id} anulada'),
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
      color: Colors.white24,
      border: Border.all(color: Colors.white54),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(Compra.estadoLabel[estado] ?? estado,
      style: const TextStyle(
        color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
  );

  Widget _fila(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [
      Icon(icon, size: 16, color: kTextMuted),
      const SizedBox(width: 8),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: kLabel),
        Text(value,
          style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );
}
