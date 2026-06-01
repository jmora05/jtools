import 'package:flutter/material.dart';
import '../core/api_service.dart';
import 'nomina_model.dart';

class NominaProvider extends ChangeNotifier {
  List<Nomina> _nominas = [];
  bool _loading = false;
  String? _error;

  List<Nomina> get nominas => _nominas;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> cargar() async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.get('/nomina') as List;
      _nominas = data.map((e) => Nomina.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<void> crear(Map<String, dynamic> body) async {
    final data = await ApiService.post('/nomina', body);
    final nueva = Nomina.fromJson(data['nomina'] ?? data);
    _nominas.insert(0, nueva);
    notifyListeners();
  }

  Future<void> marcarPagada(int id) async {
    await ApiService.put('/nomina/$id/pagar', {});
    final i = _nominas.indexWhere((n) => n.id == id);
    if (i != -1) {
      final n = _nominas[i];
      _nominas[i] = Nomina(
        id: n.id, empleadoId: n.empleadoId, salarioBase: n.salarioBase,
        auxilioTransporte: n.auxilioTransporte, diasTrabajados: n.diasTrabajados,
        fechaInicioPeriodo: n.fechaInicioPeriodo, fechaFinPeriodo: n.fechaFinPeriodo,
        fechaPago: n.fechaPago, pagoNeto: n.pagoNeto, estado: 'pagado',
        nombreEmpleado: n.nombreEmpleado, cargoEmpleado: n.cargoEmpleado,
        documentoEmpleado: n.documentoEmpleado,
      );
      notifyListeners();
    }
  }

  Future<void> eliminar(int id) async {
    await ApiService.delete('/nomina/$id');
    _nominas.removeWhere((n) => n.id == id);
    notifyListeners();
  }
}
