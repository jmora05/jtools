import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/scaffold_key.dart';
import 'compra_provider.dart';
import 'compra_model.dart';
import 'compra_detalle_page.dart';
import 'compra_form_page.dart';
import 'compra_merma_page.dart';

// Prioridad para ordenamiento en pantalla: pendiente → completada → anulada → resto
int _prioridad(String estado) {
  switch (estado) {
    case 'pendiente':   return 0;
    case 'completada':  return 1;
    case 'anulada':     return 2;
    default:            return 3; // en transito u otro
  }
}

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

  Future<void> _completar(BuildContext ctx, Compra c) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Completar compra',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text(
          '¿Marcar la compra #${c.id} como completada? '
          'El stock de insumos será actualizado.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Completar'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<CompraProvider>().cambiarEstado(c.id, 'completada');
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('Compra #${c.id} completada. Stock actualizado.'),
        backgroundColor: const Color(0xFF0F766E),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ));
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
  }

  Future<void> _anular(BuildContext ctx, Compra c) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Anular compra',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text(
          '¿Anular la compra #${c.id}? '
          '${c.estado == 'completada' ? 'El stock será devuelto al inventario. ' : ''}'
          'Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Anular'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<CompraProvider>().anular(c.id);
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('Compra #${c.id} anulada'),
        backgroundColor: kError, behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ));
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
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
    }).toList()
      ..sort((a, b) {
        final fa = a.fecha.length >= 10 ? a.fecha.substring(0, 10) : a.fecha;
        final fb = b.fecha.length >= 10 ? b.fecha.substring(0, 10) : b.fecha;
        if (fa != fb) return fb.compareTo(fa); // más reciente primero
        return _prioridad(a.estado) - _prioridad(b.estado);
      });

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => mainScaffoldKey.currentState?.openDrawer(),
        ),
        title: const Text('Compras', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar)],
      ),
      body: Column(children: [
        // ── Filtros ────────────────────────────────────────────────────────────
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

        // ── Hint swipe ─────────────────────────────────────────────────────────
        Container(
          color: const Color(0xFFF0F4FF),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(children: [
            const Icon(Icons.swipe, size: 14, color: kTextMuted),
            const SizedBox(width: 6),
            const Text(
              'Pendiente → Completar  ·  Completada ← Merma / Anular',
              style: TextStyle(fontSize: 11, color: kTextMuted),
            ),
          ]),
        ),

        // ── Lista ──────────────────────────────────────────────────────────────
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
                  Text('No hay compras',
                    style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (ctx, i) {
                      final c = lista[i];
                      final isPendiente  = c.estado == 'pendiente';
                      final isCompletada = c.estado == 'completada';
                      final canAnular    = isPendiente || isCompletada;

                      // Acciones swipe derecha: Ver + Completar (si pendiente)
                      final rightActions = <Widget>[
                        SlidableAction(
                          onPressed: (_) => Navigator.push(ctx,
                            MaterialPageRoute(
                              builder: (_) => CompraDetallePage(compraId: c.id))),
                          backgroundColor: kPrimary,
                          foregroundColor: Colors.white,
                          icon: Icons.info_outline,
                          label: 'Ver detalle',
                        ),
                        if (isPendiente)
                          SlidableAction(
                            onPressed: (_) => _completar(ctx, c),
                            backgroundColor: const Color(0xFF0F766E),
                            foregroundColor: Colors.white,
                            icon: Icons.check_circle_outline,
                            label: 'Completar',
                          ),
                      ];

                      // Acciones swipe izquierda: Merma (si completada) + Anular
                      final leftActions = <Widget>[
                        if (isCompletada)
                          SlidableAction(
                            onPressed: (_) => Navigator.push(ctx,
                              MaterialPageRoute(
                                builder: (_) => CompraMermaPage(compraId: c.id))),
                            backgroundColor: kWarning,
                            foregroundColor: Colors.white,
                            icon: Icons.warning_amber_outlined,
                            label: 'Merma',
                          ),
                        if (canAnular)
                          SlidableAction(
                            onPressed: (_) => _anular(ctx, c),
                            backgroundColor: kError,
                            foregroundColor: Colors.white,
                            icon: Icons.cancel_outlined,
                            label: 'Anular',
                          ),
                      ];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Card(
                          margin: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                          elevation: 1,
                          clipBehavior: Clip.hardEdge,
                          child: Slidable(
                            key: ValueKey('compra_${c.id}'),
                            startActionPane: ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: rightActions.length * 0.25,
                              children: rightActions,
                            ),
                            endActionPane: leftActions.isEmpty ? null : ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: leftActions.length * 0.25,
                              children: leftActions,
                            ),
                            child: _CompraTile(
                              c: c, fmt: fmt,
                              onTap: () => Navigator.push(ctx,
                                MaterialPageRoute(
                                  builder: (_) => CompraDetallePage(compraId: c.id))),
                            ),
                          ),
                        ),
                      );
                    },
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

// ── Tile de compra ─────────────────────────────────────────────────────────────
class _CompraTile extends StatelessWidget {
  final Compra c;
  final NumberFormat fmt;
  final VoidCallback onTap;
  const _CompraTile({required this.c, required this.fmt, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final fecha = c.fecha.length >= 10 ? c.fecha.substring(0, 10) : c.fecha;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Compra #${c.id}',
              style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 15, color: kText)),
            estadoChip(c.estado),
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
    );
  }

  Widget _dato(IconData icon, String text) => Row(children: [
    Icon(icon, size: 14, color: kTextMuted),
    const SizedBox(width: 4),
    Text(text, style: const TextStyle(color: kTextMuted, fontSize: 12)),
  ]);
}
