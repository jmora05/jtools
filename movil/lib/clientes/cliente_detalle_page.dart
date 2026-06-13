import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'cliente_model.dart';
import 'cliente_provider.dart';
import 'cliente_form_page.dart';

class ClienteDetallePage extends StatefulWidget {
  final int clienteId;
  const ClienteDetallePage({super.key, required this.clienteId});
  @override State<ClienteDetallePage> createState() => _ClienteDetallePageState();
}

class _ClienteDetallePageState extends State<ClienteDetallePage> {
  Cliente? _cliente;
  List<dynamic> _ventas = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _cargar(); }

  Future<void> _cargar() async {
    setState(() { _loading = true; _error = null; });
    try {
      final c = await context.read<ClienteProvider>().cargarDetalle(widget.clienteId);
      final hist = await context.read<ClienteProvider>().cargarHistorial(widget.clienteId);
      setState(() {
        _cliente = c;
        _ventas = (hist['ventas'] as List?) ?? [];
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    return Scaffold(
      backgroundColor: kBg,
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: kPrimary))
        : _error != null
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.error_outline, color: kError, size: 48),
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: kError)),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _cargar, child: const Text('Reintentar')),
            ]))
          : _cliente == null ? const SizedBox()
          : CustomScrollView(slivers: [
              _appBar(),
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  _infoCard(),
                  const SizedBox(height: 12),
                  _contactoCard(),
                  const SizedBox(height: 12),
                  _historialCard(fmt),
                  const SizedBox(height: 12),
                  _accionesCard(),
                  const SizedBox(height: 60),
                ]),
              )),
            ]),
    );
  }

  SliverAppBar _appBar() {
    final c = _cliente!;
    return SliverAppBar(
      expandedHeight: 140, pinned: true,
      backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
      actions: [
        PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert),
          onSelected: _accion,
          itemBuilder: (_) => [
            const PopupMenuItem(value: 'editar', child: Row(children: [
              Icon(Icons.edit_outlined, size: 18, color: kText),
              SizedBox(width: 8), Text('Editar'),
            ])),
            PopupMenuItem(
              value: 'toggle',
              child: Row(children: [
                Icon(c.activo ? Icons.block : Icons.check_circle_outline,
                  size: 18, color: c.activo ? kWarning : const Color(0xFF16A34A)),
                const SizedBox(width: 8),
                Text(c.activo ? 'Desactivar' : 'Activar',
                  style: TextStyle(color: c.activo ? kWarning : const Color(0xFF16A34A))),
              ]),
            ),
          ],
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
              begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
          child: SafeArea(child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 36, 20, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Expanded(child: Text(c.nombreCompleto,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white24, borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white54),
                  ),
                  child: Text(c.activo ? 'Activo' : 'Inactivo',
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ]),
              const SizedBox(height: 4),
              if (c.razonSocial != null && c.razonSocial!.isNotEmpty)
                Text(c.razonSocial!, style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ]),
          )),
        ),
      ),
    );
  }

  Widget _infoCard() {
    final c = _cliente!;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('IDENTIFICACIÓN', style: kLabel),
          const SizedBox(height: 12),
          _fila(Icons.badge_outlined, 'Tipo de documento',
            c.tipoDocumento[0].toUpperCase() + c.tipoDocumento.substring(1)),
          _fila(Icons.numbers_outlined, 'Número de documento', c.numeroDocumento),
          if (c.contacto != null && c.contacto!.isNotEmpty)
            _fila(Icons.person_outline, 'Contacto', c.contacto!),
        ]),
      ),
    );
  }

  Widget _contactoCard() {
    final c = _cliente!;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('CONTACTO', style: kLabel),
          const SizedBox(height: 12),
          _fila(Icons.email_outlined, 'Correo', c.email),
          _fila(Icons.phone_outlined, 'Teléfono', c.telefono),
          _fila(Icons.location_city_outlined, 'Ciudad', c.ciudad),
          if (c.direccion != null && c.direccion!.isNotEmpty)
            _fila(Icons.home_outlined, 'Dirección', c.direccion!),
        ]),
      ),
    );
  }

  Widget _historialCard(NumberFormat fmt) => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text('HISTORIAL DE PEDIDOS', style: kLabel),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: kChipBg, borderRadius: BorderRadius.circular(20)),
            child: Text('${_ventas.length}',
              style: const TextStyle(color: kChipText, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ]),
        const SizedBox(height: 12),
        if (_ventas.isEmpty)
          const Text('Sin pedidos registrados.',
            style: TextStyle(color: kTextMuted, fontStyle: FontStyle.italic))
        else ..._ventas.map((v) {
          final total = double.tryParse(v['total']?.toString() ?? '0') ?? 0;
          final fecha = (v['fecha'] as String? ?? '').length >= 10
            ? (v['fecha'] as String).substring(0, 10) : v['fecha'] ?? '';
          final estado = v['estado']?.toString() ?? '';
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Pedido #${v['id']}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Text('$fecha · ${v['metodoPago'] ?? ''}',
                  style: const TextStyle(color: kTextMuted, fontSize: 11)),
              ])),
              Text(fmt.format(total),
                style: const TextStyle(fontWeight: FontWeight.w700, color: kPrimary)),
              const SizedBox(width: 8),
              _estadoBadge(estado),
            ]),
          );
        }),
      ]),
    ),
  );

  Widget _accionesCard() => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 1,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('ACCIONES', style: kLabel),
        const SizedBox(height: 12),
        _botonAccion('Editar cliente', Icons.edit_outlined, kPrimary,
          () => Navigator.push(context,
            MaterialPageRoute(builder: (_) => ClienteFormPage(cliente: _cliente)))
            .then((_) => _cargar())),
        _botonAccion(
          _cliente!.activo ? 'Desactivar cliente' : 'Activar cliente',
          _cliente!.activo ? Icons.block : Icons.check_circle_outline,
          _cliente!.activo ? kWarning : const Color(0xFF16A34A),
          _confirmarToggle,
        ),
      ]),
    ),
  );

  Widget _botonAccion(String label, IconData icon, Color color, VoidCallback onTap) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        icon: Icon(icon, size: 18),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: color, side: BorderSide(color: color),
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: onTap,
      ),
    ),
  );

  Future<void> _accion(String val) async {
    if (val == 'editar') {
      await Navigator.push(context,
        MaterialPageRoute(builder: (_) => ClienteFormPage(cliente: _cliente)));
      _cargar();
    } else if (val == 'toggle') {
      await _confirmarToggle();
    }
  }

  Future<void> _confirmarToggle() async {
    final c = _cliente!;
    final nuevoEstado = c.activo ? 'inactivo' : 'activo';
    final label = c.activo ? 'desactivar' : 'activar';
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('${label[0].toUpperCase()}${label.substring(1)} cliente',
          style: const TextStyle(fontWeight: FontWeight.w700)),
        content: Text('¿Deseas $label a ${c.nombreCompleto}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: c.activo ? kWarning : const Color(0xFF16A34A),
              foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: Text(label[0].toUpperCase() + label.substring(1)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<ClienteProvider>().cambiarEstado(c.id, nuevoEstado);
      await _cargar();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('${c.nombreCompleto} ${nuevoEstado == 'activo' ? 'activado' : 'desactivado'}'),
        backgroundColor: nuevoEstado == 'activo' ? const Color(0xFF16A34A) : kWarning,
        behavior: SnackBarBehavior.floating));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    }
  }

  Widget _fila(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(children: [
      Icon(icon, size: 16, color: kTextMuted),
      const SizedBox(width: 8),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: kLabel),
        Text(value, style: const TextStyle(color: kText, fontSize: 14, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );

  Widget _estadoBadge(String estado) {
    Color bg, fg;
    switch (estado) {
      case 'activa':    bg = const Color(0xFFCCFBF1); fg = const Color(0xFF0F766E); break;
      case 'pendiente': bg = const Color(0xFFFEF9C3); fg = const Color(0xFFB45309); break;
      case 'anulada':   bg = const Color(0xFFFEE2E2); fg = const Color(0xFFDC2626); break;
      default:          bg = const Color(0xFFF3F4F6); fg = kTextMuted;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withOpacity(0.4))),
      child: Text(estado[0].toUpperCase() + estado.substring(1),
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}
