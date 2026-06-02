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
}
