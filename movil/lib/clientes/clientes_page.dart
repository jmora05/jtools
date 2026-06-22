import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/scaffold_key.dart';
import 'cliente_model.dart';
import 'cliente_provider.dart';
import 'cliente_form_page.dart';
import 'cliente_detalle_page.dart';

class ClientesPage extends StatefulWidget {
  const ClientesPage({super.key});
  @override State<ClientesPage> createState() => _ClientesPageState();
}

class _ClientesPageState extends State<ClientesPage> {
  String _q = '';
  String _filtro = 'todos';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) =>
      context.read<ClienteProvider>().cargar());
  }

  Future<void> _toggleEstado(BuildContext ctx, Cliente c) async {
    final nuevoEstado = c.activo ? 'inactivo' : 'activo';
    final label = c.activo ? 'desactivar' : 'activar';
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('${label[0].toUpperCase()}${label.substring(1)} cliente',
          style: const TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Deseas $label a ${c.nombreCompleto}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: c.activo ? kWarning : const Color(0xFF16A34A),
              foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(label[0].toUpperCase() + label.substring(1)),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<ClienteProvider>().cambiarEstado(c.id, nuevoEstado);
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('${c.nombreCompleto} ${nuevoEstado == 'activo' ? 'activado' : 'desactivado'}'),
        backgroundColor: nuevoEstado == 'activo' ? const Color(0xFF16A34A) : kWarning,
        behavior: SnackBarBehavior.floating, duration: const Duration(seconds: 2),
      ));
    } catch (e) {
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
  }

  Future<void> _eliminar(BuildContext ctx, Cliente c) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar cliente', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Eliminar a ${c.nombreCompleto}? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<ClienteProvider>().eliminar(c.id);
      if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
        content: Text('${c.nombreCompleto} eliminado'),
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
    final prov = context.watch<ClienteProvider>();

    final lista = prov.clientes.where((c) {
      final q = _q.toLowerCase();
      final matchQ = c.nombreCompleto.toLowerCase().contains(q) ||
          c.email.toLowerCase().contains(q) ||
          c.numeroDocumento.contains(q);
      final matchF = _filtro == 'todos' ||
          (_filtro == 'activo' && c.activo) ||
          (_filtro == 'inactivo' && !c.activo);
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
        title: const Text('Clientes', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar)],
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar por nombre, email o documento...',
                prefix: const Icon(Icons.search, color: kTextMuted)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                for (final f in [('todos','Todos'),('activo','Activo'),('inactivo','Inactivo')])
                  Padding(
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
                  Icon(Icons.people_outline, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay clientes', style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary, onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (ctx, i) {
                      final c = lista[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Card(
                          margin: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 1,
                          clipBehavior: Clip.hardEdge,
                          child: Slidable(
                            key: ValueKey('cliente_${c.id}'),
                            startActionPane: ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: 0.5,
                              children: [
                                SlidableAction(
                                  onPressed: (_) => Navigator.push(ctx,
                                    MaterialPageRoute(builder: (_) => ClienteDetallePage(clienteId: c.id))),
                                  backgroundColor: kPrimary,
                                  foregroundColor: Colors.white,
                                  icon: Icons.info_outline,
                                  label: 'Ver detalle',
                                ),
                                SlidableAction(
                                  onPressed: (_) => Navigator.push(ctx,
                                    MaterialPageRoute(builder: (_) => ClienteFormPage(cliente: c))),
                                  backgroundColor: kPrimaryLight,
                                  foregroundColor: Colors.white,
                                  icon: Icons.edit_outlined,
                                  label: 'Editar',
                                ),
                              ],
                            ),
                            endActionPane: ActionPane(
                              motion: const DrawerMotion(),
                              extentRatio: 0.5,
                              children: [
                                SlidableAction(
                                  onPressed: (_) => _toggleEstado(ctx, c),
                                  backgroundColor: c.activo ? kWarning : const Color(0xFF16A34A),
                                  foregroundColor: Colors.white,
                                  icon: c.activo ? Icons.block : Icons.check_circle_outline,
                                  label: c.activo ? 'Desactivar' : 'Activar',
                                ),
                                SlidableAction(
                                  onPressed: (_) => _eliminar(ctx, c),
                                  backgroundColor: kError,
                                  foregroundColor: Colors.white,
                                  icon: Icons.delete_outline,
                                  label: 'Eliminar',
                                ),
                              ],
                            ),
                            child: _ClienteTile(
                              c: c,
                              onTap: () => Navigator.push(ctx,
                                MaterialPageRoute(builder: (_) => ClienteDetallePage(clienteId: c.id))),
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
        icon: const Icon(Icons.person_add_outlined, color: Colors.white),
        label: const Text('Nuevo cliente', style: TextStyle(color: Colors.white)),
        onPressed: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => const ClienteFormPage())),
      ),
    );
  }
}

class _ClienteTile extends StatelessWidget {
  final Cliente c;
  final VoidCallback onTap;
  const _ClienteTile({required this.c, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Text(c.nombreCompleto,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: kText))),
            _estadoChipLocal(c.activo),
          ]),
          if (c.razonSocial != null && c.razonSocial!.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(c.razonSocial!, style: const TextStyle(color: kTextMuted, fontSize: 12)),
          ],
          const SizedBox(height: 6),
          Row(children: [
            _dato(Icons.email_outlined, c.email),
            const Spacer(),
            const Icon(Icons.chevron_right, color: kTextMuted),
          ]),
          const SizedBox(height: 4),
          Row(children: [
            _dato(Icons.phone_outlined, c.telefono),
            const SizedBox(width: 12),
            _dato(Icons.location_city_outlined, c.ciudad),
          ]),
        ]),
      ),
    );
  }

  Widget _dato(IconData icon, String text) => Row(children: [
    Icon(icon, size: 13, color: kTextMuted),
    const SizedBox(width: 4),
    Text(text, style: const TextStyle(color: kTextMuted, fontSize: 12)),
  ]);
}

Widget _estadoChipLocal(bool activo) => Container(
  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
  decoration: BoxDecoration(
    color: activo ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
    borderRadius: BorderRadius.circular(20),
    border: Border.all(
      color: activo ? const Color(0xFF16A34A).withOpacity(0.4) : kTextMuted.withOpacity(0.4)),
  ),
  child: Text(activo ? 'Activo' : 'Inactivo',
    style: TextStyle(
      color: activo ? const Color(0xFF16A34A) : kTextMuted,
      fontSize: 11, fontWeight: FontWeight.w600)),
);
