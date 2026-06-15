import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/auth_provider.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});
  @override State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _key = GlobalKey<FormState>();
  int _step = 0; // 0=form, 1=otp

  final _nombres       = TextEditingController();
  final _apellidos     = TextEditingController();
  final _email         = TextEditingController();
  final _password      = TextEditingController();
  final _confirmPass   = TextEditingController();
  final _tipoDoc       = ValueNotifier<String?>('cedula');
  final _numDoc        = TextEditingController();
  final _telefono      = TextEditingController();
  final _ciudad        = TextEditingController();
  final _direccion     = TextEditingController();
  final _otp           = TextEditingController();

  bool _obscurePass    = true;
  bool _obscureConfirm = true;
  String? _error;

  static const _tiposDoc = [
    'cedula', 'nit', 'cedula de extranjeria', 'pasaporte', 'rut',
  ];

  @override
  void dispose() {
    _nombres.dispose(); _apellidos.dispose(); _email.dispose();
    _password.dispose(); _confirmPass.dispose(); _numDoc.dispose();
    _telefono.dispose(); _ciudad.dispose(); _direccion.dispose();
    _otp.dispose(); _tipoDoc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: Text(_step == 0 ? 'Crear cuenta' : 'Verificar correo',
          style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _step == 0 ? _buildForm() : _buildOtp(),
        ),
      ),
    );
  }

  Widget _buildForm() {
    final auth = context.watch<AuthProvider>();
    return Form(
      key: _key,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Información personal', style: TextStyle(
          fontWeight: FontWeight.w700, fontSize: 16, color: kText)),
        const SizedBox(height: 16),

        if (_error != null) ...[
          _errorBanner(_error!),
          const SizedBox(height: 14),
        ],

        TextFormField(
          controller: _nombres,
          textCapitalization: TextCapitalization.words,
          decoration: kInputDeco('Nombres *'),
          validator: (v) {
            final s = v?.trim() ?? '';
            if (s.isEmpty) return 'Requerido';
            if (s.length < 2) return 'Mínimo 2 caracteres';
            if (s.length > 100) return 'Máximo 100 caracteres';
            return null;
          },
        ),
        const SizedBox(height: 12),

        TextFormField(
          controller: _apellidos,
          textCapitalization: TextCapitalization.words,
          decoration: kInputDeco('Apellidos *'),
          validator: (v) {
            final s = v?.trim() ?? '';
            if (s.isEmpty) return 'Requerido';
            if (s.length < 2) return 'Mínimo 2 caracteres';
            if (s.length > 100) return 'Máximo 100 caracteres';
            return null;
          },
        ),
        const SizedBox(height: 12),

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
          controller: _password,
          obscureText: _obscurePass,
          decoration: kInputDeco('Contraseña *',
            prefix: const Icon(Icons.lock_outline, color: kTextMuted))
            .copyWith(
            suffixIcon: IconButton(
              icon: Icon(_obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                color: kTextMuted),
              onPressed: () => setState(() => _obscurePass = !_obscurePass),
            ),
          ),
          validator: (v) {
            final s = v ?? '';
            if (s.isEmpty) return 'Requerida';
            if (s.length < 8) return 'Mínimo 8 caracteres';
            if (!RegExp(r'[A-Z]').hasMatch(s)) return 'Debe tener al menos una mayúscula';
            if (!RegExp(r'\d').hasMatch(s)) return 'Debe tener al menos un número';
            if (!RegExp(r'[!@#\$%\^&\*\(\),\.\?":{}|<>]').hasMatch(s)) {
              return 'Debe tener al menos un carácter especial';
            }
            return null;
          },
        ),
        const SizedBox(height: 12),

        TextFormField(
          controller: _confirmPass,
          obscureText: _obscureConfirm,
          decoration: kInputDeco('Confirmar contraseña *',
            prefix: const Icon(Icons.lock_outline, color: kTextMuted))
            .copyWith(
            suffixIcon: IconButton(
              icon: Icon(_obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                color: kTextMuted),
              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            ),
          ),
          validator: (v) {
            if (v?.isEmpty ?? true) return 'Requerida';
            if (v != _password.text) return 'Las contraseñas no coinciden';
            return null;
          },
        ),
        const SizedBox(height: 24),

        const Text('Documento de identidad', style: TextStyle(
          fontWeight: FontWeight.w700, fontSize: 16, color: kText)),
        const SizedBox(height: 16),

        ValueListenableBuilder<String?>(
          valueListenable: _tipoDoc,
          builder: (_, val, __) => DropdownButtonFormField<String>(
            value: val,
            decoration: kInputDeco('Tipo de documento *'),
            items: _tiposDoc.map((t) => DropdownMenuItem(
              value: t,
              child: Text(t[0].toUpperCase() + t.substring(1)),
            )).toList(),
            onChanged: (v) => _tipoDoc.value = v,
            validator: (v) => v == null ? 'Requerido' : null,
          ),
        ),
        const SizedBox(height: 12),

        TextFormField(
          controller: _numDoc,
          keyboardType: TextInputType.text,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[\w\-]')),
            LengthLimitingTextInputFormatter(20),
          ],
          decoration: kInputDeco('Número de documento *'),
          validator: (v) {
            final s = v?.trim() ?? '';
            if (s.isEmpty) return 'Requerido';
            if (s.length < 4) return 'Mínimo 4 caracteres';
            return null;
          },
        ),
        const SizedBox(height: 24),

        const Text('Contacto', style: TextStyle(
          fontWeight: FontWeight.w700, fontSize: 16, color: kText)),
        const SizedBox(height: 16),

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
            final digits = s.replaceAll(RegExp(r'\D'), '');
            if (digits.length < 7) return 'Mínimo 7 dígitos';
            return null;
          },
        ),
        const SizedBox(height: 12),

        TextFormField(
          controller: _ciudad,
          textCapitalization: TextCapitalization.words,
          decoration: kInputDeco('Ciudad *',
            prefix: const Icon(Icons.location_city_outlined, color: kTextMuted)),
          validator: (v) {
            final s = v?.trim() ?? '';
            if (s.isEmpty) return 'Requerida';
            if (s.length < 2) return 'Mínimo 2 caracteres';
            if (s.length > 100) return 'Máximo 100 caracteres';
            return null;
          },
        ),
        const SizedBox(height: 12),

        TextFormField(
          controller: _direccion,
          decoration: kInputDeco('Dirección (opcional)',
            prefix: const Icon(Icons.home_outlined, color: kTextMuted)),
          maxLength: 200,
          buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
            const SizedBox.shrink(),
        ),
        const SizedBox(height: 32),

        SizedBox(
          width: double.infinity, height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: kPrimary, foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: auth.loading ? null : _registrar,
            child: auth.loading
              ? const SizedBox(width: 22, height: 22,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Crear cuenta', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 40),
      ]),
    );
  }

  Widget _buildOtp() {
    final auth = context.watch<AuthProvider>();
    return Column(children: [
      const SizedBox(height: 24),
      Container(
        width: 72, height: 72,
        decoration: BoxDecoration(
          color: kPrimary.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.mark_email_unread_outlined, color: kPrimary, size: 36),
      ),
      const SizedBox(height: 20),
      const Text('Revisa tu correo', style: TextStyle(
        fontSize: 22, fontWeight: FontWeight.w800, color: kText)),
      const SizedBox(height: 8),
      Text(
        'Enviamos un código de 6 dígitos a\n${_email.text}',
        textAlign: TextAlign.center,
        style: const TextStyle(color: kTextMuted, fontSize: 14),
      ),
      const SizedBox(height: 32),

      if (_error != null) ...[
        _errorBanner(_error!),
        const SizedBox(height: 14),
      ],

      TextFormField(
        controller: _otp,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(6),
        ],
        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 12),
        decoration: kInputDeco(''),
      ),
      const SizedBox(height: 28),

      SizedBox(
        width: double.infinity, height: 52,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: kPrimary, foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: auth.loading ? null : _verificar,
          child: auth.loading
            ? const SizedBox(width: 22, height: 22,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Text('Verificar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        ),
      ),
      const SizedBox(height: 16),
      TextButton(
        onPressed: () => setState(() { _step = 0; _error = null; }),
        child: const Text('Volver al formulario',
          style: TextStyle(color: kTextMuted)),
      ),
    ]);
  }

  Widget _errorBanner(String msg) => Container(
    width: double.infinity, padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: kError.withOpacity(0.08),
      border: Border.all(color: kError.withOpacity(0.3)),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Icon(Icons.error_outline, color: kError, size: 18),
      const SizedBox(width: 8),
      Expanded(child: Text(msg, style: const TextStyle(color: kError, fontSize: 13))),
    ]),
  );

  Future<void> _registrar() async {
    if (!_key.currentState!.validate()) return;
    setState(() => _error = null);
    final body = <String, dynamic>{
      'nombres':          _nombres.text.trim(),
      'apellidos':        _apellidos.text.trim(),
      'email':            _email.text.trim(),
      'password':         _password.text,
      'tipo_documento':   _tipoDoc.value,
      'numero_documento': _numDoc.text.trim(),
      'telefono':         _telefono.text.trim(),
      'ciudad':           _ciudad.text.trim(),
    };
    if (_direccion.text.trim().isNotEmpty) {
      body['direccion'] = _direccion.text.trim();
    }
    try {
      await context.read<AuthProvider>().register(body);
      if (mounted) setState(() => _step = 1);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  Future<void> _verificar() async {
    final code = _otp.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Ingresa el código de 6 dígitos');
      return;
    }
    setState(() => _error = null);
    try {
      await context.read<AuthProvider>().verifyCode(_email.text.trim(), code);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Cuenta verificada. Ya puedes iniciar sesión.'),
          backgroundColor: Color(0xFF0F766E),
          behavior: SnackBarBehavior.floating,
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }
}
