import 'package:flutter/material.dart';
import '../core/api_service.dart';
import 'cliente_model.dart';

class ClienteProvider extends ChangeNotifier {
  List<Cliente> _clientes = [];
  bool _loading = false;
  String? _error;

  List<Cliente> get clientes => _clientes;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> cargar() async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.get('/clientes') as List;
      _clientes = data.map((e) => Cliente.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<Cliente> cargarDetalle(int id) async {
    final data = await ApiService.get('/clientes/$id');
    return Cliente.fromJson(data);
  }

  Future<Map<String, dynamic>> cargarHistorial(int id) async {
    final data = await ApiService.get('/clientes/$id/historial');
    return data as Map<String, dynamic>;
  }

  Future<void> crear(Map<String, dynamic> body) async {
    final data = await ApiService.post('/clientes', body);
    final nuevo = Cliente.fromJson(data['cliente'] ?? data);
    _clientes.insert(0, nuevo);
    notifyListeners();
  }

  Future<void> actualizar(int id, Map<String, dynamic> body) async {
    final data = await ApiService.put('/clientes/$id', body);
    final actualizado = Cliente.fromJson(data['cliente'] ?? data);
    final i = _clientes.indexWhere((c) => c.id == id);
    if (i != -1) { _clientes[i] = actualizado; notifyListeners(); }
  }

  Future<void> cambiarEstado(int id, String nuevoEstado) async {
    final c = _clientes.firstWhere((e) => e.id == id);
    await actualizar(id, {...c.toJson(), 'estado': nuevoEstado});
  }

  Future<void> eliminar(int id) async {
    await ApiService.delete('/clientes/$id');
    _clientes.removeWhere((c) => c.id == id);
    notifyListeners();
  }
}
