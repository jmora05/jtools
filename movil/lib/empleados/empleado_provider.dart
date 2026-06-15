import 'package:flutter/material.dart';
import '../core/api_service.dart';
import 'empleado_model.dart';

class EmpleadoProvider extends ChangeNotifier {
  List<Empleado> _empleados = [];
  bool _loading = false;
  String? _error;

  List<Empleado> get empleados => _empleados;
  bool get loading => _loading;
  String? get error => _error;

  // ─── Cargar todos ─────────────────────────────────────────────────────────
  Future<void> cargar() async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.get('/empleados') as List;
      _empleados = data.map((e) => Empleado.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  // ─── Crear ────────────────────────────────────────────────────────────────
  Future<void> crear(Map<String, dynamic> body) async {
    final data = await ApiService.post('/empleados', body);
    final nuevo = Empleado.fromJson(data['empleado'] ?? data);
    _empleados.insert(0, nuevo);
    notifyListeners();
  }

  // ─── Actualizar ───────────────────────────────────────────────────────────
  Future<void> actualizar(int id, Map<String, dynamic> body) async {
    final data = await ApiService.put('/empleados/$id', body);
    final updated = Empleado.fromJson(data['empleado'] ?? data);
    final i = _empleados.indexWhere((e) => e.id == id);
    if (i != -1) { _empleados[i] = updated; notifyListeners(); }
  }

  // ─── Desactivar ───────────────────────────────────────────────────────────
  Future<void> desactivar(int id) async {
    await ApiService.put('/empleados/$id/desactivar', {});
    await cargar();
  }

  // ─── Reactivar ────────────────────────────────────────────────────────────
  Future<void> reactivar(int id) async {
    await ApiService.put('/empleados/$id/reactivar', {});
    await cargar();
  }

  // ─── Verificar si puede eliminarse ─────────────────────────────────────────
  Future<Map<String, dynamic>> puedeEliminarse(int id) async {
    final data = await ApiService.get('/empleados/$id/puede-eliminarse');
    return data as Map<String, dynamic>;
  }

  // ─── Eliminar ─────────────────────────────────────────────────────────────
  Future<void> eliminar(int id) async {
    await ApiService.delete('/empleados/$id');
    _empleados.removeWhere((e) => e.id == id);
    notifyListeners();
  }
}
