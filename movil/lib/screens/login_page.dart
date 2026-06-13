import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/auth_provider.dart';
import 'register_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _key = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
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
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _key,
            child: Column(children: [
              const SizedBox(height: 48),
              // Logo / Ícono
              Container(
                width: 88, height: 88,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: kPrimary.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 6))],
                ),
                child: const Icon(Icons.build_circle_outlined, color: Colors.white, size: 44),
              ),
              const SizedBox(height: 28),
              const Text('JTools', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: kText)),
              const SizedBox(height: 4),
              const Text('Sistema de gestión empresarial', style: kSubtitle),
              const SizedBox(height: 48),

              // Error banner
              if (_error != null) ...[
                Container(
                  width: double.infinity, padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: kError.withOpacity(0.08),
                    border: Border.all(color: kError.withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(children: [
                    const Icon(Icons.error_outline, color: kError, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!, style: const TextStyle(color: kError, fontSize: 13))),
                  ]),
                ),
                const SizedBox(height: 16),
              ],

              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: kInputDeco('Correo electrónico', prefix: const Icon(Icons.email_outlined, color: kTextMuted)),
                validator: (v) {
                  if (v?.isEmpty ?? true) return 'Requerido';
                  if (!v!.contains('@')) return 'Email inválido';
                  return null;
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _pass,
                obscureText: _obscure,
                decoration: kInputDeco('Contraseña', prefix: const Icon(Icons.lock_outline, color: kTextMuted))
                  .copyWith(
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: kTextMuted),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null,
              ),
              const SizedBox(height: 28),

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
                    : const Text('Iniciar sesión', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 20),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text('¿No tienes cuenta? ', style: TextStyle(color: kTextMuted)),
                TextButton(
                  onPressed: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const RegisterPage())),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Crear cuenta',
                    style: TextStyle(color: kPrimary, fontWeight: FontWeight.w700)),
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
    setState(() => _error = null);
    try {
      await context.read<AuthProvider>().login(_email.text.trim(), _pass.text);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }
}
