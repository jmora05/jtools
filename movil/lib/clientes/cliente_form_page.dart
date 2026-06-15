import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import 'cliente_model.dart';
import 'cliente_provider.dart';

class ClienteFormPage extends StatefulWidget {
  final Cliente? cliente;
  const ClienteFormPage({super.key, this.cliente});
  @override State<ClienteFormPage> createState() => _ClienteFormPageState();
}

class _ClienteFormPageState extends State<ClienteFormPage> {
  final _key = GlobalKey<FormState>();
  bool _saving = false;

  late final TextEditingController _nombres;
  late final TextEditingController _apellidos;
  late final TextEditingController _email;
  late final TextEditingController _telefono;
  late final TextEditingController _ciudad;
  late final TextEditingController _direccion;
  late final TextEditingController _numDoc;
  late final TextEditingController _razonSocial;
  late final TextEditingController _contacto;
  late String _tipoDoc;
  late String _estado;

  bool get _esEdicion => widget.cliente != null;
  bool get _requiereRazonSocial => _tipoDoc == 'nit' || _tipoDoc == 'rut';

  static const _tiposDoc = ['cedula', 'nit', 'cedula de extranjeria', 'pasaporte', 'rut'];

  @override
  void initState() {
    super.initState();
    final c = widget.cliente;
    _nombres    = TextEditingController(text: c?.nombres ?? '');
    _apellidos  = TextEditingController(text: c?.apellidos ?? '');
    _email      = TextEditingController(text: c?.email ?? '');
    _telefono   = TextEditingController(text: c?.telefono ?? '');
    _ciudad     = TextEditingController(text: c?.ciudad ?? '');
    _direccion  = TextEditingController(text: c?.direccion ?? '');
    _numDoc     = TextEditingController(text: c?.numeroDocumento ?? '');
    _razonSocial = TextEditingController(text: c?.razonSocial ?? '');
    _contacto   = TextEditingController(text: c?.contacto ?? '');
    _tipoDoc    = c?.tipoDocumento ?? 'cedula';
    _estado     = c?.estado ?? 'activo';
  }

