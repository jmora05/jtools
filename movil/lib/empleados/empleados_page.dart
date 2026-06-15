import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/logout_button.dart';
import 'empleado_provider.dart';
import 'empleado_model.dart';
import 'empleado_detalle_page.dart';
import 'empleado_form_page.dart';

class EmpleadosPage extends StatefulWidget {
  const EmpleadosPage({super.key});
  @override State<EmpleadosPage> createState() => _EmpleadosPageState();
}

class _EmpleadosPageState extends State<EmpleadosPage> {
  String _q = '';
  String _filtroEstado = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<EmpleadoProvider>().cargar());
  }

  Future<void> _toggleEstado(BuildContext ctx, Empleado e) async {
    final desactivar = e.activo;
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          desactivar ? 'Desactivar empleado' : 'Activar empleado',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        content: Text(desactivar
          ? '¿Desactivar a "${e.nombreCompleto}"? No podrá aparecer en nóminas nuevas.'
          : '¿Activar a "${e.nombreCompleto}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: desactivar ? kTextMuted : kPrimary,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(desactivar ? 'Desactivar' : 'Activar'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      if (desactivar) {
        await ctx.read<EmpleadoProvider>().desactivar(e.id);
      } else {
        await ctx.read<EmpleadoProvider>().reactivar(e.id);
      }
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('${e.nombres} ${desactivar ? 'desactivado' : 'activado'}'),
        backgroundColor: desactivar ? kTextMuted : kPrimary,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ));
    } catch (_) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
        content: Text('Error al cambiar el estado'),
        backgroundColor: kError,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _eliminar(BuildContext ctx, Empleado e) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar empleado',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Eliminar a "${e.nombreCompleto}"? Esta acción no se puede deshacer.'),
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
      await ctx.read<EmpleadoProvider>().eliminar(e.id);
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('${e.nombreCompleto} eliminado'),
        backgroundColor: kError,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ));
    } catch (_) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
        content: Text('Error al eliminar'),
        backgroundColor: kError,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<EmpleadoProvider>();
    final lista = prov.empleados.where((e) {
      final matchQ = e.nombreCompleto.toLowerCase().contains(_q.toLowerCase()) ||
          e.numeroDocumento.contains(_q) ||
          e.cargo.toLowerCase().contains(_q.toLowerCase());
      final matchE = _filtroEstado == 'todos' ||
          (_filtroEstado == 'activo' && e.activo) ||
          (_filtroEstado == 'inactivo' && !e.activo);
      return matchQ && matchE;
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Empleados', style: TextStyle(fontWeight: FontWeight.w700)),
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
              decoration: kInputDeco('Buscar empleado...',
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

        // ── Lista ─────────────────────────────────────────────────────────────
        Expanded(child: prov.loading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : prov.error != null
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.error_outline, color: kError, size: 48),
                const SizedBox(height: 12),
                Text(prov.error!, textAlign: TextAlign.center,
                  style: const TextStyle(color: kError)),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: prov.cargar, child: const Text('Reintentar')),
              ]))
            : lista.isEmpty
              ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.people_outline, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay empleados',
                    style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (ctx, i) {
                      final e = lista[i];
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
                              key: ValueKey('emp_${e.id}'),
                              // ── Swipe derecha: Ver + Editar ──────────────
                              startActionPane: ActionPane(
                                motion: const DrawerMotion(),
                                extentRatio: 0.5,
                                children: [
                                  SlidableAction(
                                    onPressed: (_) => Navigator.push(ctx,
                                      MaterialPageRoute(
                                        builder: (_) => EmpleadoDetallePage(empleado: e))),
                                    backgroundColor: kPrimary,
                                    foregroundColor: Colors.white,
                                    icon: Icons.info_outline,
                                    label: 'Ver detalle',
                                  ),
                                  SlidableAction(
                                    onPressed: (_) => Navigator.push(ctx,
                                      MaterialPageRoute(
                                        builder: (_) => EmpleadoFormPage(empleado: e))),
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
                                    onPressed: (_) => _toggleEstado(ctx, e),
                                    backgroundColor: e.activo ? kTextMuted : kPrimary,
                                    foregroundColor: Colors.white,
                                    icon: e.activo
                                      ? Icons.block_outlined
                                      : Icons.check_circle_outline,
                                    label: e.activo ? 'Desactivar' : 'Activar',
                                  ),
                                  SlidableAction(
                                    onPressed: (_) => _eliminar(ctx, e),
                                    backgroundColor: kError,
                                    foregroundColor: Colors.white,
                                    icon: Icons.delete_outline,
                                    label: 'Eliminar',
                                  ),
                                ],
                              ),
                              child: _EmpleadoTile(
                                e: e,
                                onTap: () => Navigator.push(ctx,
                                  MaterialPageRoute(
                                    builder: (_) => EmpleadoDetallePage(empleado: e))),
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
        icon: const Icon(Icons.person_add, color: Colors.white),
        label: const Text('Nuevo', style: TextStyle(color: Colors.white)),
        onPressed: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => const EmpleadoFormPage())),
      ),
    );
  }
}

// ── Tile (sin Card propio; el Card envuelve el Slidable) ──────────────────────
class _EmpleadoTile extends StatelessWidget {
  final Empleado e;
  final VoidCallback onTap;
  const _EmpleadoTile({required this.e, required this.onTap});

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    tileColor: Colors.white,
    leading: CircleAvatar(
      backgroundColor: e.activo ? kChipBg : Colors.grey.shade200,
      child: Text(
        e.nombres.isNotEmpty ? e.nombres[0].toUpperCase() : '?',
        style: TextStyle(
          color: e.activo ? kPrimaryDark : Colors.grey,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
    title: Text(e.nombreCompleto,
      style: const TextStyle(fontWeight: FontWeight.w600, color: kText)),
    subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SizedBox(height: 2),
      Text(e.cargo, style: const TextStyle(color: kTextMuted, fontSize: 13)),
      const SizedBox(height: 4),
      Row(children: [
        estadoChip(e.activo ? 'activo' : 'inactivo'),
        const SizedBox(width: 6),
        _areaChip(e.area),
      ]),
    ]),
    trailing: const Icon(Icons.chevron_right, color: kTextMuted),
    onTap: onTap,
  );

  Widget _areaChip(String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color: kPrimaryLight.withOpacity(0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: kPrimaryLight.withOpacity(0.4)),
    ),
    child: Text(label,
      style: const TextStyle(
        color: kPrimaryLight, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}
