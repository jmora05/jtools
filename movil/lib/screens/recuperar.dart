import 'dart:async';
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

  final _emailCtrl   = TextEditingController();
  final _codeCtrl    = TextEditingController();
  final _passCtrl    = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _loading      = false;
  bool _obscurePass  = true;
  bool _obscureConf  = true;
  String? _error;
  String? _resetToken;

  // Countdown para expiración de OTP (10 min)
  Timer? _countdownTimer;
  int _secondsLeft = 0;

  // Cooldown para reenviar código (60 s)
  int _resendCooldown = 0;
  Timer? _resendTimer;

  // Intentos restantes del servidor
  int _remainingAttempts = 5;

  // Validación de fortaleza de contraseña (tiempo real)
  bool _pwLen      = false;
  bool _pwUpper    = false;
  bool _pwNumber   = false;
  bool _pwSpecial  = false;

  @override
  void initState() {
    super.initState();
    _passCtrl.addListener(_checkPassword);
  }

  @override
  void dispose() {
    _emailCtrl.dispose(); _codeCtrl.dispose();
    _passCtrl.dispose(); _confirmCtrl.dispose();
    _countdownTimer?.cancel();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _checkPassword() {
    final p = _passCtrl.text;
    setState(() {
      _pwLen     = p.length >= 8;
      _pwUpper   = RegExp(r'[A-Z]').hasMatch(p);
      _pwNumber  = RegExp(r'\d').hasMatch(p);
      _pwSpecial = RegExp(r'[!@#\$%\^&\*\(\),\.\?":{}|<>]').hasMatch(p);
    });
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    setState(() => _secondsLeft = 10 * 60); // 10 minutos
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) {
        t.cancel();
        if (mounted) {
          setState(() => _error = 'El código ha expirado. Solicita uno nuevo.');
          _step = 0;
        }
      } else {
        if (mounted) setState(() => _secondsLeft--);
      }
    });
  }

  void _startResendCooldown() {
    _resendTimer?.cancel();
    setState(() => _resendCooldown = 60);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resendCooldown <= 0) {
        t.cancel();
        if (mounted) setState(() => _resendCooldown = 0);
      } else {
        if (mounted) setState(() => _resendCooldown--);
      }
    });
  }

  String get _countdownStr {
    final mm = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final ss = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$mm:$ss';
  }

  static final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

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

  // ── Paso 1: email ──────────────────────────────────────────────────────────────
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

  // ── Paso 2: código OTP ─────────────────────────────────────────────────────────
  Widget _buildCode() => Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
    const SizedBox(height: 24),
    Container(
      width: 72, height: 72,
      decoration: BoxDecoration(color: kPrimary.withValues(alpha: 0.1), shape: BoxShape.circle),
      child: const Icon(Icons.mark_email_unread_outlined, color: kPrimary, size: 36),
    ),
    const SizedBox(height: 20),
    const Text('Revisa tu correo',
      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kText)),
    const SizedBox(height: 8),
    Text('Enviamos un código de 6 dígitos a\n${_emailCtrl.text}',
      textAlign: TextAlign.center,
      style: const TextStyle(color: kTextMuted, fontSize: 14, height: 1.5)),

    // ── Countdown ──────────────────────────────────────────────────────────────
    const SizedBox(height: 12),
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: _secondsLeft < 60 ? kError.withValues(alpha: 0.08) : kChipBg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.timer_outlined,
          size: 16, color: _secondsLeft < 60 ? kError : kPrimaryDark),
        const SizedBox(width: 6),
        Text('Expira en $_countdownStr',
          style: TextStyle(
            fontSize: 13, fontWeight: FontWeight.w600,
            color: _secondsLeft < 60 ? kError : kPrimaryDark)),
      ]),
    ),

    const SizedBox(height: 20),
    if (_error != null) ...[_errorBanner(_error!), const SizedBox(height: 16)],

    // Intentos restantes
    if (_remainingAttempts < 5) ...[
      Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: _remainingAttempts <= 1 ? kError.withValues(alpha: 0.08) : kWarning.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: _remainingAttempts <= 1 ? kError.withValues(alpha: 0.3) : kWarning.withValues(alpha: 0.3)),
        ),
        child: Row(children: [
          Icon(Icons.warning_amber_outlined,
            size: 16,
            color: _remainingAttempts <= 1 ? kError : kWarning),
          const SizedBox(width: 6),
          Text(
            _remainingAttempts == 0
              ? 'Sin intentos restantes. Solicita un nuevo código.'
              : 'Te quedan $_remainingAttempts intento(s) restante(s)',
            style: TextStyle(
              fontSize: 13,
              color: _remainingAttempts <= 1 ? kError : kTextMuted)),
        ]),
      ),
    ],

    TextFormField(
      controller: _codeCtrl,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.center,
      enabled: _remainingAttempts > 0,
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
        onPressed: (_loading || _remainingAttempts == 0) ? null : _verificarCodigo,
        child: _loading
          ? const SizedBox(width: 22, height: 22,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Text('Verificar código', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
    ),
    const SizedBox(height: 16),

    // Reenviar con cooldown
    if (_resendCooldown > 0)
      Text('Reenviar código en ${_resendCooldown}s',
        style: const TextStyle(color: kTextMuted, fontSize: 13))
    else
      TextButton(
        onPressed: _loading ? null : _enviarCodigo,
        child: const Text('Reenviar código', style: TextStyle(color: kPrimary)),
      ),

    TextButton(
      onPressed: () => setState(() {
        _step = 0; _error = null; _codeCtrl.clear();
        _countdownTimer?.cancel(); _resendTimer?.cancel();
        _remainingAttempts = 5;
      }),
      child: const Text('Cambiar correo', style: TextStyle(color: kTextMuted)),
    ),
  ]);

  // ── Paso 3: nueva contraseña ───────────────────────────────────────────────────
  Widget _buildNewPassword() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const SizedBox(height: 16),
    const Icon(Icons.lock_outline, size: 48, color: kPrimary),
    const SizedBox(height: 16),
    const Text('Nueva contraseña',
      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kText)),
    const SizedBox(height: 8),
    const Text('Elige una contraseña segura.',
      style: TextStyle(color: kTextMuted, fontSize: 14, height: 1.5)),
    const SizedBox(height: 24),
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

    // Checklist de fortaleza
    if (_passCtrl.text.isNotEmpty) ...[
      const SizedBox(height: 12),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: kChipBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: kBorder),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Requisitos:',
            style: TextStyle(fontSize: 12, color: kTextMuted, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          _reqRow(_pwLen,    'Mínimo 8 caracteres'),
          _reqRow(_pwUpper,  'Al menos 1 mayúscula'),
          _reqRow(_pwNumber, 'Al menos 1 número'),
          _reqRow(_pwSpecial,'Al menos 1 carácter especial (!@#\$...)'),
        ]),
      ),
    ],

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

  Widget _reqRow(bool ok, String label) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(children: [
      Icon(ok ? Icons.check_circle_outline : Icons.radio_button_unchecked,
        size: 16, color: ok ? kPrimary : kTextMuted),
      const SizedBox(width: 6),
      Text(label, style: TextStyle(fontSize: 12, color: ok ? kPrimaryDark : kTextMuted)),
    ]),
  );

  Widget _errorBanner(String msg) => Container(
    width: double.infinity, padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: kError.withValues(alpha: 0.08),
      border: Border.all(color: kError.withValues(alpha: 0.3)),
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
    if (email.isEmpty) {
      setState(() => _error = 'Ingresa tu correo electrónico');
      return;
    }
    if (!_emailRegex.hasMatch(email)) {
      setState(() => _error = 'Ingresa un correo electrónico válido');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ApiService.post('/auth/forgot-password', {'email': email});
      if (mounted) {
        setState(() {
          _step = 1;
          _codeCtrl.clear();
          _remainingAttempts = 5;
        });
        _startCountdown();
        _startResendCooldown();
      }
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
      final map = data as Map<String, dynamic>;
      final token = map['resetToken'] as String?;
      if (token == null) throw Exception('No se recibió el token de restablecimiento');
      _countdownTimer?.cancel();
      if (mounted) setState(() { _resetToken = token; _step = 2; });
    } catch (e) {
      if (mounted) {
        final msg = e.toString();
        // Extraer intentos restantes del mensaje del backend
        final match = RegExp(r'(\d+) intento').firstMatch(msg);
        if (match != null) {
          setState(() => _remainingAttempts = int.parse(match.group(1)!));
        } else {
          setState(() => _remainingAttempts = (_remainingAttempts - 1).clamp(0, 5));
        }
        setState(() => _error = msg);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cambiarPassword() async {
    final pass    = _passCtrl.text;
    final confirm = _confirmCtrl.text;
    if (!_pwLen || !_pwUpper || !_pwNumber || !_pwSpecial) {
      setState(() => _error = 'La contraseña no cumple los requisitos de seguridad');
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
          backgroundColor: kPrimary, behavior: SnackBarBehavior.floating,
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
