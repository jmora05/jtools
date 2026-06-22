import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/debouncer.dart';
import '../core/api_service.dart';
import '../core/widgets/departamento_ciudad_select.dart';
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
      _direccion, _fechaIngreso, _salario;
  String? _departamento;
  String? _ciudad;

  // Contraseña (opcional)
  late final TextEditingController _password, _confirmPassword;
  bool _obscurePass = true;
  bool _obscureConf = true;
  bool _pwLen = false, _pwUpper = false, _pwNum = false, _pwSpecial = false;

  String _tipoDocValue = 'CC';
  String _areaValue    = 'Administración';
  String _estadoValue  = 'activo';

  final List<String> _tiposDocs = ['CC', 'CE', 'PPT'];
  final List<String> _areas     = ['Producción', 'Administración'];

  bool get _isEdit => widget.empleado != null;

  // Validación de unicidad en tiempo real
  final _debouncer = Debouncer();
  String? _errorNumDoc, _errorEmail, _errorTelefono;
  bool get _hayErroresUnicidad =>
      _errorNumDoc != null || _errorEmail != null || _errorTelefono != null;

  void _verificar(String campo, String valor, void Function(String?) asignar) {
    setState(() => asignar(null));
    if (valor.trim().isEmpty) return;
    _debouncer.run(() async {
      final res = await ApiService.verificarUnicidad(
        modulo: 'empleados',
        campo: campo,
        valor: valor.trim(),
        excluirId: widget.empleado?.id,
      );
      if (mounted && res['existe'] == true) {
        setState(() => asignar(res['mensaje']?.toString() ?? 'Ya está registrado'));
      }
    });
  }

  static final _pwRegex = RegExp(r'[!@#\$%\^&\*\(\),\.\?":{}|<>]');

  @override
  void initState() {
    super.initState();
    final e = widget.empleado;
    _nombres      = TextEditingController(text: e?.nombres ?? '');
    _apellidos    = TextEditingController(text: e?.apellidos ?? '');
    _tipoDoc      = TextEditingController(text: e?.tipoDocumento ?? 'CC');
    _numDoc       = TextEditingController(text: e?.numeroDocumento ?? '');
    _telefono     = TextEditingController(text: e?.telefono ?? '');
    _email        = TextEditingController(text: e?.email ?? '');
    _cargo        = TextEditingController(text: e?.cargo ?? '');
    _area         = TextEditingController(text: e?.area ?? '');
    _direccion    = TextEditingController(text: e?.direccion ?? '');
    _departamento = (e?.departamento?.isNotEmpty ?? false) ? e!.departamento : null;
    _ciudad       = (e?.ciudad?.isNotEmpty ?? false) ? e!.ciudad : null;
    _fechaIngreso = TextEditingController(
        text: e?.fechaIngreso ?? DateTime.now().toIso8601String().split('T')[0]);
    _salario      = TextEditingController(text: e?.salario.toStringAsFixed(0) ?? '');
    _password     = TextEditingController();
    _confirmPassword = TextEditingController();
    _tipoDocValue = e?.tipoDocumento ?? 'CC';
    _areaValue    = e?.area ?? 'Administración';
    _estadoValue  = e?.estado ?? 'activo';
    _password.addListener(_checkPassword);
  }

  @override
  void dispose() {
    _debouncer.dispose();
    for (final c in [_nombres, _apellidos, _tipoDoc, _numDoc, _telefono,
        _email, _cargo, _area, _direccion, _fechaIngreso, _salario,
        _password, _confirmPassword]) {
      c.dispose();
    }
    super.dispose();
  }

  void _checkPassword() {
    final p = _password.text;
    setState(() {
      _pwLen     = p.length >= 8;
      _pwUpper   = RegExp(r'[A-Z]').hasMatch(p);
      _pwNum     = RegExp(r'\d').hasMatch(p);
      _pwSpecial = _pwRegex.hasMatch(p);
    });
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
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _seccion('Información Personal', [
              _row([
                _dropField('Tipo documento', _tipoDocValue, _tiposDocs,
                  (v) => setState(() { _tipoDocValue = v!; _tipoDoc.text = v; })),
                _textField(_numDoc, 'N° Documento',
                  keyboard: TextInputType.number,
                  maxLength: 11,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onChanged: (v) => _verificar('numeroDocumento', v, (e) => _errorNumDoc = e),
                  errorUnicidad: _errorNumDoc,
                  validator: (v) {
                    final s = (v ?? '').trim();
                    if (s.isEmpty) return 'Requerido';
                    if (!RegExp(r'^[0-9]+$').hasMatch(s)) return 'Solo se permiten números';
                    if (s.length < 6) return 'Mínimo 6 dígitos';
                    if (s.length > 11) return 'Máximo 11 dígitos';
                    return null;
                  }),
              ]),
              _row([
                _textField(_nombres, 'Nombres',
                  maxLength: 50,
                  validator: (v) => _validarNombre(v)),
                _textField(_apellidos, 'Apellidos',
                  maxLength: 50,
                  validator: (v) => _validarNombre(v)),
              ]),
            ]),
            _seccion('Contacto', [
              _textField(_email, 'Correo electrónico',
                keyboard: TextInputType.emailAddress,
                maxLength: 50,
                onChanged: (v) => _verificar('email', v, (e) => _errorEmail = e),
                errorUnicidad: _errorEmail,
                validator: (v) {
                  final s = (v ?? '').trim();
                  if (s.isEmpty) return 'Requerido';
                  if (!RegExp(r'^[\w\.-]+@[\w\.-]+\.\w{2,}$').hasMatch(s)) return 'Email inválido';
                  if (s.length > 50) return 'Máximo 50 caracteres';
                  return null;
                }),
              _textField(_telefono, 'Teléfono',
                keyboard: TextInputType.phone,
                maxLength: 11,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (v) => _verificar('telefono', v, (e) => _errorTelefono = e),
                errorUnicidad: _errorTelefono,
                validator: (v) {
                  final s = (v ?? '').trim();
                  if (s.isEmpty) return 'Requerido';
                  if (!RegExp(r'^[0-9]+$').hasMatch(s)) return 'Solo se permiten números';
                  if (s.length < 7) return 'Mínimo 7 dígitos';
                  if (s.length > 11) return 'Máximo 11 dígitos';
                  return null;
                }),
              _textField(_direccion, 'Dirección'),
              DepartamentoCiudadSelect(
                departamento: _departamento,
                ciudad: _ciudad,
                onDepartamentoChanged: (v) => setState(() => _departamento = v),
                onCiudadChanged: (v) => setState(() => _ciudad = v),
                departamentoRequired: false,
                ciudadRequired: false,
              ),
            ]),
            _seccion('Información Laboral', [
              _textField(_cargo, 'Cargo',
                maxLength: 50,
                validator: (v) {
                  final s = (v ?? '').trim();
                  if (s.isEmpty) return 'Requerido';
                  if (s.length < 2) return 'Mínimo 2 caracteres';
                  if (s.length > 50) return 'Máximo 50 caracteres';
                  return null;
                }),
              _dropField('Área', _areaValue, _areas,
                (v) => setState(() { _areaValue = v!; _area.text = v; })),
              _datePicker(),
              _textField(_salario, 'Salario base mensual',
                keyboard: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                validator: (v) {
                  final s = (v ?? '').trim();
                  if (s.isEmpty) return 'Requerido';
                  final n = double.tryParse(s);
                  if (n == null) return 'Número inválido';
                  if (n <= 0) return 'Debe ser mayor a 0';
                  return null;
                }),
              if (_isEdit) _estadoField(),
            ]),
            _seccion('Cuenta de acceso (opcional)', [
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _isEdit
                    ? 'Ingresa una nueva contraseña para actualizar el acceso al sistema de este empleado.'
                    : 'Si deseas que este empleado pueda iniciar sesión, asígnale una contraseña.',
                  style: const TextStyle(color: kTextMuted, fontSize: 13, height: 1.4)),
              ),
              _passwordField(_password, 'Contraseña', _obscurePass,
                () => setState(() => _obscurePass = !_obscurePass),
                validator: (v) {
                  if (v == null || v.isEmpty) return null; // opcional
                  if (!_pwLen)     return 'Mínimo 8 caracteres';
                  if (!_pwUpper)   return 'Al menos 1 mayúscula';
                  if (!_pwNum)     return 'Al menos 1 número';
                  if (!_pwSpecial) return 'Al menos 1 carácter especial';
                  return null;
                }),
              if (_password.text.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: kChipBg, borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: kBorder)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _reqRow(_pwLen,     'Mínimo 8 caracteres'),
                    _reqRow(_pwUpper,   'Al menos 1 mayúscula'),
                    _reqRow(_pwNum,     'Al menos 1 número'),
                    _reqRow(_pwSpecial, 'Al menos 1 carácter especial'),
                  ]),
                ),
              ],
              _passwordField(_confirmPassword, 'Confirmar contraseña', _obscureConf,
                () => setState(() => _obscureConf = !_obscureConf),
                validator: (v) {
                  if (_password.text.isEmpty) return null;
                  if (v == null || v.isEmpty) return 'Confirma la contraseña';
                  if (v != _password.text) return 'Las contraseñas no coinciden';
                  return null;
                }),
            ]),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity, height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary, foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: (_saving || _hayErroresUnicidad) ? null : _guardar,
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

  Widget _reqRow(bool ok, String label) => Padding(
    padding: const EdgeInsets.only(bottom: 3),
    child: Row(children: [
      Icon(ok ? Icons.check_circle_outline : Icons.radio_button_unchecked,
        size: 15, color: ok ? kPrimary : kTextMuted),
      const SizedBox(width: 6),
      Text(label, style: TextStyle(fontSize: 12, color: ok ? kPrimaryDark : kTextMuted)),
    ]),
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

  Widget _row(List<Widget> children) => Row(
    children: children.map((c) => Expanded(child: Padding(
      padding: const EdgeInsets.only(right: 8), child: c,
    ))).toList()
      ..last = Expanded(child: children.last),
  );

  String? _validarNombre(String? v) {
    final s = (v ?? '').trim();
    if (s.isEmpty) return 'Requerido';
    if (s.length < 2) return 'Mínimo 2 caracteres';
    if (s.length > 50) return 'Máximo 50 caracteres';
    if (RegExp(r'[0-9]').hasMatch(s)) return 'Solo se permiten letras';
    return null;
  }

  Widget _textField(TextEditingController c, String label, {
    TextInputType? keyboard,
    int? maxLength,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
    String? errorUnicidad,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: c,
          keyboardType: keyboard,
          maxLength: maxLength,
          inputFormatters: inputFormatters,
          validator: validator,
          onChanged: onChanged,
          decoration: kInputDeco(label).copyWith(counterText: ''),
        ),
        fieldError(errorUnicidad),
      ],
    ),
  );

  Widget _passwordField(
    TextEditingController c,
    String label,
    bool obscure,
    VoidCallback toggleObscure, {
    String? Function(String?)? validator,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: c,
      obscureText: obscure,
      validator: validator,
      decoration: kInputDeco(label,
        prefix: const Icon(Icons.lock_outline, color: kTextMuted))
        .copyWith(
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: kTextMuted),
          onPressed: toggleObscure,
        ),
      ),
    ),
  );

  Widget _dropField(String label, String value, List<String> items, void Function(String?) onChanged) =>
    Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        initialValue: value,
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
      decoration: kInputDeco('Fecha de ingreso',
        prefix: const Icon(Icons.calendar_today, color: kTextMuted)),
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
      initialValue: _estadoValue,
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
      final body = <String, dynamic>{
        'nombres':          _nombres.text.trim(),
        'apellidos':        _apellidos.text.trim(),
        'tipoDocumento':    _tipoDocValue,
        'numeroDocumento':  _numDoc.text.trim(),
        'telefono':         _telefono.text.trim(),
        'email':            _email.text.trim(),
        'cargo':            _cargo.text.trim(),
        'area':             _areaValue,
        'direccion':        _direccion.text.trim(),
        'ciudad':           _ciudad ?? '',
        'departamento':     _departamento ?? '',
        'fechaIngreso':     _fechaIngreso.text,
        'salario':          double.parse(_salario.text),
        'estado':           _estadoValue,
        if (_password.text.isNotEmpty) ...{
          'password':        _password.text,
          'confirmPassword': _confirmPassword.text,
        },
      };
      if (_isEdit) {
        await prov.actualizar(widget.empleado!.id, body);
      } else {
        await prov.crear(body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEdit ? 'Empleado actualizado' : 'Empleado registrado'),
          backgroundColor: kPrimary, behavior: SnackBarBehavior.floating,
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: kError,
            behavior: SnackBarBehavior.floating));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
