import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'insumo_model.dart';
import 'insumo_provider.dart';
import 'insumo_form_page.dart';

class InsumoDetallePage extends StatefulWidget {
  final Insumo insumo;
  const InsumoDetallePage({super.key, required this.insumo});
  @override State<InsumoDetallePage> createState() => _InsumoDetallePageState();
}

class _InsumoDetallePageState extends State<InsumoDetallePage> {
  // Mantiene la versión más fresca del insumo (actualizada tras acciones)
  late Insumo _insumo;

  @override
  void initState() {
    super.initState();
    _insumo = widget.insumo;
  }

  void _sincronizarDesdeProvider() {
    final prov = context.read<InsumoProvider>();
    final fresco = prov.insumos.where((i) => i.id == _insumo.id).firstOrNull;
    if (fresco != null && mounted) setState(() => _insumo = fresco);
  }

  Future<void> _cambiarEstado(BuildContext ctx) async {
    final nuevoEstado = _insumo.estado == 'disponible' ? 'agotado' : 'disponible';
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          _insumo.disponible ? 'Marcar como agotado' : 'Marcar como disponible',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        content: Text(_insumo.disponible
          ? '¿Marcar "${_insumo.nombreInsumo}" como agotado?'
          : '¿Marcar "${_insumo.nombreInsumo}" como disponible?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: nuevoEstado == 'disponible'
                ? const Color(0xFF16A34A) : kWarning,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(nuevoEstado == 'disponible' ? 'Marcar disponible' : 'Marcar agotado'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<InsumoProvider>().cambiarEstado(_insumo.id, nuevoEstado);
      _sincronizarDesdeProvider();
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text('Estado actualizado a "$nuevoEstado"'),
          backgroundColor: nuevoEstado == 'disponible'
            ? const Color(0xFF16A34A) : kWarning,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text(e.toString()), backgroundColor: kError,
          behavior: SnackBarBehavior.floating));
      }
    }
  }

  Future<void> _eliminarSoft(BuildContext ctx) async {
    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Desactivar insumo', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('¿Desactivar "${_insumo.nombreInsumo}"?'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF9C3),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFF59E0B)),
            ),
            child: const Text(
              'El insumo quedará marcado como "Agotado" y no podrá usarse en nuevas compras.',
              style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
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
      await ctx.read<InsumoProvider>().eliminar(_insumo.id);
      _sincronizarDesdeProvider();
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
          content: Text('Insumo desactivado'),
          backgroundColor: kWarning,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text(e.toString()), backgroundColor: kError,
          behavior: SnackBarBehavior.floating));
      }
    }
  }

  Future<void> _eliminarPermanente(BuildContext ctx) async {
    // Primero verifica dependencias
    bool cargando = true;
    Map<String, dynamic>? deps;
    if (ctx.mounted) {
      showDialog(
        context: ctx,
        barrierDismissible: false,
        builder: (_) => const AlertDialog(
          content: Row(children: [
            CircularProgressIndicator(),
            SizedBox(width: 16),
            Text('Verificando dependencias...'),
          ]),
        ),
      );
    }
    try {
      deps = await ctx.read<InsumoProvider>().getDependencias(_insumo.id);
    } catch (_) {
      deps = null;
    } finally {
      cargando = false;
    }
    if (!ctx.mounted) return;
    Navigator.pop(ctx); // cierra el dialog de carga

    final tieneDeps = (deps?['tieneDependencias'] == true) ||
                      ((deps?['total'] as num? ?? 0) > 0);
    if (tieneDeps) {
      showDialog(
        context: ctx,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('No se puede eliminar', style: TextStyle(fontWeight: FontWeight.w700)),
          content: const Text(
            'Este insumo tiene compras asociadas y no puede eliminarse permanentemente.'),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Entendido'),
            ),
          ],
        ),
      );
      return;
    }

    final ok = await showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Eliminar permanentemente',
          style: TextStyle(fontWeight: FontWeight.w700, color: kError)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('¿Eliminar definitivamente "${_insumo.nombreInsumo}"?'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: kError),
            ),
            child: const Text(
              'Esta acción es irreversible. El insumo se eliminará completamente del sistema.',
              style: TextStyle(fontSize: 12, color: Color(0xFF7F1D1D)),
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kError, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar definitivamente'),
          ),
        ],
      ),
    );
    if (ok != true || !ctx.mounted) return;
    try {
      await ctx.read<InsumoProvider>().forceDelete(_insumo.id);
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
          content: Text('Insumo eliminado permanentemente'),
          backgroundColor: kError,
          behavior: SnackBarBehavior.floating,
        ));
        Navigator.pop(ctx); // vuelve a la lista
      }
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
          content: Text(e.toString()), backgroundColor: kError,
          behavior: SnackBarBehavior.floating));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    final Color headerStart;
    final Color headerEnd;
    if (_insumo.disponible) {
      headerStart = kPrimaryDark;
      headerEnd   = kPrimary;
    } else if (_insumo.stockBajo) {
      headerStart = const Color(0xFF78350F);
      headerEnd   = kWarning;
    } else {
      headerStart = const Color(0xFF374151);
      headerEnd   = const Color(0xFF6B7280);
    }

    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(slivers: [
        // ── Header ────────────────────────────────────────────────────────────
        SliverAppBar(
          expandedHeight: 160,
          pinned: true,
          backgroundColor: headerStart,
          foregroundColor: Colors.white,
          actions: [
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () async {
                await Navigator.push(context,
                  MaterialPageRoute(builder: (_) => InsumoFormPage(insumo: _insumo)));
                _sincronizarDesdeProvider();
              },
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (v) {
                if (v == 'estado') _cambiarEstado(context);
                if (v == 'desactivar') _eliminarSoft(context);
                if (v == 'force') _eliminarPermanente(context);
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                  value: 'estado',
                  child: Text(
                    _insumo.disponible ? 'Marcar como agotado' : 'Marcar como disponible'),
                ),
                const PopupMenuItem(
                  value: 'desactivar',
                  child: Text('Desactivar insumo',
                    style: TextStyle(color: kWarning)),
                ),
                if (_insumo.agotado) const PopupMenuItem(
                  value: 'force',
                  child: Text('Eliminar permanentemente',
                    style: TextStyle(color: kError)),
                ),
              ],
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [headerStart, headerEnd],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 44, 20, 16),
                child: Row(children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white24,
                    child: const Icon(Icons.inventory_2_outlined,
                      color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_insumo.nombreInsumo,
                        style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text(_insumo.unidadMedida,
                        style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 6),
                      estadoChip(_insumo.estado),
                    ],
                  )),
                ]),
              )),
            ),
          ),
        ),

        // ── Cuerpo ────────────────────────────────────────────────────────────
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [

            // ── Card precio ─────────────────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [headerStart, headerEnd],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Precio unitario',
                    style: TextStyle(color: Colors.white70, fontSize: 12,
                      fontWeight: FontWeight.w600)),
                  Text(fmt.format(_insumo.precioUnitario),
                    style: const TextStyle(
                      color: Colors.white, fontSize: 26,
                      fontWeight: FontWeight.w900)),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Card inventario ─────────────────────────────────────────────
            _seccion('Inventario', [
              _fila('Stock actual',
                '${_insumo.cantidad} ${_insumo.unidadMedida}',
                icon: Icons.inventory_2_outlined,
                valueColor: _insumo.agotado ? kError
                  : _insumo.stockBajo ? kWarning : const Color(0xFF16A34A)),
              _fila('Unidad de medida', _insumo.unidadMedida,
                icon: Icons.straighten),
              if (_insumo.codigoInsumo != null)
                _fila('Código interno', _insumo.codigoInsumo!,
                  icon: Icons.qr_code_2_outlined),
            ]),

            // ── Card descripción ────────────────────────────────────────────
            if (_insumo.descripcion != null && _insumo.descripcion!.isNotEmpty)
              _seccion('Descripción', [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(_insumo.descripcion!,
                    style: const TextStyle(
                      color: kText, fontSize: 14, height: 1.6)),
                ),
              ]),

            // ── Stock bajo / agotado aviso ──────────────────────────────────
            if (_insumo.agotado) _aviso(
              '⚠ Este insumo está agotado y no puede usarse en compras.',
              const Color(0xFFFEE2E2), kError,
            ) else if (_insumo.stockBajo) _aviso(
              '⚠ Stock bajo: quedan ${_insumo.cantidad} ${_insumo.unidadMedida}.',
              const Color(0xFFFEF9C3), const Color(0xFF92400E),
            ),

            const SizedBox(height: 60),
          ]),
        )),
      ]),
    );
  }

  Widget _seccion(String titulo, List<Widget> hijos) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 1,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
        child: Text(titulo.toUpperCase(), style: kLabel),
      ),
      ...hijos,
    ]),
  );

  Widget _fila(String label, String value,
      {IconData? icon, Color? valueColor}) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
    child: Row(children: [
      if (icon != null) ...[
        Icon(icon, size: 16, color: kTextMuted), const SizedBox(width: 10),
      ],
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: kLabel),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(
          color: valueColor ?? kText, fontSize: 14, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );

  Widget _aviso(String msg, Color bg, Color fg) => Container(
    width: double.infinity,
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: fg.withValues(alpha: 0.4)),
    ),
    child: Text(msg, style: TextStyle(color: fg, fontSize: 13)),
  );
}
