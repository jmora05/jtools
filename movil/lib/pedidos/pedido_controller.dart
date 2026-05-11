// pedido_controller.dart
import 'package:flutter/material.dart';
import 'pedido_model.dart';

class PedidoController extends ChangeNotifier {
  final List<Pedido> _pedidos = [];

  PedidoController() {
    // Datos de ejemplo para mostrar igual que la imagen
    _pedidos.addAll([
      Pedido(
        id: '12345',
        fecha: DateTime(2024, 10, 20),
        estado: 'Entregado',
        cliente: 'Lucas',
        items: [
          PedidoItem(nombre: 'Filtro de Aceite', precio: 12.0, cantidad: 3),
        ],
        envio: EnviosInfo(
          direccion: 'Calle 123, Ciudad',
          metodoPago: 'Tarjeta de Crédito',
          costo: 8.0,
        ),
      ),
      Pedido(
        id: '12346',
        fecha: DateTime(2024, 10, 15),
        estado: 'Pendiente',
        cliente: 'Sofía',
        items: [
          PedidoItem(nombre: 'Batería de Coche', precio: 110.0, cantidad: 2),
        ],
        envio: EnviosInfo(
          direccion: 'Av. Principal 45',
          metodoPago: 'Efectivo',
          costo: 5.0,
        ),
      ),
      Pedido(
        id: '12347',
        fecha: DateTime(2024, 9, 25),
        estado: 'Cancelado',
        cliente: 'Mateo',
        items: [
          PedidoItem(nombre: 'Líquido de Frenos', precio: 18.0, cantidad: 5),
        ],
        envio: EnviosInfo(
          direccion: 'Cll. Secundaria 12',
          metodoPago: 'Tarjeta de Débito',
          costo: 6.0,
        ),
      ),
      Pedido(
        id: '12348',
        fecha: DateTime(2024, 9, 5),
        estado: 'Entregado',
        cliente: 'Isabella',
        items: [
          PedidoItem(nombre: 'Juego de Pastillas', precio: 45.0, cantidad: 1),
        ],
        envio: EnviosInfo(
          direccion: 'Zona Norte 88',
          metodoPago: 'Transferencia',
          costo: 7.0,
        ),
      ),
    ]);
  }

  List<Pedido> get pedidos => List.unmodifiable(_pedidos);

  List<Pedido> pedidosFiltrados({String estado = 'Todos'}) {
    if (estado == 'Todos') return pedidos;
    return _pedidos.where((p) => p.estado == estado).toList();
  }

  void registrarPedido(Pedido pedido) {
    _pedidos.insert(0, pedido);
    notifyListeners();
  }

  void editarPedido(Pedido original, Pedido actualizado) {
    final idx = _pedidos.indexOf(original);
    if (idx >= 0) {
      _pedidos[idx] = actualizado;
      notifyListeners();
    }
  }

  void cambiarEstado(Pedido pedido, String nuevoEstado) {
    final idx = _pedidos.indexOf(pedido);
    if (idx >= 0) {
      _pedidos[idx].estado = nuevoEstado;
      notifyListeners();
    }
  }

  void cancelarPedido(Pedido pedido) {
    cambiarEstado(pedido, 'Cancelado');
  }

  void eliminarPedido(Pedido pedido) {
    _pedidos.remove(pedido);
    notifyListeners();
  }
}
