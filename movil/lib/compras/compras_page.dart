import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'compra_provider.dart';
import 'compra_model.dart';
import 'compra_detalle_page.dart';
import 'compra_form_page.dart';

class ComprasPage extends StatefulWidget {
  const ComprasPage({super.key});
  @override State<ComprasPage> createState() => _ComprasPageState();
}

class _ComprasPageState extends State<ComprasPage> {
  String _q = '';
  String _filtroEstado = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<CompraProvider>().cargar());
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<CompraProvider>();
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    final lista = prov.compras.where((c) {
      final matchQ = c.id.toString().contains(_q) ||
          (c.nombreProveedor?.toLowerCase().contains(_q.toLowerCase()) ?? false);
      final matchE = _filtroEstado == 'todos' || c.estado == _filtroEstado;
      return matchQ && matchE;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Compras', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar)],
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar por ID o proveedor...',
                prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                for (final f in [
                  ('todos', 'Todos'),
                  ('pendiente', 'Pendiente'),
                  ('en transito', 'En tránsito'),
                  ('completada', 'Completada'),
                  ('anulada', 'Anulada'),
                ]) Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f.$2),
                    selected: _filtroEstado == f.$1,
                    selectedColor: kChipBg,
                    labelStyle: TextStyle(
                      color: _filtroEstado == f.$1 ? kPrimaryDark : kTextMuted,
                      fontWeight: _filtroEstado == f.$1 ? FontWeight.w700 : FontWeight.normal,
                    ),
                    onSelected: (_) => setState(() => _filtroEstado = f.$1),
                  ),
                ),
              ]),
            ),
          ]),
        ),
        Expanded(child: prov.loading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : prov.error != null
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.error_outline, color: kError, size: 48),
                const SizedBox(height: 12),
                Text(prov.error!, style: const TextStyle(color: kError)),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: prov.cargar, child: const Text('Reintentar')),
              ]))
            : lista.isEmpty
              ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.shopping_cart_outlined, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay compras', style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (_, i) => _CompraCard(c: lista[i], fmt: fmt),
                  ),
                ),
        ),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kPrimary,
        icon: const Icon(Icons.add_shopping_cart, color: Colors.white),
        label: const Text('Nueva compra', style: TextStyle(color: Colors.white)),
        onPressed: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => const CompraFormPage())),
      ),
    );
  }
}

class _CompraCard extends StatelessWidget {
  final Compra c;
  final NumberFormat fmt;
  const _CompraCard({required this.c, required this.fmt});

  @override
  Widget build(BuildContext context) {
    final (color, icon) = _estadoStyle(c.estado);
    final fecha = c.fecha.length >= 10 ? c.fecha.substring(0, 10) : c.fecha;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => CompraDetallePage(compraId: c.id))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Compra #${c.id}',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: kText)),
              _chip(Compra.estadoLabel[c.estado] ?? c.estado, color, icon),
            ]),
            const SizedBox(height: 6),
            Text(c.nombreProveedor ?? 'Proveedor #${c.proveedoresId}',
              style: const TextStyle(color: kTextMuted, fontSize: 13)),
            const SizedBox(height: 10),
            Row(children: [
              _dato(Icons.calendar_today_outlined, fecha),
              const SizedBox(width: 16),
              _dato(Icons.payment_outlined, c.metodoPago),
              const Spacer(),
              const Icon(Icons.chevron_right, color: kTextMuted),
            ]),
          ]),
        ),
      ),
    );
  }

  (Color, IconData) _estadoStyle(String estado) {
    switch (estado) {
      case 'completada': return (kPrimary, Icons.check_circle_outline);
      case 'anulada': return (kError, Icons.cancel_outlined);
      case 'en transito': return (kPrimaryLight, Icons.local_shipping_outlined);
      default: return (kWarning, Icons.schedule_outlined);
    }
  }

  Widget _chip(String label, Color color, IconData icon) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.4)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 12, color: color),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    ]),
  );

  Widget _dato(IconData icon, String text) => Row(children: [
    Icon(icon, size: 14, color: kTextMuted),
    const SizedBox(width: 4),
    Text(text, style: const TextStyle(color: kTextMuted, fontSize: 12)),
  ]);
}
