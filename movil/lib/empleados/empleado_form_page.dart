import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'empleado_model.dart';
import 'empleado_provider.dart';

class EmpleadoFormPage extends StatefulWidget {
  final Empleado? empleado;
  const EmpleadoFormPage({super.key, this.empleado});
  @override State<EmpleadoFormPage> createState() => _EmpleadoFormPageState();
}

class _EmpleadoFormPageState extends State<EmpleadoFormPage> {
  final _key = GlobalKey<FormState>();
  bool _saving = false;

  late final TextEditingController _nombres, _apellidos, _tipoDoc,
      _numDoc, _telefono, _email, _cargo, _area,
      _direccion, _ciudad, _fechaIngreso, _salario;
  String _tipoDocValue = 'CC';
  String _areaValue = 'Administración';
  String _estadoValue = 'activo';

  final List<String> _tiposDocs = ['CC', 'CE', 'PPT'];
  final List<String> _areas = ['Producción', 'Administración'];

  bool get _isEdit => widget.empleado != null;

  @override
  void initState() {
    super.initState();
    final e = widget.empleado;
    _nombres = TextEditingController(text: e?.nombres ?? '');
    _apellidos = TextEditingController(text: e?.apellidos ?? '');
    _tipoDoc = TextEditingController(text: e?.tipoDocumento ?? 'CC');
    _numDoc = TextEditingController(text: e?.numeroDocumento ?? '');
    _telefono = TextEditingController(text: e?.telefono ?? '');
    _email = TextEditingController(text: e?.email ?? '');
    _cargo = TextEditingController(text: e?.cargo ?? '');
    _area = TextEditingController(text: e?.area ?? '');
    _direccion = TextEditingController(text: e?.direccion ?? '');
    _ciudad = TextEditingController(text: e?.ciudad ?? '');
    _fechaIngreso = TextEditingController(
        text: e?.fechaIngreso ?? DateTime.now().toIso8601String().split('T')[0]);
    _salario = TextEditingController(text: e?.salario.toStringAsFixed(0) ?? '');
    _tipoDocValue = e?.tipoDocumento ?? 'CC';
    _areaValue = e?.area ?? 'Administración';
    _estadoValue = e?.estado ?? 'activo';
  }

  @override
  void dispose() {
    for (final c in [_nombres, _apellidos, _tipoDoc, _numDoc, _telefono,
        _email, _cargo, _area, _direccion, _ciudad, _fechaIngreso, _salario]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark,
        foregroundColor: Colors.white,
        title: Text(_isEdit ? 'Editar Empleado' : 'Nuevo Empleado',
          style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: Form(
        key: _key,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _seccion('Información Personal', [
              _row([
                _dropField('Tipo documento', _tipoDocValue, _tiposDocs,
                  (v) => setState(() { _tipoDocValue = v!; _tipoDoc.text = v; })),
                _textField(_numDoc, 'N° Documento',
                  keyboard: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null),
              ]),
              _row([
                _textField(_nombres, 'Nombres',
                  validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null),
                _textField(_apellidos, 'Apellidos',
                  validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null),
              ]),
            ]),
            _seccion('Contacto', [
              _textField(_email, 'Correo electrónico',
                keyboard: TextInputType.emailAddress,
                validator: (v) {
                  if (v?.isEmpty ?? true) return 'Requerido';
                  if (!v!.contains('@')) return 'Email inválido';
                  return null;
                }),
              _textField(_telefono, 'Teléfono',
                keyboard: TextInputType.phone,
                validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null),
              _row([
                _textField(_ciudad, 'Ciudad'),
                _textField(_direccion, 'Dirección'),
              ]),
            ]),
            _seccion('Información Laboral', [
              _textField(_cargo, 'Cargo',
                validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null),
              _dropField('Área', _areaValue, _areas,
                (v) => setState(() { _areaValue = v!; _area.text = v; })),
              _datePicker(),
              _textField(_salario, 'Salario base mensual',
                keyboard: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                validator: (v) {
                  if (v?.isEmpty ?? true) return 'Requerido';
                  if (double.tryParse(v!) == null) return 'Número inválido';
                  return null;
                }),
              if (_isEdit) _estadoField(),
            ]),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _saving ? null : _guardar,
                child: _saving
                  ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(_isEdit ? 'Actualizar empleado' : 'Registrar empleado',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 40),
          ]),
        ),
      ),
    );
  }

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

  Widget _row(List<Widget> children) => Row(
    children: children.map((c) => Expanded(child: Padding(
      padding: const EdgeInsets.only(right: 8),
      child: c,
    ))).toList()
      ..last = Expanded(child: children.last),
  );

  Widget _textField(TextEditingController c, String label, {
    TextInputType? keyboard,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: c,
      keyboardType: keyboard,
      inputFormatters: inputFormatters,
      validator: validator,
      decoration: kInputDeco(label),
    ),
  );

  Widget _dropField(String label, String value, List<String> items, void Function(String?) onChanged) =>
    Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: kInputDeco(label),
        items: items.map((i) => DropdownMenuItem(value: i, child: Text(i))).toList(),
        onChanged: onChanged,
      ),
    );

  Widget _datePicker() => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: _fechaIngreso,
      readOnly: true,
      decoration: kInputDeco('Fecha de ingreso', prefix: const Icon(Icons.calendar_today, color: kTextMuted)),
      validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null,
      onTap: () async {
        final fecha = await showDatePicker(
          context: context,
          initialDate: DateTime.tryParse(_fechaIngreso.text) ?? DateTime.now(),
          firstDate: DateTime(2000), lastDate: DateTime.now(),
        );
        if (fecha != null) {
          _fechaIngreso.text = fecha.toIso8601String().split('T')[0];
        }
      },
    ),
  );

  Widget _estadoField() => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: DropdownButtonFormField<String>(
      value: _estadoValue,
      decoration: kInputDeco('Estado'),
      items: const [
        DropdownMenuItem(value: 'activo', child: Text('Activo')),
        DropdownMenuItem(value: 'inactivo', child: Text('Inactivo')),
      ],
      onChanged: (v) => setState(() => _estadoValue = v!),
    ),
  );

  Future<void> _guardar() async {
    if (!_key.currentState!.validate()) return;
    setState(() => _saving = true);
    final prov = context.read<EmpleadoProvider>();
    try {
      final body = {
        'nombres': _nombres.text.trim(),
        'apellidos': _apellidos.text.trim(),
        'tipoDocumento': _tipoDocValue,
        'numeroDocumento': _numDoc.text.trim(),
        'telefono': _telefono.text.trim(),
        'email': _email.text.trim(),
        'cargo': _cargo.text.trim(),
        'area': _areaValue,
        'direccion': _direccion.text.trim(),
        'ciudad': _ciudad.text.trim(),
        'fechaIngreso': _fechaIngreso.text,
        'salario': double.parse(_salario.text),
        'estado': _estadoValue,
      };
      if (_isEdit) {
        await prov.actualizar(widget.empleado!.id, body);
      } else {
        await prov.crear(body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Empleado actualizado' : 'Empleado registrado'),
          backgroundColor: kPrimary,
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: kError));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