  @override
  void dispose() {
    _nombres.dispose(); _apellidos.dispose(); _email.dispose();
    _telefono.dispose(); _ciudad.dispose(); _direccion.dispose();
    _numDoc.dispose(); _razonSocial.dispose(); _contacto.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: Text(_esEdicion ? 'Editar cliente' : 'Nuevo cliente',
          style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: Form(
        key: _key,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _seccion('Información personal', [
              TextFormField(
                controller: _nombres,
                textCapitalization: TextCapitalization.words,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]')),
                  LengthLimitingTextInputFormatter(30),
                ],
                decoration: kInputDeco('Nombres *'),
                validator: (v) {
                  final s = v?.trim() ?? '';
                  if (s.isEmpty) return 'Requerido';
                  if (s.length < 2 || s.length > 30) return 'Entre 2 y 30 caracteres';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _apellidos,
                textCapitalization: TextCapitalization.words,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]')),
                  LengthLimitingTextInputFormatter(30),
                ],
                decoration: kInputDeco('Apellidos *'),
                validator: (v) {
                  final s = v?.trim() ?? '';
                  if (s.isEmpty) return 'Requerido';
                  if (s.length < 2 || s.length > 30) return 'Entre 2 y 30 caracteres';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _tipoDoc,
                decoration: kInputDeco('Tipo de documento *'),
                items: _tiposDoc.map((t) => DropdownMenuItem(
                  value: t,
                  child: Text(t[0].toUpperCase() + t.substring(1)),
                )).toList(),
                onChanged: (v) => setState(() => _tipoDoc = v!),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _numDoc,
                inputFormatters: [LengthLimitingTextInputFormatter(20)],
                decoration: kInputDeco('Número de documento *'),
                validator: (v) {
                  final s = v?.trim() ?? '';
                  if (s.isEmpty) return 'Requerido';
                  if (s.length < 5 || s.length > 20) return 'Entre 5 y 20 caracteres';
                  return null;
                },
              ),
              if (_requiereRazonSocial) ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _razonSocial,
                  textCapitalization: TextCapitalization.words,
                  decoration: kInputDeco('Razón social'),
                  maxLength: 30,
                  buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                    const SizedBox.shrink(),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _contacto,
                  textCapitalization: TextCapitalization.words,
                  decoration: kInputDeco('Persona de contacto'),
                  maxLength: 30,
                  buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                    const SizedBox.shrink(),
                ),
              ],
            ]),

            _seccion('Contacto', [
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: kInputDeco('Correo electrónico *',
                  prefix: const Icon(Icons.email_outlined, color: kTextMuted)),
                validator: (v) {
                  if (v?.isEmpty ?? true) return 'Requerido';
                  if (!v!.contains('@') || !v.contains('.')) return 'Email inválido';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _telefono,
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[\d\+\s\-]')),
                  LengthLimitingTextInputFormatter(20),
                ],
                decoration: kInputDeco('Teléfono *',
                  prefix: const Icon(Icons.phone_outlined, color: kTextMuted)),
                validator: (v) {
                  final s = v?.trim() ?? '';
                  if (s.isEmpty) return 'Requerido';
                  if (s.replaceAll(RegExp(r'\D'), '').length < 7) return 'Mínimo 7 dígitos';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _ciudad,
                textCapitalization: TextCapitalization.words,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]')),
                  LengthLimitingTextInputFormatter(50),
                ],
                decoration: kInputDeco('Ciudad *',
                  prefix: const Icon(Icons.location_city_outlined, color: kTextMuted)),
                validator: (v) {
                  final s = v?.trim() ?? '';
                  if (s.isEmpty) return 'Requerida';
                  if (s.length < 2 || s.length > 50) return 'Entre 2 y 50 caracteres';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _direccion,
                decoration: kInputDeco('Dirección (opcional)',
                  prefix: const Icon(Icons.home_outlined, color: kTextMuted)),
                maxLength: 100,
                buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                  const SizedBox.shrink(),
              ),
            ]),

            if (_esEdicion) _seccion('Estado', [
              DropdownButtonFormField<String>(
                value: _estado,
                decoration: kInputDeco('Estado'),
                items: const [
                  DropdownMenuItem(value: 'activo',   child: Text('Activo')),
                  DropdownMenuItem(value: 'inactivo', child: Text('Inactivo')),
                ],
                onChanged: (v) => setState(() => _estado = v!),
              ),
            ]),

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
                  : Text(_esEdicion ? 'Guardar cambios' : 'Registrar cliente',
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

  Future<void> _guardar() async {
    if (!_key.currentState!.validate()) return;
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'nombres':          _nombres.text.trim(),
      'apellidos':        _apellidos.text.trim(),
      'email':            _email.text.trim(),
      'telefono':         _telefono.text.trim(),
      'ciudad':           _ciudad.text.trim(),
      'tipo_documento':   _tipoDoc,
      'numero_documento': _numDoc.text.trim(),
      'estado':           _estado,
    };
    if (_direccion.text.trim().isNotEmpty) body['direccion']   = _direccion.text.trim();
    if (_razonSocial.text.trim().isNotEmpty) body['razon_social'] = _razonSocial.text.trim();
    if (_contacto.text.trim().isNotEmpty) body['contacto']    = _contacto.text.trim();

    try {
      final prov = context.read<ClienteProvider>();
      if (_esEdicion) {
        await prov.actualizar(widget.cliente!.id, body);
      } else {
        await prov.crear(body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_esEdicion ? 'Cliente actualizado' : 'Cliente registrado'),
          backgroundColor: kPrimary, behavior: SnackBarBehavior.floating));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: kError,
        behavior: SnackBarBehavior.floating));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
