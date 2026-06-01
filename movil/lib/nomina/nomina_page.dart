import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'nomina_provider.dart';
import 'nomina_model.dart';
import 'nomina_detalle_page.dart';
import 'nomina_form_page.dart';

class NominaPage extends StatefulWidget {
  const NominaPage({super.key});
  @override State<NominaPage> createState() => _NominaPageState();
}

class _NominaPageState extends State<NominaPage> {
  String _q = '';
  String _filtroEstado = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<NominaProvider>().cargar());
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<NominaProvider>();
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    final lista = prov.nominas.where((n) {
      final matchQ = (n.nombreEmpleado?.toLowerCase().contains(_q.toLowerCase()) ?? false) ||
          n.id.toString().contains(_q);
      final matchE = _filtroEstado == 'todos' || n.estado == _filtroEstado;
      return matchQ && matchE;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Nómina', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar)],
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar por empleado o ID...',
                prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: ['todos', 'pendiente', 'pagado'].map((f) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(f[0].toUpperCase() + f.substring(1)),
                  selected: _filtroEstado == f,
                  selectedColor: kChipBg,
                  labelStyle: TextStyle(
                    color: _filtroEstado == f ? kPrimaryDark : kTextMuted,
                    fontWeight: _filtroEstado == f ? FontWeight.w700 : FontWeight.normal,
                  ),
                  onSelected: (_) => setState(() => _filtroEstado = f),
                ),
              )).toList()),
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
                  Icon(Icons.receipt_long_outlined, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay nóminas', style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (_, i) => _NominaCard(n: lista[i], fmt: fmt),
                  ),
                ),
        ),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kPrimary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Nueva nómina', style: TextStyle(color: Colors.white)),
        onPressed: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => const NominaFormPage())),
      ),
    );
  }
}

class _NominaCard extends StatelessWidget {
  final Nomina n;
  final NumberFormat fmt;
  const _NominaCard({required this.n, required this.fmt});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => NominaDetallePage(nomina: n))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Expanded(child: Text(n.nombreEmpleado ?? 'Empleado #${n.empleadoId}',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: kText))),
              _chip(n.pagado ? 'Pagado' : 'Pendiente', n.pagado ? kPrimary : kWarning),
            ]),
            const SizedBox(height: 4),
            Text(n.cargoEmpleado ?? '', style: const TextStyle(color: kTextMuted, fontSize: 13)),
            const SizedBox(height: 10),
            Row(children: [
              _dato(Icons.calendar_today_outlined,
                '${n.fechaInicioPeriodo} – ${n.fechaFinPeriodo}'),
              const Spacer(),
              Text(fmt.format(n.pagoNeto),
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: kPrimary)),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: kTextMuted),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _chip(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.4)),
    ),
    child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
  );

  Widget _dato(IconData icon, String text) => Row(children: [
    Icon(icon, size: 14, color: kTextMuted),
    const SizedBox(width: 4),
    Text(text, style: const TextStyle(color: kTextMuted, fontSize: 11)),
  ]);
}
