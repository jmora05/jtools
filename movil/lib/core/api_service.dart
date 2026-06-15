import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class ApiService {
  // ─── Token ────────────────────────────────────────────────────────────────
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jtools_token');
  }

  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jtools_token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jtools_token');
  }

  // ─── Headers ──────────────────────────────────────────────────────────────
  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  // ─── Manejo de respuesta ──────────────────────────────────────────────────
  static dynamic _parse(http.Response res) {
    final body = utf8.decode(res.bodyBytes);
    final data = jsonDecode(body);
    if (res.statusCode >= 200 && res.statusCode < 300) return data;

    // El backend devuelve errores de validación detallados en `errores: [...]`.
    // Los extraemos y mostramos como una lista legible en lugar del genérico
    // "Error de validación".
    final errores = data is Map ? data['errores'] : null;
    if (errores is List && errores.isNotEmpty) {
      final lista = errores.map((e) => e.toString()).join('\n');
      throw ApiException(lista, res.statusCode);
    }

    // Conflictos (409) y otros errores con `message` + `razon` opcional.
    if (data is Map && data['message'] != null) {
      final partes = <String>[
        data['message'].toString(),
        if (data['razon'] != null && data['razon'].toString().trim().isNotEmpty)
          data['razon'].toString(),
      ];
      throw ApiException(partes.join('\n').trim(), res.statusCode);
    }

    final msg = (data is Map ? data['error'] : null) ?? 'Error ${res.statusCode}';
    throw ApiException(msg.toString(), res.statusCode);
  }

  // ─── GET ─────────────────────────────────────────────────────────────────
  static Future<dynamic> get(String path) async {
    final res = await http.get(
      Uri.parse('$kBaseUrl$path'),
      headers: await _headers(),
    );
    return _parse(res);
  }

  // ─── POST ────────────────────────────────────────────────────────────────
  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$kBaseUrl$path'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ─── PUT ─────────────────────────────────────────────────────────────────
  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final res = await http.put(
      Uri.parse('$kBaseUrl$path'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ─── PATCH ───────────────────────────────────────────────────────────────
  static Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    final res = await http.patch(
      Uri.parse('$kBaseUrl$path'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    return _parse(res);
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────
  static Future<dynamic> delete(String path) async {
    final res = await http.delete(
      Uri.parse('$kBaseUrl$path'),
      headers: await _headers(),
    );
    return _parse(res);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
