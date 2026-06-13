import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EmpleadoProvider>().cargar();
    });
  }

  Future<bool?> _confirmarEliminacion(BuildContext context, String nombre) {
    return showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar empleado', style: TextStyle(fontWeight: FontWeight.w700)),
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
        backgroundColor: kPrimaryDark,
        foregroundColor: Colors.white,
        title: const Text('Empleados', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: prov.cargar),
        ],
      ),
      body: Column(children: [
        // ── Buscador + filtro ──────────────────────────────────────────────
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(children: [
            TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: kInputDeco('Buscar empleado...', prefix: const Icon(Icons.search, color: kTextMuted)),
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
            const Icon(Icons.swipe, size: 14, color: kTextMuted),
            const SizedBox(width: 6),
            Text(
              'Desliza → para activar/desactivar   |   ← para eliminar',
              style: const TextStyle(fontSize: 11, color: kTextMuted),
            ),
          ]),
        ),

        // ── Contenido ──────────────────────────────────────────────────────
        Expanded(child: prov.loading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : prov.error != null
            ? _errorView(prov)
            : lista.isEmpty
              ? _emptyView()
              : RefreshIndicator(
                  color: kPrimary,
                  onRefresh: prov.cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: lista.length,
                    itemBuilder: (_, i) {
                      final e = lista[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Dismissible(
                          key: ValueKey('emp_${e.id}'),
                          direction: DismissDirection.horizontal,
                          // Fondo al deslizar → (toggle activo/inactivo)
                          background: _swipeBg(
                            alignment: Alignment.centerLeft,
                            color: e.activo ? Colors.orange.shade600 : Colors.green.shade600,
                            icon: e.activo ? Icons.block : Icons.check_circle_outline,
                            label: e.activo ? 'Desactivar' : 'Activar',
                            padding: const EdgeInsets.only(left: 24),
                          ),
                          // Fondo al deslizar ← (eliminar)
                          secondaryBackground: _swipeBg(
                            alignment: Alignment.centerRight,
                            color: kError,
                            icon: Icons.delete_outline,
                            label: 'Eliminar',
                            padding: const EdgeInsets.only(right: 24),
                          ),
                          confirmDismiss: (direction) async {
                            if (direction == DismissDirection.startToEnd) {
                              // Toggle — no eliminar de la lista
                              try {
                                if (e.activo) {
                                  await prov.desactivar(e.id);
                                } else {
                                  await prov.reactivar(e.id);
                                }
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                    content: Text(e.activo
                                        ? '${e.nombres} desactivado'
                                        : '${e.nombres} activado'),
                                    backgroundColor: e.activo ? Colors.orange : Colors.green,
                                    behavior: SnackBarBehavior.floating,
                                    duration: const Duration(seconds: 2),
                                  ));
                                }
                              } catch (_) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                                    content: Text('Error al cambiar el estado'),
                                    backgroundColor: kError,
                                    behavior: SnackBarBehavior.floating,
                                  ));
                                }
                              }
                              return false; // No remover de la lista
                            } else {
                              // Confirmar eliminación
                              return _confirmarEliminacion(context, e.nombreCompleto);
                            }
                          },
                          onDismissed: (direction) async {
                            if (direction == DismissDirection.endToStart) {
                              try {
                                await prov.eliminar(e.id);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                    content: Text('${e.nombreCompleto} eliminado'),
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
                            }
                          },
                          child: _EmpleadoCard(e: e),
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

  Widget _swipeBg({
    required Alignment alignment,
    required Color color,
    required IconData icon,
    required String label,
    required EdgeInsets padding,
  }) {
    return Container(
      alignment: alignment,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: alignment == Alignment.centerLeft
            ? [
                Icon(icon, color: Colors.white, size: 22),
                const SizedBox(width: 8),
                Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
              ]
            : [
                Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(width: 8),
                Icon(icon, color: Colors.white, size: 22),
              ],
      ),
    );
  }

  Widget _errorView(EmpleadoProvider p) => Center(child: Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      const Icon(Icons.error_outline, color: kError, size: 48),
      const SizedBox(height: 12),
      Text(p.error!, textAlign: TextAlign.center, style: const TextStyle(color: kError)),
      const SizedBox(height: 16),
      ElevatedButton(onPressed: p.cargar, child: const Text('Reintentar')),
    ],
  ));

  Widget _emptyView() => const Center(child: Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(Icons.people_outline, size: 64, color: kBorder),
      SizedBox(height: 12),
      Text('No hay empleados', style: TextStyle(color: kTextMuted, fontSize: 16)),
    ],
  ));
}

class _EmpleadoCard extends StatelessWidget {
  final Empleado e;
  const _EmpleadoCard({required this.e});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: e.activo ? kChipBg : Colors.grey.shade200,
          child: Text(
            e.nombres.isNotEmpty ? e.nombres[0].toUpperCase() : '?',
            style: TextStyle(color: e.activo ? kPrimaryDark : Colors.grey, fontWeight: FontWeight.w700),
          ),
        ),
        title: Text(e.nombreCompleto, style: const TextStyle(fontWeight: FontWeight.w600, color: kText)),
        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SizedBox(height: 2),
          Text(e.cargo, style: const TextStyle(color: kTextMuted, fontSize: 13)),
          const SizedBox(height: 4),
          Row(children: [
            _chip(e.activo ? 'Activo' : 'Inactivo', e.activo ? kPrimary : Colors.grey),
            const SizedBox(width: 6),
            _chip(e.area, kPrimaryLight),
          ]),
        ]),
        trailing: const Icon(Icons.chevron_right, color: kTextMuted),
        onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => EmpleadoDetallePage(empleado: e))),
      ),
    );
  }

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
