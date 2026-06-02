import 'package:flutter/material.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  String? _userName;
  String? _userRole;
  bool _loading = false;

  bool get isLoggedIn => _isLoggedIn;
  String? get userName => _userName;
  String? get userRole => _userRole;
  bool get loading => _loading;

  // ─── Verificar token al iniciar ───────────────────────────────────────────
  Future<void> checkAuth() async {
    final token = await ApiService.getToken();
    _isLoggedIn = token != null && token.isNotEmpty;
    notifyListeners();
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  Future<void> login(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final data = await ApiService.post('/auth/login', {
        'email': email,
        'password': password,
      });
      final token = data['token'] as String?;
      if (token == null) throw Exception('Token no recibido');
      await ApiService.setToken(token);
      _isLoggedIn = true;
      _userName = data['usuario']?['nombres'] ?? data['usuario']?['email'] ?? email;
      _userRole = data['usuario']?['rol']?['nombre'] ?? '';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  Future<void> logout() async {
    await ApiService.clearToken();
    _isLoggedIn = false;
    _userName = null;
    _userRole = null;
    notifyListeners();
  }
}
