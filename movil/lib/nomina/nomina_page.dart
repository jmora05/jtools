import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/logout_button.dart';
import 'nomina_provider.dart';
import 'nomina_model.dart';
import 'nomina_detalle_page.dart';

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
      final matchE = _filtroEstado == 'todos' ||
          (_filtroEstado == 'pendiente' && !n.pagado) ||
          (_filtroEstado == 'pagado' && n.pagado);
      return matchQ && matchE;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Control de Pagos', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [const LogoutButton(), IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar)],
      ),
      body: Column(children: [
        // ── Filtros ──────────────────────────────────────────────────────────
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

        // ── Hint swipe ────────────────────────────────────────────────────────
        Container(
          color: const Color(0xFFF0F4FF),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: const Row(children: [
            Icon(Icons.swipe, size: 14, color: kTextMuted),
            SizedBox(width: 6),
            Text('→ Desliza para ver detalle',
              style: TextStyle(fontSize: 11, color: kTextMuted)),
          ]),
        ),

        // ── Lista ─────────────────────────────────────────────────────────────
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
                  Text('No hay registros',
                    style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (ctx, i) {
                      final n = lista[i];
                      return AnimatedListItem(
                        index: i,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Card(
                            margin: EdgeInsets.zero,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                            elevation: 1,
                            clipBehavior: Clip.hardEdge,
                            child: Slidable(
                              key: ValueKey('nomina_${n.id}'),
                              startActionPane: ActionPane(
                                motion: const DrawerMotion(),
                                extentRatio: 0.25,
                                children: [
                                  SlidableAction(
                                    onPressed: (_) => Navigator.push(ctx,
                                      MaterialPageRoute(
                                        builder: (_) => NominaDetallePage(nomina: n))),
                                    backgroundColor: kPrimary,
                                    foregroundColor: Colors.white,
                                    icon: Icons.info_outline,
                                    label: 'Ver detalle',
                                  ),
                                ],
                              ),
                              child: _NominaTile(
                                n: n, fmt: fmt,
                                onTap: () => Navigator.push(ctx,
                                  MaterialPageRoute(
                                    builder: (_) => NominaDetallePage(nomina: n))),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ]),
    );
  }
}

// ── Tile de nómina ─────────────────────────────────────────────────────────────
class _NominaTile extends StatelessWidget {
  final Nomina n;
  final NumberFormat fmt;
  final VoidCallback onTap;
  const _NominaTile({required this.n, required this.fmt, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text(
            n.nombreEmpleado ?? 'Empleado #${n.empleadoId}',
            style: const TextStyle(
              fontWeight: FontWeight.w700, fontSize: 15, color: kText))),
          estadoChip(n.pagado ? 'pagado' : 'pendiente'),
        ]),
        const SizedBox(height: 4),
        Text(n.cargoEmpleado ?? '',
          style: const TextStyle(color: kTextMuted, fontSize: 13)),
        const SizedBox(height: 10),
        Row(children: [
          _dato(Icons.calendar_today_outlined,
            '${n.fechaInicioPeriodo} – ${n.fechaFinPeriodo}'),
          const Spacer(),
          Text(fmt.format(n.pagoNeto),
            style: const TextStyle(
              fontWeight: FontWeight.w800, fontSize: 16, color: kPrimary)),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right, color: kTextMuted),
        ]),
      ]),
    ),
  );

  Widget _dato(IconData icon, String text) => Row(children: [
    Icon(icon, size: 14, color: kTextMuted),
    const SizedBox(width: 4),
    Text(text, style: const TextStyle(color: kTextMuted, fontSize: 11)),
  ]);
}
