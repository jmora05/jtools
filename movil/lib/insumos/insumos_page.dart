import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'insumo_provider.dart';
import 'insumo_model.dart';

class InsumosPage extends StatefulWidget {
  const InsumosPage({super.key});
  @override State<InsumosPage> createState() => _InsumosPageState();
}

class _InsumosPageState extends State<InsumosPage> {
  String _q = '';
  String _filtro = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<InsumoProvider>().cargar());
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<InsumoProvider>();
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    final lista = prov.insumos.where((i) {
      final matchQ = i.nombreInsumo.toLowerCase().contains(_q.toLowerCase()) ||
          (i.codigoInsumo?.toLowerCase().contains(_q.toLowerCase()) ?? false);
      final matchF = _filtro == 'todos' ||
          (_filtro == 'disponible' && i.disponible) ||
          (_filtro == 'bajo' && i.stockBajo) ||
          (_filtro == 'agotado' && i.cantidad == 0);
      return matchQ && matchF;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Insumos', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar)],
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar insumo...', prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                for (final f in [
                  ('todos', 'Todos'),
                  ('disponible', 'Disponible'),
                  ('bajo', 'Stock bajo'),
                  ('agotado', 'Agotado'),
                ]) Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f.$2),
                    selected: _filtro == f.$1,
                    selectedColor: kChipBg,
                    labelStyle: TextStyle(
                      color: _filtro == f.$1 ? kPrimaryDark : kTextMuted,
                      fontWeight: _filtro == f.$1 ? FontWeight.w700 : FontWeight.normal,
                    ),
                    onSelected: (_) => setState(() => _filtro = f.$1),
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
                  Icon(Icons.inventory_2_outlined, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay insumos', style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (_, i) => _InsumoCard(insumo: lista[i], fmt: fmt),
                  ),
                ),
        ),
      ]),
    );
  }
}

class _InsumoCard extends StatelessWidget {
  final Insumo insumo;
  final NumberFormat fmt;
  const _InsumoCard({required this.insumo, required this.fmt});

  @override
  Widget build(BuildContext context) {
    Color stockColor = kPrimary;
    String stockLabel = 'Stock: ${insumo.cantidad} ${insumo.unidadMedida}';
    if (insumo.cantidad == 0) stockColor = kError;
    else if (insumo.stockBajo) stockColor = kWarning;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Text(insumo.nombreInsumo,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: kText))),
            _chip(
              insumo.cantidad == 0 ? 'Agotado' : insumo.stockBajo ? 'Stock bajo' : 'Disponible',
              stockColor,
            ),
          ]),
          if (insumo.codigoInsumo != null) ...[
            const SizedBox(height: 4),
            Text('Cód: ${insumo.codigoInsumo}', style: const TextStyle(color: kTextMuted, fontSize: 12)),
          ],
          const SizedBox(height: 10),
          Row(children: [
            _dato(Icons.straighten, insumo.unidadMedida),
            const SizedBox(width: 16),
            _dato(Icons.inventory_2_outlined, stockLabel, color: stockColor),
            const Spacer(),
            Text(fmt.format(insumo.precioUnitario),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: kPrimary)),
          ]),
        ]),
      ),
    );
  }

  Widget _dato(IconData icon, String text, {Color color = kTextMuted}) => Row(children: [
    Icon(icon, size: 14, color: color),
    const SizedBox(width: 4),
    Text(text, style: TextStyle(color: color, fontSize: 12)),
  ]);

  Widget _chip(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.4)),
    ),
    child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
  );
}
