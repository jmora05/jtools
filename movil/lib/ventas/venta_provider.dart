import 'package:flutter/material.dart';
import '../core/api_service.dart';
import 'venta_model.dart';

class VentaProvider extends ChangeNotifier {
  List<Venta> _ventas = [];
  bool _loading = false;
  String? _error;

  List<Venta> get ventas => _ventas;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> cargar() async {
    _loading = true; _error = null; notifyListeners();
    try {
      final data = await ApiService.get('/ventas') as List;
      _ventas = data.map((e) => Venta.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<Venta> cargarDetalle(int id) async {
    final data = await ApiService.get('/ventas/$id');
    return Venta.fromJson(data);
  }

  Future<void> cambiarEstado(int id, String nuevoEstado) async {
    await ApiService.patch('/ventas/$id/estado', {'estado': nuevoEstado});
    final i = _ventas.indexWhere((v) => v.id == id);
    if (i != -1) {
      final v = _ventas[i];
      _ventas[i] = Venta(
        id: v.id, clientesId: v.clientesId, fecha: v.fecha,
        metodoPago: v.metodoPago, tipoVenta: v.tipoVenta,
        total: v.total, estado: nuevoEstado,
        cliente: v.cliente, detalles: v.detalles,
      );
      notifyListeners();
    }
  }

  Future<void> anular(int id) async {
    await ApiService.patch('/ventas/$id/anular', {});
    final i = _ventas.indexWhere((v) => v.id == id);
    if (i != -1) {
      final v = _ventas[i];
      _ventas[i] = Venta(
        id: v.id, clientesId: v.clientesId, fecha: v.fecha,
        metodoPago: v.metodoPago, tipoVenta: v.tipoVenta,
        total: v.total, estado: 'anulada',
        cliente: v.cliente, detalles: v.detalles,
      );
      notifyListeners();
    }
  }
}
