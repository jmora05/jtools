import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants.dart';
import '../core/api_service.dart';

class RecuperarPage extends StatefulWidget {
  const RecuperarPage({super.key});
  @override State<RecuperarPage> createState() => _RecuperarPageState();
}

class _RecuperarPageState extends State<RecuperarPage> {
  int _step = 0; // 0=email, 1=código, 2=nueva contraseña

  final _emailCtrl    = TextEditingController();
  final _codeCtrl     = TextEditingController();
  final _passCtrl     = TextEditingController();
  final _confirmCtrl  = TextEditingController();

  bool _loading       = false;
  bool _obscurePass   = true;
  bool _obscureConf   = true;
  String? _error;
  String? _resetToken;

  @override
  void dispose() {
    _emailCtrl.dispose(); _codeCtrl.dispose();
    _passCtrl.dispose(); _confirmCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kPrimaryDark, foregroundColor: Colors.white,
        title: const Text('Recuperar contraseña',
          style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _step == 0 ? _buildEmail()
               : _step == 1 ? _buildCode()
               : _buildNewPassword(),
        ),
      ),
    );
  }

  // ── Paso 1: email ─────────────────────────────────────────────────────────────
  Widget _buildEmail() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const SizedBox(height: 16),
    const Icon(Icons.lock_reset_outlined, size: 48, color: kPrimary),
    const SizedBox(height: 16),
    const Text('¿Olvidaste tu contraseña?',
      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kText)),
    const SizedBox(height: 8),
    const Text(
      'Ingresa tu correo y te enviaremos un código de 6 dígitos para restablecerla.',
      style: TextStyle(color: kTextMuted, fontSize: 14, height: 1.5)),
    const SizedBox(height: 28),
    if (_error != null) ...[_errorBanner(_error!), const SizedBox(height: 16)],
    TextFormField(
      controller: _emailCtrl,
      keyboardType: TextInputType.emailAddress,
      decoration: kInputDeco('Correo electrónico',
        prefix: const Icon(Icons.email_outlined, color: kTextMuted)),
    ),
    const SizedBox(height: 24),
    SizedBox(
      width: double.infinity, height: 52,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: kPrimary, foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 2,
        ),
        onPressed: _loading ? null : _enviarCodigo,
        child: _loading
          ? const SizedBox(width: 22, height: 22,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Text('Enviar código', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
    ),
  ]);

  // ── Paso 2: código OTP ────────────────────────────────────────────────────────
  Widget _buildCode() => Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
    const SizedBox(height: 24),
    Container(
      width: 72, height: 72,
      decoration: BoxDecoration(color: kPrimary.withOpacity(0.1), shape: BoxShape.circle),
      child: const Icon(Icons.mark_email_unread_outlined, color: kPrimary, size: 36),
    ),
    const SizedBox(height: 20),
    const Text('Revisa tu correo',
      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kText)),
    const SizedBox(height: 8),
    Text('Enviamos un código de 6 dígitos a\n${_emailCtrl.text}',
      textAlign: TextAlign.center,
      style: const TextStyle(color: kTextMuted, fontSize: 14, height: 1.5)),
    const SizedBox(height: 28),
    if (_error != null) ...[_errorBanner(_error!), const SizedBox(height: 16)],
    TextFormField(
      controller: _codeCtrl,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.center,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 12),
      decoration: kInputDeco(''),
    ),
    const SizedBox(height: 24),
    SizedBox(
      width: double.infinity, height: 52,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: kPrimary, foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 2,
        ),
        onPressed: _loading ? null : _verificarCodigo,
        child: _loading
          ? const SizedBox(width: 22, height: 22,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Text('Verificar código', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
    ),
    const SizedBox(height: 16),
    TextButton(
      onPressed: _loading ? null : _enviarCodigo,
      child: const Text('Reenviar código', style: TextStyle(color: kPrimary)),
    ),
    TextButton(
      onPressed: () => setState(() { _step = 0; _error = null; _codeCtrl.clear(); }),
      child: const Text('Cambiar correo', style: TextStyle(color: kTextMuted)),
    ),
  ]);

  // ── Paso 3: nueva contraseña ──────────────────────────────────────────────────
  Widget _buildNewPassword() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const SizedBox(height: 16),
    const Icon(Icons.lock_outline, size: 48, color: kPrimary),
    const SizedBox(height: 16),
    const Text('Nueva contraseña',
      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kText)),
    const SizedBox(height: 8),
    const Text('Elige una contraseña segura (mín. 8 caracteres, 1 mayúscula, 1 número, 1 símbolo).',
      style: TextStyle(color: kTextMuted, fontSize: 14, height: 1.5)),
    const SizedBox(height: 28),
    if (_error != null) ...[_errorBanner(_error!), const SizedBox(height: 16)],
    TextFormField(
      controller: _passCtrl,
      obscureText: _obscurePass,
      decoration: kInputDeco('Nueva contraseña',
        prefix: const Icon(Icons.lock_outline, color: kTextMuted))
        .copyWith(
        suffixIcon: IconButton(
          icon: Icon(_obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: kTextMuted),
          onPressed: () => setState(() => _obscurePass = !_obscurePass),
        ),
      ),
    ),
    const SizedBox(height: 12),
    TextFormField(
      controller: _confirmCtrl,
      obscureText: _obscureConf,
      decoration: kInputDeco('Confirmar contraseña',
        prefix: const Icon(Icons.lock_outline, color: kTextMuted))
        .copyWith(
        suffixIcon: IconButton(
          icon: Icon(_obscureConf ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: kTextMuted),
          onPressed: () => setState(() => _obscureConf = !_obscureConf),
        ),
      ),
    ),
    const SizedBox(height: 24),
    SizedBox(
      width: double.infinity, height: 52,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: kPrimary, foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 2,
        ),
        onPressed: _loading ? null : _cambiarPassword,
        child: _loading
          ? const SizedBox(width: 22, height: 22,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Text('Restablecer contraseña', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
    ),
  ]);

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

  Future<void> _enviarCodigo() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Ingresa un correo electrónico válido');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ApiService.post('/auth/forgot-password', {'email': email});
      if (mounted) setState(() { _step = 1; _codeCtrl.clear(); });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verificarCodigo() async {
    final code = _codeCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Ingresa el código de 6 dígitos');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.post('/auth/verify-reset-code',
        {'email': _emailCtrl.text.trim(), 'code': code});
      final token = (data as Map<String, dynamic>)['resetToken'] as String?;
      if (token == null) throw Exception('No se recibió el token de restablecimiento');
      if (mounted) setState(() { _resetToken = token; _step = 2; });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cambiarPassword() async {
    final pass    = _passCtrl.text;
    final confirm = _confirmCtrl.text;
    if (pass.length < 8) {
      setState(() => _error = 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!RegExp(r'[A-Z]').hasMatch(pass)) {
      setState(() => _error = 'Debe tener al menos una letra mayúscula');
      return;
    }
    if (!RegExp(r'\d').hasMatch(pass)) {
      setState(() => _error = 'Debe tener al menos un número');
      return;
    }
    if (!RegExp(r'[!@#\$%\^&\*\(\),\.\?":{}|<>]').hasMatch(pass)) {
      setState(() => _error = 'Debe tener al menos un carácter especial');
      return;
    }
    if (pass != confirm) {
      setState(() => _error = 'Las contraseñas no coinciden');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ApiService.post('/auth/reset-password', {
        'resetToken': _resetToken,
        'newPassword': pass,
        'confirmPassword': confirm,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Contraseña restablecida. Ya puedes iniciar sesión.'),
          backgroundColor: Color(0xFF0F766E), behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 3),
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
