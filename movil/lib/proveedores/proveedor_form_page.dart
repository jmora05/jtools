import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'proveedor_model.dart';
import 'proveedor_provider.dart';

class ProveedorFormPage extends StatefulWidget {
  final Proveedor? proveedor;
  const ProveedorFormPage({super.key, this.proveedor});
  @override State<ProveedorFormPage> createState() => _ProveedorFormPageState();
}

class _ProveedorFormPageState extends State<ProveedorFormPage> {
  final _key = GlobalKey<FormState>();
  bool _saving = false;

  late final TextEditingController _nombre, _contacto, _numDoc,
      _email, _telefono, _ciudad, _direccion;
  String _tipoProveedor = 'empresa';
  String _tipoDoc = 'NIT';
  String _estado = 'activo';

  bool get _isEdit => widget.proveedor != null;

  @override
  void initState() {
    super.initState();
    final p = widget.proveedor;
    _nombre = TextEditingController(text: p?.nombreEmpresa ?? '');
    _contacto = TextEditingController(text: p?.personaContacto ?? '');
    _numDoc = TextEditingController(text: p?.numeroDocumento ?? '');
    _email = TextEditingController(text: p?.email ?? '');
    _telefono = TextEditingController(text: p?.telefono ?? '');
    _ciudad = TextEditingController(text: p?.ciudad ?? '');
    _direccion = TextEditingController(text: p?.direccion ?? '');
    _tipoProveedor = p?.tipoProveedor ?? 'empresa';
    _tipoDoc = p?.tipoDocumento ?? 'NIT';
    _estado = p?.estado ?? 'activo';
  }

  @override
  void dispose() {
    for (final c in [_nombre, _contacto, _numDoc, _email, _telefono, _ciudad, _direccion]) c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: kBg,
    appBar: AppBar(
      backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
      title: Text(_isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor',
        style: const TextStyle(fontWeight: FontWeight.w700)),
    ),
    body: Form(
      key: _key,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          _seccion('Tipo de proveedor', [
            _drop('Tipo', _tipoProveedor, ['empresa', 'persona'],
              (v) => setState(() { _tipoProveedor = v!; _tipoDoc = v == 'empresa' ? 'NIT' : 'CC'; })),
          ]),
          // Orden de campos igual que SupplierManagement.tsx:
          //   1. Tipo de documento
          //   2. Número de documento
          //   3. Nombre (empresa o completo)
          //   4. (Empresa) Persona de contacto opcional
          _seccion('Información principal', [
            _drop('Tipo documento', _tipoDoc,
              _tipoProveedor == 'empresa' ? ['NIT', 'CC'] : ['CC', 'CE', 'PPT'],
              (v) => setState(() => _tipoDoc = v!)),
            _txt(_numDoc, 'Número de documento',
              keyboard: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9\-]')),
              ],
              validator: (v) {
                final s = (v ?? '').trim();
                if (s.isEmpty) return 'Requerido';
                if (!RegExp(r'^[0-9\-]+$').hasMatch(s)) return 'Solo se permiten números';
                return null;
              }),
            _txt(_nombre, _tipoProveedor == 'empresa' ? 'Nombre de la empresa (razón social)' : 'Nombre completo',
              validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null),
            if (_tipoProveedor == 'empresa')
              _txt(_contacto, 'Empresa de contacto (opcional)'),
          ]),
          _seccion('Contacto', [
            _txt(_email, 'Correo electrónico',
              keyboard: TextInputType.emailAddress,
              validator: (v) {
                if (v?.isEmpty ?? true) return 'Requerido';
                if (!v!.contains('@')) return 'Email inválido';
                return null;
              }),
            _txt(_telefono, 'Teléfono', keyboard: TextInputType.phone,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[\d\+\s\-]')),
              ],
              validator: (v) {
                final s = (v ?? '').trim();
                if (s.isEmpty) return 'Requerido';
                if (!RegExp(r'^[\d\+\s\-]+$').hasMatch(s)) return 'Solo se permiten números';
                return null;
              }),
            _txt(_ciudad, 'Ciudad'),
            _txt(_direccion, 'Dirección'),
          ]),
          if (_isEdit) _seccion('Estado', [
            _drop('Estado', _estado, ['activo', 'inactivo'],
              (v) => setState(() => _estado = v!)),
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
                : Text(_isEdit ? 'Actualizar proveedor' : 'Registrar proveedor',
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

  Widget _txt(TextEditingController c, String label,
      {TextInputType? keyboard,
      List<TextInputFormatter>? inputFormatters,
      String? Function(String?)? validator}) =>
    Padding(padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(controller: c, keyboardType: keyboard,
        inputFormatters: inputFormatters,
        validator: validator, decoration: kInputDeco(label)));

  Widget _drop(String label, String value, List<String> items, void Function(String?) cb) =>
    Padding(padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        value: value, decoration: kInputDeco(label),
        items: items.map((i) => DropdownMenuItem(
          value: i,
          child: Text(i == 'empresa' ? 'Empresa' : i == 'persona' ? 'Persona Natural' : i),
        )).toList(),
        onChanged: cb,
      ));

  Future<void> _guardar() async {
    if (!_key.currentState!.validate()) return;
    setState(() => _saving = true);
    final prov = context.read<ProveedorProvider>();
    try {
      final body = {
        'tipoProveedor': _tipoProveedor,
        'nombreEmpresa': _nombre.text.trim(),
        'personaContacto': _contacto.text.trim(),
        'tipoDocumento': _tipoDoc,
        'numeroDocumento': _numDoc.text.trim(),
        'email': _email.text.trim(),
        'telefono': _telefono.text.trim(),
        'ciudad': _ciudad.text.trim(),
        'direccion': _direccion.text.trim(),
        'estado': _estado,
      };
      if (_isEdit) await prov.actualizar(widget.proveedor!.id, body);
      else await prov.crear(body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Proveedor actualizado' : 'Proveedor registrado'),
          backgroundColor: kPrimary));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: kError));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
