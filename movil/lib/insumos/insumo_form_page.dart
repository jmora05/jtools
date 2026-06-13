import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'insumo_model.dart';
import 'insumo_provider.dart';

const _kUnidades = [
  'Unidades', 'Kilogramos', 'Gramos', 'Metros', 'Par', 'Rollo', 'Galón', 'Juegos',
];

class InsumoFormPage extends StatefulWidget {
  final Insumo? insumo;
  const InsumoFormPage({super.key, this.insumo});
  @override State<InsumoFormPage> createState() => _InsumoFormPageState();
}

class _InsumoFormPageState extends State<InsumoFormPage> {
  final _key = GlobalKey<FormState>();
  bool _saving = false;

  late final TextEditingController _nombre, _descripcion, _codigo, _precio, _cantidad;
  String _unidad = 'Unidades';
  String _estado = 'disponible';

  bool get _isEdit => widget.insumo != null;

  @override
  void initState() {
    super.initState();
    final i = widget.insumo;
    _nombre     = TextEditingController(text: i?.nombreInsumo ?? '');
    _descripcion = TextEditingController(text: i?.descripcion ?? '');
    _codigo     = TextEditingController(text: i?.codigoInsumo ?? '');
    _precio     = TextEditingController(
      text: i != null ? i.precioUnitario.toStringAsFixed(0) : '');
    _cantidad   = TextEditingController(
      text: i != null ? i.cantidad.toString() : '0');
    _unidad     = i?.unidadMedida ?? 'Unidades';
    if (!_kUnidades.contains(_unidad)) _unidad = 'Unidades';
    _estado     = i?.estado ?? 'disponible';
  }

  @override
  void dispose() {
    for (final c in [_nombre, _descripcion, _codigo, _precio, _cantidad]) c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
      title: Text(_isEdit ? 'Editar insumo' : 'Nuevo insumo',
        style: const TextStyle(fontWeight: FontWeight.w700)),
    ),
    body: Form(
      key: _key,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [

          // ── Información principal ────────────────────────────────────────────
          _seccion('Información principal', [
            _txt(_nombre, 'Nombre del insumo',
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'El nombre es requerido';
                if (v.trim().length < 2) return 'Mínimo 2 caracteres';
                if (v.trim().length > 30) return 'Máximo 30 caracteres';
                return null;
              }),
            _txt(_descripcion, 'Descripción (opcional)',
              maxLines: 3, maxLength: 255),
            _txt(_codigo, 'Código interno (opcional)'),
          ]),

          // ── Precio y unidad ─────────────────────────────────────────────────
          _seccion('Precio y unidad de medida', [
            _txt(_precio, 'Precio unitario',
              keyboard: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}'))],
              prefix: const Text('\$  ', style: TextStyle(color: kTextMuted)),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'El precio es requerido';
                final n = double.tryParse(v.trim());
                if (n == null) return 'Ingresa un número válido';
                if (n < 0) return 'El precio no puede ser negativo';
                if (n > 99999999.99) return 'El precio no puede superar \$99.999.999';
                return null;
              }),
            Padding(padding: const EdgeInsets.only(bottom: 12),
              child: DropdownButtonFormField<String>(
                value: _unidad,
                decoration: kInputDeco('Unidad de medida'),
                items: _kUnidades.map((u) =>
                  DropdownMenuItem(value: u, child: Text(u))).toList(),
                onChanged: (v) => setState(() => _unidad = v!),
              )),
          ]),

          // ── Cantidad ─────────────────────────────────────────────────────────
          _seccion('Inventario', [
            _txt(_cantidad, 'Cantidad en inventario',
              keyboard: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              validator: (v) {
                final n = int.tryParse(v?.trim() ?? '');
                if (n == null) return 'Ingresa un número entero';
                if (n < 0) return 'La cantidad no puede ser negativa';
                return null;
              }),
          ]),

          // ── Estado (solo en edición) ─────────────────────────────────────────
          if (_isEdit) _seccion('Estado', [
            Padding(padding: const EdgeInsets.only(bottom: 12),
              child: DropdownButtonFormField<String>(
                value: _estado,
                decoration: kInputDeco('Estado del insumo'),
                items: const [
                  DropdownMenuItem(value: 'disponible', child: Text('Disponible')),
                  DropdownMenuItem(value: 'agotado', child: Text('Agotado')),
                ],
                onChanged: (v) => setState(() => _estado = v!),
              )),
          ]),

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity, height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary, foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _saving ? null : _guardar,
              child: _saving
                ? const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(_isEdit ? 'Actualizar insumo' : 'Registrar insumo',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 40),
        ]),
      ),
    ),
  );

  Widget _seccion(String titulo, List<Widget> children) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(titulo.toUpperCase(), style: kLabel),
        const SizedBox(height: 12),
        ...children,
      ]),
    ),
  );

  Widget _txt(
    TextEditingController c,
    String label, {
    TextInputType? keyboard,
    List<TextInputFormatter>? inputFormatters,
    Widget? prefix,
    int maxLines = 1,
    int? maxLength,
    String? Function(String?)? validator,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: c,
      keyboardType: keyboard,
      inputFormatters: inputFormatters,
      maxLines: maxLines,
      maxLength: maxLength,
      validator: validator,
      decoration: kInputDeco(label, prefix: prefix != null ? Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: prefix,
      ) : null),
    ),
  );

  Future<void> _guardar() async {
    if (!_key.currentState!.validate()) return;
    setState(() => _saving = true);
    final prov = context.read<InsumoProvider>();
    try {
      final body = <String, dynamic>{
        'nombreInsumo':   _nombre.text.trim(),
        'precioUnitario': double.parse(_precio.text.trim()),
        'unidadMedida':   _unidad,
        'cantidad':       int.parse(_cantidad.text.trim()),
        if (_descripcion.text.trim().isNotEmpty) 'descripcion': _descripcion.text.trim(),
        if (_codigo.text.trim().isNotEmpty) 'codigoInsumo': _codigo.text.trim(),
        if (_isEdit) 'estado': _estado,
      };
      if (_isEdit) {
        await prov.actualizar(widget.insumo!.id, body);
      } else {
        await prov.crear(body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Insumo actualizado' : 'Insumo registrado'),
          backgroundColor: kPrimary,
          behavior: SnackBarBehavior.floating,
        ));
        Navigator.pop(context);
      }
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
}
