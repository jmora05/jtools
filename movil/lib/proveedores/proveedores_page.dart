import 'package:flutter/material.dart';
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

  Future<bool?> _confirmarEliminacion(BuildContext context, String nombre) {
    return showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar proveedor', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Eliminar a "$nombre"? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
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
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar proveedor...', prefix: const Icon(Icons.search, color: kTextMuted)),
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

        // ── Hint swipe ──────────────────────────────────────────────────────
        Container(
          color: const Color(0xFFF0F4FF),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(children: [
            const Icon(Icons.swipe_left, size: 14, color: kTextMuted),
            const SizedBox(width: 6),
            const Text(
              'Desliza ← para eliminar',
              style: TextStyle(fontSize: 11, color: kTextMuted),
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
                  Icon(Icons.business_outlined, size: 64, color: kBorder),
                  SizedBox(height: 12),
                  Text('No hay proveedores', style: TextStyle(color: kTextMuted, fontSize: 16)),
                ]))
              : RefreshIndicator(
                  color: kPrimary,
                  onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (_, i) {
                      final p = lista[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Dismissible(
                          key: ValueKey('prov_${p.id}'),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 24),
                            decoration: BoxDecoration(
                              color: kError,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(mainAxisSize: MainAxisSize.min, children: [
                              Text('Eliminar', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                              SizedBox(width: 8),
                              Icon(Icons.delete_outline, color: Colors.white, size: 22),
                            ]),
                          ),
                          confirmDismiss: (_) => _confirmarEliminacion(context, p.nombreEmpresa),
                          onDismissed: (_) async {
                            try {
                              await prov.eliminar(p.id);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                  content: Text('${p.nombreEmpresa} eliminado'),
                                  backgroundColor: kError,
                                  behavior: SnackBarBehavior.floating,
                                  duration: const Duration(seconds: 2),
                                ));
                              }
                            } catch (_) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                                  content: Text('Error al eliminar'),
                                  backgroundColor: kError,
                                  behavior: SnackBarBehavior.floating,
                                ));
                              }
                            }
                          },
                          child: _ProveedorCard(p: p),
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

class _ProveedorCard extends StatelessWidget {
  final Proveedor p;
  const _ProveedorCard({required this.p});

  @override
  Widget build(BuildContext context) => Card(
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        backgroundColor: p.activo ? kChipBg : Colors.grey.shade200,
        child: Icon(Icons.business, color: p.activo ? kPrimaryDark : Colors.grey, size: 20),
      ),
      title: Text(p.nombreEmpresa, style: const TextStyle(fontWeight: FontWeight.w600, color: kText)),
      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 2),
        Text('${p.tipoDocumento} ${p.numeroDocumento}', style: const TextStyle(color: kTextMuted, fontSize: 13)),
        const SizedBox(height: 4),
        _chip(p.activo ? 'Activo' : 'Inactivo', p.activo ? kPrimary : Colors.grey),
      ]),
      trailing: const Icon(Icons.chevron_right, color: kTextMuted),
      onTap: () => Navigator.push(context,
        MaterialPageRoute(builder: (_) => ProveedorDetallePage(proveedor: p))),
    ),
  );

  Widget _chip(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color: color.withOpacity(0.12),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.4)),
    ),
    child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}
