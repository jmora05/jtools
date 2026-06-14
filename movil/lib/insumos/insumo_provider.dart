import 'package:flutter/material.dart';
import '../core/api_service.dart';
import 'insumo_model.dart';

class InsumoProvider extends ChangeNotifier {
  List<Insumo> _insumos = [];
  bool _loading = false;
  String? _error;

  List<Insumo> get insumos => _insumos;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> cargar() async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.get('/insumos') as List;
      _insumos = data.map((e) => Insumo.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<void> crear(Map<String, dynamic> body) async {
    final data = await ApiService.post('/insumos', body);
    final nuevo = Insumo.fromJson(data['insumo'] ?? data);
    _insumos.insert(0, nuevo);
    notifyListeners();
  }

  Future<void> actualizar(int id, Map<String, dynamic> body) async {
    final data = await ApiService.put('/insumos/$id', body);
    final updated = Insumo.fromJson(data['insumo'] ?? data);
    final i = _insumos.indexWhere((e) => e.id == id);
    if (i != -1) { _insumos[i] = updated; notifyListeners(); }
  }

  Future<void> cambiarEstado(int id, String nuevoEstado) async {
    final data = await ApiService.patch('/insumos/$id/estado', {'estado': nuevoEstado});
    final updated = Insumo.fromJson(data['insumo'] ?? data);
    final i = _insumos.indexWhere((e) => e.id == id);
    if (i != -1) { _insumos[i] = updated; notifyListeners(); }
  }

  // Soft delete: backend marca el insumo como 'agotado'
  Future<void> eliminar(int id) async {
    await ApiService.delete('/insumos/$id');
    final i = _insumos.indexWhere((e) => e.id == id);
    if (i != -1) {
      final old = _insumos[i];
      _insumos[i] = Insumo(
        id:             old.id,
        nombreInsumo:   old.nombreInsumo,
        descripcion:    old.descripcion,
        codigoInsumo:   old.codigoInsumo,
        unidadMedida:   old.unidadMedida,
        precioUnitario: old.precioUnitario,
        cantidad:       old.cantidad,
        estado:         'agotado',
        proveedoresId:  old.proveedoresId,
      );
      notifyListeners();
    }
  }

  // Hard delete: solo si está agotado y sin dependencias
  Future<void> forceDelete(int id) async {
    await ApiService.delete('/insumos/$id/force');
    _insumos.removeWhere((e) => e.id == id);
    notifyListeners();
  }

  // Verifica si el insumo tiene dependencias antes de eliminar
  Future<Map<String, dynamic>> getDependencias(int id) async {
    final data = await ApiService.get('/insumos/$id/dependencias');
    return data as Map<String, dynamic>;
  }
}
