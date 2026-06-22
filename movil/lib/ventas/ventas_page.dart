import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/scaffold_key.dart';
import 'venta_model.dart';
import 'venta_provider.dart';
import 'venta_detalle_page.dart';

class VentasPage extends StatefulWidget {
  const VentasPage({super.key});
  @override State<VentasPage> createState() => _VentasPageState();
}

class _VentasPageState extends State<VentasPage> {
  String _q = '';
  String _filtroEstado = 'todos';
  String _filtroTipo   = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<VentaProvider>().cargar());
  }

  Future<void> _activar(BuildContext ctx, Venta v) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Marcar como activa', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Marcar el pedido #${v.id} como activo (entregado/procesado)?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<VentaProvider>().cambiarEstado(v.id, 'activa');
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('Pedido #${v.id} marcado como activo'),
        backgroundColor: const Color(0xFF0F766E), behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ));
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
  }

  Future<void> _anular(BuildContext ctx, Venta v) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Anular pedido', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Anular el pedido #${v.id}? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Anular'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<VentaProvider>().anular(v.id);
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('Pedido #${v.id} anulado'),
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
    final prov = context.watch<VentaProvider>();
    final fmt  = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    final lista = prov.ventas.where((v) {
      final q = _q.toLowerCase();
      final nombreCliente = v.cliente?.nombreCompleto.toLowerCase() ?? '';
      final matchQ = v.id.toString().contains(q) || nombreCliente.contains(q);
      final matchE = _filtroEstado == 'todos' || v.estado == _filtroEstado;
      final matchT = _filtroTipo == 'todos' || v.tipoVenta == _filtroTipo;
      return matchQ && matchE && matchT;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => mainScaffoldKey.currentState?.openDrawer(),
        ),
        title: const Text('Pedidos', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar)],
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar por ID o cliente...',
                prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                for (final f in [
                  ('todos','Todos'),('pendiente','Pendiente'),
                  ('activa','Activa'),('anulada','Anulada'),
                ]) Padding(
                  padding: const EdgeInsets.only(right: 6),
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
                const SizedBox(width: 8),
                for (final f in [('todos','Tipo'), ('pedido','Pedido'), ('directa','Directa')])
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ChoiceChip(
                      label: Text(f.$2),
                      selected: _filtroTipo == f.$1,
                      selectedColor: kChipBg,
                      labelStyle: TextStyle(
                        color: _filtroTipo == f.$1 ? kPrimaryDark : kTextMuted,
                        fontWeight: _filtroTipo == f.$1 ? FontWeight.w700 : FontWeight.normal,
                      ),
                      onSelected: (_) => setState(() => _filtroTipo = f.$1),
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
                  Icon(Icons.receipt_outlined, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay pedidos', style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (ctx, i) {
                      final v = lista[i];
                      final isPendiente = v.estado == 'pendiente';
                      final canAnular   = v.estado != 'anulada';

                      final leftActions = <Widget>[
                        if (canAnular)
                          SlidableAction(
                            onPressed: (_) => _anular(ctx, v),
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
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 1,
                          clipBehavior: Clip.hardEdge,
                          child: Slidable(
                            key: ValueKey('venta_${v.id}'),
                            startActionPane: ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: isPendiente ? 0.5 : 0.25,
                              children: [
                                SlidableAction(
                                  onPressed: (_) => Navigator.push(ctx,
                                    MaterialPageRoute(builder: (_) => VentaDetallePage(ventaId: v.id))),
                                  backgroundColor: kPrimary,
                                  foregroundColor: Colors.white,
                                  icon: Icons.info_outline,
                                  label: 'Ver detalle',
                                ),
                                if (isPendiente)
                                  SlidableAction(
                                    onPressed: (_) => _activar(ctx, v),
                                    backgroundColor: const Color(0xFF0F766E),
                                    foregroundColor: Colors.white,
                                    icon: Icons.check_circle_outline,
                                    label: 'Activar',
                                  ),
                              ],
                            ),
                            endActionPane: leftActions.isEmpty ? null : ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: 0.25,
                              children: leftActions,
                            ),
                            child: _VentaTile(
                              v: v, fmt: fmt,
                              onTap: () => Navigator.push(ctx,
                                MaterialPageRoute(builder: (_) => VentaDetallePage(ventaId: v.id))),
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

class _VentaTile extends StatelessWidget {
  final Venta v;
  final NumberFormat fmt;
  final VoidCallback onTap;
  const _VentaTile({required this.v, required this.fmt, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final fecha = v.fecha.length >= 10 ? v.fecha.substring(0, 10) : v.fecha;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Pedido #${v.id}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: kText)),
            _estadoChip(v.estado),
          ]),
          const SizedBox(height: 4),
          Text(v.cliente?.nombreCompleto ?? 'Cliente #${v.clientesId}',
            style: const TextStyle(color: kTextMuted, fontSize: 13)),
          const SizedBox(height: 8),
          Row(children: [
            _dato(Icons.calendar_today_outlined, fecha),
            const SizedBox(width: 12),
            _dato(Icons.payment_outlined, v.metodoPago),
            const SizedBox(width: 12),
            _dato(Icons.shopping_bag_outlined, v.tipoVenta),
            const Spacer(),
            Text(fmt.format(v.total),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: kPrimary)),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, color: kTextMuted),
          ]),
        ]),
      ),
    );
  }

  Widget _dato(IconData icon, String text) => Row(children: [
    Icon(icon, size: 13, color: kTextMuted),
    const SizedBox(width: 3),
    Text(text, style: const TextStyle(color: kTextMuted, fontSize: 11)),
  ]);
}

Widget _estadoChip(String estado) {
  Color bg, fg;
  String label;
  switch (estado) {
    case 'activa':    bg = const Color(0xFFCCFBF1); fg = const Color(0xFF0F766E); label = 'Activa'; break;
    case 'pendiente': bg = const Color(0xFFFEF9C3); fg = const Color(0xFFB45309); label = 'Pendiente'; break;
    case 'anulada':   bg = const Color(0xFFFEE2E2); fg = const Color(0xFFDC2626); label = 'Anulada'; break;
    default:          bg = const Color(0xFFF3F4F6); fg = kTextMuted; label = estado;
  }
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20),
      border: Border.all(color: fg.withOpacity(0.4))),
    child: Text(label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}
