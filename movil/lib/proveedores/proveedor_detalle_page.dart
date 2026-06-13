import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'proveedor_model.dart';
import 'proveedor_provider.dart';
import 'proveedor_form_page.dart';

class ProveedorDetallePage extends StatelessWidget {
  final Proveedor proveedor;
  const ProveedorDetallePage({super.key, required this.proveedor});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 150,
          pinned: true,
          backgroundColor: kPrimaryDark,
          foregroundColor: Colors.white,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 40, 20, 16),
                child: Row(children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white24,
                    child: Icon(
                      proveedor.tipoProveedor == 'empresa' ? Icons.business : Icons.person,
                      color: Colors.white, size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(proveedor.nombreEmpresa,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text(proveedor.tipoProveedor == 'empresa' ? 'Empresa' : 'Persona Natural',
                        style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 6),
                      _badge(proveedor.activo),
                    ],
                  )),
                ]),
              )),
            ),
          ),
          actions: [
            if (proveedor.activo)
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => ProveedorFormPage(proveedor: proveedor))),
              ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (v) => _accion(context, v),
              itemBuilder: (_) => [
                PopupMenuItem(
                  value: 'toggle',
                  child: Text(
                    proveedor.activo ? 'Desactivar' : 'Activar',
                    style: TextStyle(
                      color: proveedor.activo ? kWarning : const Color(0xFF16A34A)),
                  ),
                ),
                const PopupMenuItem(
                  value: 'eliminar',
                  child: Text('Eliminar', style: TextStyle(color: kError)),
                ),
              ],
            ),
          ],
        ),
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _seccion('Identificación', [
              _fila('Tipo documento', proveedor.tipoDocumento),
              _fila('Número', proveedor.numeroDocumento),
              if (proveedor.personaContacto != null)
                _fila('Contacto', proveedor.personaContacto!, icon: Icons.person_outline),
            ]),
            _seccion('Contacto', [
              _fila('Email', proveedor.email, icon: Icons.email_outlined),
              _fila('Teléfono', proveedor.telefono, icon: Icons.phone_outlined),
              if (proveedor.ciudad?.isNotEmpty ?? false)
                _fila('Ciudad', proveedor.ciudad!, icon: Icons.location_city_outlined),
              if (proveedor.direccion?.isNotEmpty ?? false)
                _fila('Dirección', proveedor.direccion!, icon: Icons.home_outlined),
            ]),
            const SizedBox(height: 60),
          ]),
        )),
      ]),
    );
  }

  Future<void> _accion(BuildContext ctx, String accion) async {
    final prov = ctx.read<ProveedorProvider>();

    if (accion == 'toggle') {
      final nuevoEstado = proveedor.activo ? 'inactivo' : 'activo';
      final ok = await showDialog<bool>(
        context: ctx,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(proveedor.activo ? 'Desactivar proveedor' : 'Activar proveedor',
            style: const TextStyle(fontWeight: FontWeight.w700)),
          content: Text(proveedor.activo
            ? '¿Desactivar a "${proveedor.nombreEmpresa}"? No podrá usarse en nuevas compras.'
            : '¿Activar a "${proveedor.nombreEmpresa}"?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: proveedor.activo ? kWarning : const Color(0xFF16A34A),
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(proveedor.activo ? 'Desactivar' : 'Activar'),
            ),
          ],
        ),
      );
      if (ok != true || !ctx.mounted) return;
      try {
        await prov.cambiarEstado(proveedor.id, nuevoEstado);
        if (ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
            content: Text('${proveedor.nombreEmpresa} '
              '${nuevoEstado == 'activo' ? 'activado' : 'desactivado'}'),
            backgroundColor: nuevoEstado == 'activo'
              ? const Color(0xFF16A34A) : kWarning,
            behavior: SnackBarBehavior.floating,
          ));
          Navigator.pop(ctx);
        }
      } catch (e) {
        if (ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: kError));
        }
      }
      return;
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar proveedor',
          style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Eliminar a "${proveedor.nombreEmpresa}"? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
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
      await prov.eliminar(proveedor.id);
      if (ctx.mounted) Navigator.pop(ctx);
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: kError));
      }
    }
  }

  Widget _badge(bool activo) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    decoration: BoxDecoration(
      color: Colors.white24, border: Border.all(color: Colors.white54),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(activo ? 'Activo' : 'Inactivo',
      style: TextStyle(color: activo ? Colors.white : Colors.white54,
        fontSize: 12, fontWeight: FontWeight.w600)),
  );

  Widget _seccion(String titulo, List<Widget> filas) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
        child: Text(titulo.toUpperCase(), style: kLabel)),
      ...filas,
    ]),
  );

  Widget _fila(String label, String value, {IconData? icon}) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(children: [
      if (icon != null) ...[Icon(icon, size: 16, color: kTextMuted), const SizedBox(width: 8)],
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: kLabel),
        const SizedBox(height: 2),
        Text(value.isNotEmpty ? value : '—',
          style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );
}
