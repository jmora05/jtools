// pedido_model.dart
class Pedido {
  String id;
  DateTime fecha;
  String estado; // e.g. "Pendiente", "Entregado", "Cancelado", "Enviado"
  String cliente;
  List<PedidoItem> items;
  EnviosInfo envio;

  Pedido({
    required this.id,
    required this.fecha,
    required this.estado,
    required this.cliente,
    required this.items,
    required this.envio,
  });

  double get subtotal =>
      items.fold(0.0, (s, it) => s + (it.precio * it.cantidad));

  double get envioCosto => envio.costo;
  double get total => subtotal + envioCosto;
}

class PedidoItem {
  String nombre;
  double precio;
  int cantidad;

  PedidoItem({
    required this.nombre,
    required this.precio,
    this.cantidad = 1,
  });
}

class EnviosInfo {
  final String direccion;
  final String metodoPago;
  final double costo;

  EnviosInfo({
    required this.direccion,
    required this.metodoPago,
    required this.costo,
  });
}
