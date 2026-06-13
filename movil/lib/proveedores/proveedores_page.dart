import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'proveedor_provider.dart';
import 'proveedor_model.dart';
import 'proveedor_detalle_page.dart';
import 'proveedor_form_page.dart';

class ProveedoresPage extends StatefulWidget {
  const ProveedoresPage({super.key});
  @override State<ProveedoresPage> createState() => _ProveedoresPageState();
}

class _ProveedoresPageState extends State<ProveedoresPage> {
  String _q = '';
  String _filtroEstado = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<ProveedorProvider>().cargar());
  }

  Future<void> _toggleEstado(BuildContext ctx, Proveedor p) async {
    final nuevoEstado = p.activo ? 'inactivo' : 'activo';
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          p.activo ? 'Desactivar proveedor' : 'Activar proveedor',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        content: Text(p.activo
          ? '¿Desactivar a "${p.nombreEmpresa}"? No podrá usarse en nuevas compras.'
          : '¿Activar a "${p.nombreEmpresa}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: p.activo ? kWarning : const Color(0xFF16A34A),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(p.activo ? 'Desactivar' : 'Activar'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<ProveedorProvider>().cambiarEstado(p.id, nuevoEstado);
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text(
            '${p.nombreEmpresa} ${nuevoEstado == 'activo' ? 'activado' : 'desactivado'}'),
          backgroundColor: nuevoEstado == 'activo' ? const Color(0xFF16A34A) : kWarning,
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

  Future<void> _eliminar(BuildContext ctx, Proveedor p) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar proveedor',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Eliminar a "${p.nombreEmpresa}"? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<ProveedorProvider>().eliminar(p.id);
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text('${p.nombreEmpresa} eliminado'),
          backgroundColor: kError,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
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
    final prov = context.watch<ProveedorProvider>();
    final lista = prov.proveedores.where((p) {
      final matchQ = p.nombreEmpresa.toLowerCase().contains(_q.toLowerCase()) ||
          p.numeroDocumento.contains(_q) ||
          (p.personaContacto?.toLowerCase().contains(_q.toLowerCase()) ?? false);
      final matchE = _filtroEstado == 'todos' ||
          (_filtroEstado == 'activo' && p.activo) ||
          (_filtroEstado == 'inactivo' && !p.activo);
      return matchQ && matchE;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark,
        foregroundColor: Colors.white,
        title: const Text('Proveedores', style: TextStyle(fontWeight: FontWeight.w700)),
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
              decoration: kInputDeco('Buscar proveedor...',
                prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['todos', 'activo', 'inactivo'].map((f) => Padding(
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
                )).toList(),
              ),
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
              '→ Ver / Editar  ·  ← Activar / Eliminar',
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
                  Icon(Icons.business_outlined, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay proveedores',
                    style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary,
                  onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (ctx, i) {
                      final p = lista[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Card(
                          margin: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                          elevation: 1,
                          clipBehavior: Clip.hardEdge,
                          child: Slidable(
                            key: ValueKey('prov_${p.id}'),
                            // ── Swipe derecha: Ver detalle + Editar ──────────
                            startActionPane: ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: 0.5,
                              children: [
                                SlidableAction(
                                  onPressed: (_) => Navigator.push(ctx,
                                    MaterialPageRoute(
                                      builder: (_) => ProveedorDetallePage(proveedor: p))),
                                  backgroundColor: kPrimary,
                                  foregroundColor: Colors.white,
                                  icon: Icons.info_outline,
                                  label: 'Ver detalle',
                                ),
                                SlidableAction(
                                  onPressed: (_) => Navigator.push(ctx,
                                    MaterialPageRoute(
                                      builder: (_) => ProveedorFormPage(proveedor: p))),
                                  backgroundColor: kPrimaryLight,
                                  foregroundColor: Colors.white,
                                  icon: Icons.edit_outlined,
                                  label: 'Editar',
                                ),
                              ],
                            ),
                            // ── Swipe izquierda: Activar/Desactivar + Eliminar
                            endActionPane: ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: 0.5,
                              children: [
                                SlidableAction(
                                  onPressed: (_) => _toggleEstado(ctx, p),
                                  backgroundColor: p.activo
                                    ? kWarning
                                    : const Color(0xFF16A34A),
                                  foregroundColor: Colors.white,
                                  icon: p.activo
                                    ? Icons.block_outlined
                                    : Icons.check_circle_outline,
                                  label: p.activo ? 'Desactivar' : 'Activar',
                                ),
                                SlidableAction(
                                  onPressed: (_) => _eliminar(ctx, p),
                                  backgroundColor: kError,
                                  foregroundColor: Colors.white,
                                  icon: Icons.delete_outline,
                                  label: 'Eliminar',
                                ),
                              ],
                            ),
                            child: _ProveedorTile(
                              p: p,
                              onTap: () => Navigator.push(ctx,
                                MaterialPageRoute(
                                  builder: (_) => ProveedorDetallePage(proveedor: p))),
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
        icon: const Icon(Icons.add_business, color: Colors.white),
        label: const Text('Nuevo', style: TextStyle(color: Colors.white)),
        onPressed: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => const ProveedorFormPage())),
      ),
    );
  }
}

// ── Tile de proveedor (sin Card propio; el Card envuelve el Slidable) ──────────
class _ProveedorTile extends StatelessWidget {
  final Proveedor p;
  final VoidCallback onTap;
  const _ProveedorTile({required this.p, required this.onTap});

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    tileColor: Colors.white,
    leading: CircleAvatar(
      backgroundColor: p.activo ? kChipBg : Colors.grey.shade200,
      child: Icon(Icons.business,
        color: p.activo ? kPrimaryDark : Colors.grey, size: 20),
    ),
    title: Text(p.nombreEmpresa,
      style: const TextStyle(fontWeight: FontWeight.w600, color: kText)),
    subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SizedBox(height: 2),
      Text('${p.tipoDocumento} ${p.numeroDocumento}',
        style: const TextStyle(color: kTextMuted, fontSize: 13)),
      const SizedBox(height: 4),
      estadoChip(p.activo ? 'activo' : 'inactivo'),
    ]),
    trailing: const Icon(Icons.chevron_right, color: kTextMuted),
    onTap: onTap,
  );
}
