import 'package:flutter/material.dart';
import '../core/api_service.dart';
import 'compra_model.dart';

class CompraProvider extends ChangeNotifier {
  List<Compra> _compras = [];
  bool _loading = false;
  String? _error;

  List<Compra> get compras => _compras;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> cargar() async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.get('/compras') as List;
      _compras = data.map((e) => Compra.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<Compra> cargarDetalle(int id) async {
    final data = await ApiService.get('/compras/$id');
    return Compra.fromJson(data);
  }

  Future<void> crear({
    required int proveedoresId,
    required String fecha,
    required String metodoPago,
    required List<Map<String, dynamic>> detalles,
    double iva = 19,
    String? numeroFactura,
    String? numeroCompra,
    String? notas,
  }) async {
    final body = <String, dynamic>{
      'proveedoresId': proveedoresId,
      'fecha': fecha,
      'metodoPago': metodoPago,
      'estado': 'pendiente',
      'iva': iva,
      'detalles': detalles,
      if (numeroFactura != null && numeroFactura.trim().isNotEmpty)
        'numeroFactura': numeroFactura.trim(),
      if (numeroCompra != null && numeroCompra.trim().isNotEmpty)
        'numeroCompra': numeroCompra.trim(),
      if (notas != null && notas.trim().isNotEmpty) 'notas': notas.trim(),
    };
    final data = await ApiService.post('/compras', body);
    final nueva = Compra.fromJson(data['compra'] ?? data);
    _compras.insert(0, nueva);
    notifyListeners();
  }

  Future<void> cambiarEstado(int id, String nuevoEstado) async {
    await ApiService.patch('/compras/$id/estado', {'estado': nuevoEstado});
    final i = _compras.indexWhere((c) => c.id == id);
    if (i != -1) {
      final c = _compras[i];
      _compras[i] = Compra(
        id: c.id, proveedoresId: c.proveedoresId, fecha: c.fecha,
        metodoPago: c.metodoPago, estado: nuevoEstado,
        numeroFactura: c.numeroFactura, numeroCompra: c.numeroCompra,
        ivaPorcentaje: c.ivaPorcentaje,
        nombreProveedor: c.nombreProveedor, detalles: c.detalles,
      );
      notifyListeners();
    }
  }

  Future<void> anular(int id) async {
    await ApiService.delete('/compras/$id');
    await cargar();
  }
}
