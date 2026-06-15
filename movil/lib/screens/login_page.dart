import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/auth_provider.dart';
import 'register_page.dart';
import 'recuperar.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _key   = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _pass  = TextEditingController();
  bool _obscure = true;
  String? _error;
  bool _showConnecting = false;
  Timer? _connectingTimer;

  @override
  void dispose() {
    _connectingTimer?.cancel();
    _email.dispose(); _pass.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Form(
            key: _key,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SizedBox(height: 40),

              // ── Logo + título centrado ──────────────────────────────────────
              Center(child: Column(children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(
                      color: kPrimary.withValues(alpha: 0.35),
                      blurRadius: 18, offset: const Offset(0, 6),
                    )],
                  ),
                  child: const Icon(Icons.build_circle_outlined,
                    color: Colors.white, size: 40),
                ),
                const SizedBox(height: 20),
                const Text('JTools',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: kText)),
                const SizedBox(height: 4),
                const Text('Sistema de gestión empresarial',
                  style: TextStyle(color: kTextMuted, fontSize: 13)),
              ])),

              const SizedBox(height: 36),

              // ── Saludo ─────────────────────────────────────────────────────
              const Text('Bienvenido de nuevo',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: kText)),
              const SizedBox(height: 4),
              const Text('Inicia sesión para continuar',
                style: TextStyle(color: kTextMuted, fontSize: 14)),

              const SizedBox(height: 24),

              // ── Error banner ───────────────────────────────────────────────
              if (_error != null) ...[
                Container(
                  width: double.infinity, padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: kError.withValues(alpha: 0.08),
                    border: Border.all(color: kError.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Icon(Icons.error_outline, color: kError, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!,
                      style: const TextStyle(color: kError, fontSize: 13))),
                  ]),
                ),
                const SizedBox(height: 16),
              ],

              // ── Campo email ────────────────────────────────────────────────
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: kInputDeco('Correo electrónico',
                  prefix: const Icon(Icons.email_outlined, color: kTextMuted)),
                validator: (v) {
                  if (v?.isEmpty ?? true) return 'Requerido';
                  if (!v!.contains('@')) return 'Email inválido';
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // ── Campo contraseña ───────────────────────────────────────────
              TextFormField(
                controller: _pass,
                obscureText: _obscure,
                decoration: kInputDeco('Contraseña',
                  prefix: const Icon(Icons.lock_outline, color: kTextMuted))
                  .copyWith(
                  suffixIcon: IconButton(
                    icon: Icon(_obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                      color: kTextMuted),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null,
              ),

              // ── ¿Olvidaste tu contraseña? ──────────────────────────────────
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const RecuperarPage())),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 6),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('¿Olvidaste tu contraseña?',
                    style: TextStyle(color: kPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                ),
              ),

              const SizedBox(height: 20),

              // ── Botón iniciar sesión ───────────────────────────────────────
              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary, foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 2,
                  ),
                  onPressed: auth.loading ? null : _iniciarSesion,
                  child: auth.loading
                    ? const SizedBox(width: 22, height: 22,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Iniciar sesión',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),

              // ── Mensaje de servidor lento ──────────────────────────────────
              if (_showConnecting && auth.loading)
                const Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: Text(
                    'Conectando con el servidor...',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kTextMuted, fontSize: 12),
                  ),
                ),

              const SizedBox(height: 24),

              // ── Crear cuenta ───────────────────────────────────────────────
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text('¿No tienes cuenta? ',
                  style: TextStyle(color: kTextMuted, fontSize: 14)),
                TextButton(
                  onPressed: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const RegisterPage())),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Crear cuenta',
                    style: TextStyle(color: kPrimary, fontWeight: FontWeight.w700, fontSize: 14)),
                ),
              ]),
            ]),
          ),
        ),
      ),
    );
  }

  Future<void> _iniciarSesion() async {
    if (!_key.currentState!.validate()) return;
    setState(() { _error = null; _showConnecting = false; });
    _connectingTimer?.cancel();
    _connectingTimer = Timer(const Duration(seconds: 5), () {
      if (mounted) setState(() => _showConnecting = true);
    });
    try {
      await context.read<AuthProvider>().login(_email.text.trim(), _pass.text);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      _connectingTimer?.cancel();
      if (mounted) setState(() => _showConnecting = false);
    }
  }
}
