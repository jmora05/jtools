import 'package:flutter/material.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoggedIn = false;
  String? _userName;
  String? _userRole;
  bool _loading = false;
  bool _initializing = true;

  bool get isLoggedIn => _isLoggedIn;
  String? get userName => _userName;
  String? get userRole => _userRole;
  bool get loading => _loading;
  bool get initializing => _initializing;

  // ─── Verificar token al iniciar ───────────────────────────────────────────
  Future<void> checkAuth() async {
    _initializing = true;
    notifyListeners();
    final token = await ApiService.getToken();
    _isLoggedIn = token != null && token.isNotEmpty;
    _initializing = false;
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

  // ─── Register ─────────────────────────────────────────────────────────────
  Future<void> register(Map<String, dynamic> body) async {
    _loading = true;
    notifyListeners();
    try {
      await ApiService.post('/auth/register', body);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ─── Verify OTP code ──────────────────────────────────────────────────────
  Future<void> verifyCode(String email, String code) async {
    _loading = true;
    notifyListeners();
    try {
      await ApiService.post('/auth/verify-code', {'email': email, 'code': code});
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
