class DetalleVenta {
  final int id;
  final int productosId;
  final int cantidad;
  final double precio;
  final String? nombreProducto;
  final String? referencia;

  const DetalleVenta({
    required this.id,
    required this.productosId,
    required this.cantidad,
    required this.precio,
    this.nombreProducto,
    this.referencia,
  });

  double get subtotal => cantidad * precio;

  factory DetalleVenta.fromJson(Map<String, dynamic> j) {
    final prod = j['producto'] as Map<String, dynamic>?;
    return DetalleVenta(
      id:             j['id'] as int,
      productosId:    j['productosId'] as int,
      cantidad:       (double.tryParse(j['cantidad']?.toString() ?? '1') ?? 1).round(),
      precio:         double.tryParse(j['precio']?.toString() ?? '0') ?? 0,
      nombreProducto: prod?['nombreProducto']?.toString(),
      referencia:     prod?['referencia']?.toString(),
    );
  }
}

class ClienteResumen {
  final int id;
  final String nombres;
  final String apellidos;
  final String email;
  final String telefono;

  const ClienteResumen({
    required this.id,
    required this.nombres,
    required this.apellidos,
    required this.email,
    required this.telefono,
  });

  String get nombreCompleto => '$nombres $apellidos'.trim();

  factory ClienteResumen.fromJson(Map<String, dynamic> j) => ClienteResumen(
    id:        j['id'] as int,
    nombres:   j['nombres']?.toString() ?? '',
    apellidos: j['apellidos']?.toString() ?? '',
    email:     j['email']?.toString() ?? '',
    telefono:  j['telefono']?.toString() ?? '',
  );
}

class Venta {
  final int id;
  final int clientesId;
  final String fecha;
  final String metodoPago;
  final String tipoVenta; // 'directa' | 'pedido'
  final double total;
  final String estado;    // 'activa' | 'pendiente' | 'anulada'
  final ClienteResumen? cliente;
  final List<DetalleVenta> detalles;

  static const estadoLabel = {
    'activa':    'Activa',
    'pendiente': 'Pendiente',
    'anulada':   'Anulada',
  };

  const Venta({
    required this.id,
    required this.clientesId,
    required this.fecha,
    required this.metodoPago,
    required this.tipoVenta,
    required this.total,
    required this.estado,
    this.cliente,
    this.detalles = const [],
  });

  factory Venta.fromJson(Map<String, dynamic> j) => Venta(
    id:          j['id'] as int,
    clientesId:  j['clientesId'] as int,
    fecha:       j['fecha']?.toString() ?? '',
    metodoPago:  j['metodoPago']?.toString() ?? '',
    tipoVenta:   j['tipoVenta']?.toString() ?? 'pedido',
    total:       double.tryParse(j['total']?.toString() ?? '0') ?? 0,
    estado:      j['estado']?.toString() ?? 'pendiente',
    cliente:     j['cliente'] != null
      ? ClienteResumen.fromJson(j['cliente'] as Map<String, dynamic>) : null,
    detalles:    (j['detalles'] as List? ?? [])
      .map((d) => DetalleVenta.fromJson(d as Map<String, dynamic>)).toList(),
  );
}
