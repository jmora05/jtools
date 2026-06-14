import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/scaffold_key.dart';
import 'insumo_provider.dart';
import 'insumo_model.dart';
import 'insumo_detalle_page.dart';
import 'insumo_form_page.dart';

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

  Future<void> _toggleEstado(BuildContext ctx, Insumo insumo) async {
    final nuevoEstado = insumo.estado == 'disponible' ? 'agotado' : 'disponible';
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          insumo.estado == 'disponible' ? 'Marcar como agotado' : 'Marcar como disponible',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        content: Text(insumo.estado == 'disponible'
          ? '¿Marcar "${insumo.nombreInsumo}" como agotado?'
          : '¿Marcar "${insumo.nombreInsumo}" como disponible?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: nuevoEstado == 'disponible' ? kPrimary : kTextMuted,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(nuevoEstado == 'disponible' ? 'Disponible' : 'Agotado'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<InsumoProvider>().cambiarEstado(insumo.id, nuevoEstado);
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text('"${insumo.nombreInsumo}" marcado como $nuevoEstado'),
          backgroundColor: nuevoEstado == 'disponible' ? kPrimary : kTextMuted,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: kError,
          behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }

  Future<void> _eliminar(BuildContext ctx, Insumo insumo) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Desactivar insumo',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('¿Desactivar "${insumo.nombreInsumo}"?'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: kChipBg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: kBorder),
            ),
            child: const Text(
              'El insumo quedará marcado como "Agotado" y no podrá usarse en nuevas compras.',
              style: TextStyle(fontSize: 12, color: kTextMuted),
            ),
          ),
        ]),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Desactivar'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<InsumoProvider>().eliminar(insumo.id);
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text('"${insumo.nombreInsumo}" desactivado'),
          backgroundColor: kTextMuted,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: kError,
          behavior: SnackBarBehavior.floating,
        ));
      }
    }
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
          (_filtro == 'agotado' && i.agotado);
      return matchQ && matchF;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => mainScaffoldKey.currentState?.openDrawer(),
        ),
        title: const Text('Insumos', style: TextStyle(fontWeight: FontWeight.w700)),
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
              decoration: kInputDeco('Buscar insumo...',
                prefix: const Icon(Icons.search, color: kTextMuted)),
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

        // ── Hint swipe ─────────────────────────────────────────────────────────
        Container(
          color: const Color(0xFFF0F4FF),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: const Row(children: [
            Icon(Icons.swipe, size: 14, color: kTextMuted),
            SizedBox(width: 6),
            Text('→ Ver / Editar  ·  ← Cambiar estado / Desactivar',
              style: TextStyle(fontSize: 11, color: kTextMuted)),
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
                  Icon(Icons.inventory_2_outlined, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay insumos',
                    style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (ctx, i) {
                      final ins = lista[i];
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
                              key: ValueKey('ins_${ins.id}'),
                              // ── Swipe derecha: Ver + Editar ─────────────────
                              startActionPane: ActionPane(
                                motion: const DrawerMotion(),
                                extentRatio: 0.5,
                                children: [
                                  SlidableAction(
                                    onPressed: (_) => Navigator.push(ctx,
                                      MaterialPageRoute(
                                        builder: (_) => InsumoDetallePage(insumo: ins))),
                                    backgroundColor: kPrimary,
                                    foregroundColor: Colors.white,
                                    icon: Icons.info_outline,
                                    label: 'Ver detalle',
                                  ),
                                  SlidableAction(
                                    onPressed: (_) => Navigator.push(ctx,
                                      MaterialPageRoute(
                                        builder: (_) => InsumoFormPage(insumo: ins))),
                                    backgroundColor: kPrimaryLight,
                                    foregroundColor: Colors.white,
                                    icon: Icons.edit_outlined,
                                    label: 'Editar',
                                  ),
                                ],
                              ),
                              // ── Swipe izquierda: Cambiar estado + Desactivar
                              endActionPane: ActionPane(
                                motion: const DrawerMotion(),
                                extentRatio: 0.5,
                                children: [
                                  SlidableAction(
                                    onPressed: (_) => _toggleEstado(ctx, ins),
                                    backgroundColor: ins.disponible ? kTextMuted : kPrimary,
                                    foregroundColor: Colors.white,
                                    icon: ins.disponible
                                      ? Icons.inventory_2_outlined
                                      : Icons.check_circle_outline,
                                    label: ins.disponible ? 'Agotar' : 'Disponible',
                                  ),
                                  SlidableAction(
                                    onPressed: (_) => _eliminar(ctx, ins),
                                    backgroundColor: kError,
                                    foregroundColor: Colors.white,
                                    icon: Icons.delete_outline,
                                    label: 'Desactivar',
                                  ),
                                ],
                              ),
                              child: _InsumoTile(
                                insumo: ins,
                                fmt: fmt,
                                onTap: () => Navigator.push(ctx,
                                  MaterialPageRoute(
                                    builder: (_) => InsumoDetallePage(insumo: ins))),
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
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kPrimary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Nuevo insumo', style: TextStyle(color: Colors.white)),
        onPressed: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => const InsumoFormPage())),
      ),
    );
  }
}

// ── Tile de insumo ─────────────────────────────────────────────────────────────
class _InsumoTile extends StatelessWidget {
  final Insumo insumo;
  final NumberFormat fmt;
  final VoidCallback onTap;
  const _InsumoTile({required this.insumo, required this.fmt, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final Color stockColor;
    final String stockLabel;
    if (insumo.cantidad == 0 || insumo.agotado) {
      stockColor = kError;
      stockLabel = 'Agotado';
    } else if (insumo.stockBajo) {
      stockColor = kTextMuted;
      stockLabel = 'Stock bajo';
    } else {
      stockColor = kPrimary;
      stockLabel = 'Disponible';
    }

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Text(insumo.nombreInsumo,
              style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 15, color: kText))),
            estadoChip(insumo.estado, customLabel: stockLabel),
          ]),
          if (insumo.codigoInsumo != null) ...[
            const SizedBox(height: 4),
            Text('Cód: ${insumo.codigoInsumo}',
              style: const TextStyle(color: kTextMuted, fontSize: 12)),
          ],
          const SizedBox(height: 10),
          Row(children: [
            _dato(Icons.straighten, insumo.unidadMedida),
            const SizedBox(width: 16),
            _dato(Icons.inventory_2_outlined,
              'Stock: ${insumo.cantidad} ${insumo.unidadMedida}',
              color: stockColor),
            const Spacer(),
            Text(fmt.format(insumo.precioUnitario),
              style: const TextStyle(
                fontWeight: FontWeight.w800, fontSize: 16, color: kPrimary)),
          ]),
        ]),
      ),
    );
  }

  Widget _dato(IconData icon, String text, {Color color = kTextMuted}) =>
    Row(children: [
      Icon(icon, size: 14, color: color),
      const SizedBox(width: 4),
      Text(text, style: TextStyle(color: color, fontSize: 12)),
    ]);
}
