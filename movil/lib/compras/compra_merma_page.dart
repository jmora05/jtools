import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'compra_model.dart';
import 'compra_provider.dart';

class _MermaItem {
  final int insumosId;
  final String nombreInsumo;
  final String unidadMedida;
  final int cantidadComprada;
  int cantidadDefectuosa;
  final TextEditingController ctrl;

  _MermaItem({
    required this.insumosId,
    required this.nombreInsumo,
    required this.unidadMedida,
    required this.cantidadComprada,
    this.cantidadDefectuosa = 0,
  }) : ctrl = TextEditingController();

  void dispose() => ctrl.dispose();
}

class CompraMermaPage extends StatefulWidget {
  final int compraId;
  const CompraMermaPage({super.key, required this.compraId});
  @override State<CompraMermaPage> createState() => _CompraMermaPageState();
}

class _CompraMermaPageState extends State<CompraMermaPage> {
  Compra? _compra;
  bool _loadingCompra = true;
  bool _saving = false;
  String? _loadError;
  Map<String, dynamic>? _resultado;

  List<_MermaItem> _items = [];
  final _motivoCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargarCompra();
  }

  @override
  void dispose() {
    for (final it in _items) it.dispose();
    _motivoCtrl.dispose();
    super.dispose();
  }

  Future<void> _cargarCompra() async {
    setState(() { _loadingCompra = true; _loadError = null; });
    try {
      final c = await context.read<CompraProvider>().cargarDetalle(widget.compraId);
      _items = c.detalles.map((d) => _MermaItem(
        insumosId:        d.insumosId,
        nombreInsumo:     d.nombreInsumo ?? 'Insumo #${d.insumosId}',
        unidadMedida:     d.unidadMedida ?? '',
        cantidadComprada: d.cantidad,
      )).toList();
      setState(() { _compra = c; });
    } catch (e) {
      setState(() { _loadError = e.toString(); });
    } finally {
      setState(() { _loadingCompra = false; });
    }
  }

  List<_MermaItem> get _itemsConDefecto =>
    _items.where((it) => it.cantidadDefectuosa > 0).toList();

  Future<void> _registrar() async {
    // Validar que ninguna cantidad defectuosa supere la comprada
    for (final it in _itemsConDefecto) {
      if (it.cantidadDefectuosa > it.cantidadComprada) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(
            '"${it.nombreInsumo}": la cantidad defectuosa (${it.cantidadDefectuosa}) '
            'no puede superar la cantidad comprada (${it.cantidadComprada}).'),
          backgroundColor: kError,
          behavior: SnackBarBehavior.floating,
        ));
        return;
      }
    }
    if (_itemsConDefecto.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Debes ingresar al menos un insumo con cantidad defectuosa mayor a 0.'),
        backgroundColor: kError,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    setState(() => _saving = true);
    try {
      final res = await context.read<CompraProvider>().registrarMerma(
        _compra!.id,
        _itemsConDefecto.map((it) => {
          'insumosId': it.insumosId,
          'cantidad': it.cantidadDefectuosa,
        }).toList(),
        motivo: _motivoCtrl.text,
      );
      setState(() => _resultado = res);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: kError,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: Text('Merma · Compra #${widget.compraId}',
          style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: _loadingCompra
        ? const Center(child: CircularProgressIndicator(color: kPrimary))
        : _loadError != null
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.error_outline, color: kError, size: 48),
              const SizedBox(height: 12),
              Text(_loadError!, style: const TextStyle(color: kError)),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _cargarCompra, child: const Text('Reintentar')),
            ]))
          : _resultado != null
            ? _pantallaResultado(fmt)
            : _formulario(fmt),
    );
  }

  // ── Formulario ──────────────────────────────────────────────────────────────
  Widget _formulario(NumberFormat fmt) => Column(children: [
    Expanded(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [

          // ── Aviso ──────────────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF9C3),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFF59E0B)),
            ),
            child: Row(children: [
              const Icon(Icons.warning_amber_outlined,
                color: Color(0xFF92400E), size: 18),
              const SizedBox(width: 10),
              const Expanded(child: Text(
                'Esta acción descuenta insumos del inventario de forma permanente.',
                style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
              )),
            ]),
          ),

          // ── Lista de insumos ───────────────────────────────────────────────
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 1,
            child: Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                child: Row(children: [
                  Text('INSUMOS DE LA COMPRA', style: kLabel),
                  const Spacer(),
                  Text('Compra #${_compra!.id}',
                    style: const TextStyle(color: kTextMuted, fontSize: 11)),
                ]),
              ),
              const Divider(height: 1),
              ..._items.map((it) {
                final superaMax = it.cantidadDefectuosa > it.cantidadComprada;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(it.nombreInsumo,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        const SizedBox(height: 2),
                        Text('Comprado: ${it.cantidadComprada} ${it.unidadMedida}',
                          style: const TextStyle(color: kTextMuted, fontSize: 11)),
                      ],
                    )),
                    const SizedBox(width: 12),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      SizedBox(
                        width: 90,
                        child: TextField(
                          controller: it.ctrl,
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: '0',
                            contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: superaMax ? kError : kBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: superaMax ? kError : kBorder),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: superaMax ? kError : kPrimary, width: 2),
                            ),
                          ),
                          onChanged: (v) => setState(() {
                            it.cantidadDefectuosa = int.tryParse(v) ?? 0;
                          }),
                        ),
                      ),
                      if (superaMax) Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text('Máx: ${it.cantidadComprada}',
                          style: const TextStyle(color: kError, fontSize: 10)),
                      ),
                    ]),
                    const SizedBox(width: 4),
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                      icon: const Icon(Icons.clear, size: 16, color: kTextMuted),
                      onPressed: () => setState(() {
                        it.cantidadDefectuosa = 0;
                        it.ctrl.clear();
                      }),
                    ),
                  ]),
                );
              }),
            ]),
          ),

          // ── Resumen de selección ───────────────────────────────────────────
          if (_itemsConDefecto.isNotEmpty) ...[
            const SizedBox(height: 12),
            Card(
              color: const Color(0xFFEFF6FF),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('SE DESCONTARÁN DEL INVENTARIO:',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: kPrimary)),
                  const SizedBox(height: 8),
                  ..._itemsConDefecto.map((it) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(children: [
                      const Icon(Icons.remove_circle_outline, size: 14, color: kPrimary),
                      const SizedBox(width: 6),
                      Expanded(child: Text(it.nombreInsumo,
                        style: const TextStyle(fontSize: 12))),
                      Text('${it.cantidadDefectuosa} ${it.unidadMedida}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 12, color: kPrimary)),
                    ]),
                  )),
                ]),
              ),
            ),
          ],

          // ── Motivo ─────────────────────────────────────────────────────────
          const SizedBox(height: 12),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 1,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('MOTIVO', style: kLabel),
                const SizedBox(height: 8),
                Text('Opcional',
                  style: const TextStyle(color: kTextMuted, fontSize: 11)),
                const SizedBox(height: 8),
                TextField(
                  controller: _motivoCtrl,
                  maxLines: 3,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    hintText: 'Ej: Insumos llegaron golpeados, material oxidado...',
                    hintStyle: TextStyle(color: kTextMuted, fontSize: 13),
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.all(12),
                  ),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 24),
        ]),
      ),
    ),

    // ── Footer ─────────────────────────────────────────────────────────────
    Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: kBorder)),
      ),
      child: Row(children: [
        Expanded(child: OutlinedButton(
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        )),
        const SizedBox(width: 12),
        Expanded(flex: 2, child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: kWarning, foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: (_saving || _itemsConDefecto.isEmpty) ? null : _registrar,
          icon: _saving
            ? const SizedBox(width: 16, height: 16,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.warning_amber_outlined, size: 18),
          label: const Text('Descontar insumos',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        )),
      ]),
    ),
  ]);

  // ── Pantalla resultado ──────────────────────────────────────────────────────
  Widget _pantallaResultado(NumberFormat fmt) {
    final mermaRegistrada = _resultado!['mermaRegistrada'] as List? ?? [];
    final motivo = _resultado!['motivo']?.toString() ?? '';
    final mostrarMotivo = motivo.isNotEmpty && motivo != 'Sin motivo especificado';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [

        // ── Banner éxito ──────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFDCFCE7),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF16A34A).withOpacity(0.4)),
          ),
          child: Row(children: [
            const Icon(Icons.check_circle_outline,
              color: Color(0xFF16A34A), size: 28),
            const SizedBox(width: 12),
            const Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Insumos descontados',
                  style: TextStyle(fontWeight: FontWeight.w700,
                    color: Color(0xFF166534), fontSize: 15)),
                SizedBox(height: 2),
                Text('Los insumos defectuosos fueron descontados del inventario.',
                  style: TextStyle(color: Color(0xFF166534), fontSize: 12)),
              ],
            )),
          ]),
        ),

        if (mostrarMotivo) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: kBorder),
            ),
            child: Text('Motivo: $motivo',
              style: const TextStyle(color: kTextMuted, fontStyle: FontStyle.italic, fontSize: 13)),
          ),
        ],

        const SizedBox(height: 16),

        // ── Lista de resultados ───────────────────────────────────────────
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 1,
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
              child: Text('INSUMOS ACTUALIZADOS', style: kLabel),
            ),
            const Divider(height: 1),
            ...mermaRegistrada.map((ins) {
              final nombre = ins['nombreInsumo']?.toString() ?? '';
              final defectuoso = ins['cantidadDefectuosa'] ?? 0;
              final anterior = ins['cantidadAnterior'] ?? 0;
              final nueva = ins['cantidadNueva'] ?? 0;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(nombre, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text('−$defectuoso defectuosos descontados',
                      style: const TextStyle(color: kError, fontSize: 11)),
                  ])),
                  RichText(text: TextSpan(
                    style: const TextStyle(fontSize: 13),
                    children: [
                      TextSpan(text: '$anterior ',
                        style: const TextStyle(
                          color: kTextMuted,
                          decoration: TextDecoration.lineThrough)),
                      const TextSpan(text: '→ ',
                        style: TextStyle(color: kTextMuted)),
                      TextSpan(text: '$nueva',
                        style: const TextStyle(
                          color: kPrimary, fontWeight: FontWeight.w700)),
                      const TextSpan(text: ' en inv.',
                        style: TextStyle(color: kTextMuted, fontSize: 11)),
                    ],
                  )),
                ]),
              );
            }),
          ]),
        ),

        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kPrimary, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 40),
      ]),
    );
  }
}
