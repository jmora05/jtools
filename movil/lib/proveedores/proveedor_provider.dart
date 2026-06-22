import 'package:flutter/material.dart';
import '../core/api_service.dart';
import 'proveedor_model.dart';

class ProveedorProvider extends ChangeNotifier {
  List<Proveedor> _proveedores = [];
  bool _loading = false;
  String? _error;

  List<Proveedor> get proveedores => _proveedores;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> cargar() async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.get('/proveedores') as List;
      _proveedores = data.map((e) => Proveedor.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<void> crear(Map<String, dynamic> body) async {
    final data = await ApiService.post('/proveedores', body);
    final nuevo = Proveedor.fromJson(data['proveedor'] ?? data);
    _proveedores.insert(0, nuevo);
    notifyListeners();
  }

  Future<void> actualizar(int id, Map<String, dynamic> body) async {
    final data = await ApiService.put('/proveedores/$id', body);
    final updated = Proveedor.fromJson(data['proveedor'] ?? data);
    final i = _proveedores.indexWhere((e) => e.id == id);
    if (i != -1) { _proveedores[i] = updated; notifyListeners(); }
  }

  Future<void> cambiarEstado(int id, String nuevoEstado) async {
    final p = _proveedores.firstWhere((e) => e.id == id);
    await actualizar(id, {...p.toJson(), 'estado': nuevoEstado});
  }

  Future<void> eliminar(int id) async {
    await ApiService.delete('/proveedores/$id');
    _proveedores.removeWhere((e) => e.id == id);
    notifyListeners();
  }
}
