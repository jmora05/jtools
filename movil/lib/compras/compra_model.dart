class DetalleCompra {
  final int? id;
  final int insumosId;
  final int cantidad;
  final double precioUnitario;
  final double cantidadMerma;
  final String? nombreInsumo;
  final String? unidadMedida;

  DetalleCompra({
    this.id,
    required this.insumosId,
    required this.cantidad,
    required this.precioUnitario,
    this.cantidadMerma = 0,
    this.nombreInsumo,
    this.unidadMedida,
  });

  double get subtotal => cantidad * precioUnitario;

  factory DetalleCompra.fromJson(Map<String, dynamic> j) => DetalleCompra(
        id: j['id'] != null ? int.tryParse(j['id'].toString()) : null,
        insumosId: int.tryParse(j['insumosId'].toString()) ?? 0,
        cantidad: (double.tryParse(j['cantidad']?.toString() ?? '0') ?? 0).round(),
        precioUnitario: double.tryParse(j['precioUnitario'].toString()) ?? 0,
        cantidadMerma: double.tryParse(j['cantidadMerma']?.toString() ?? '0') ?? 0,
        nombreInsumo: j['insumo']?['nombreInsumo'],
        unidadMedida: j['insumo']?['unidadMedida'],
      );

  Map<String, dynamic> toJson() => {
        'insumosId': insumosId,
        'cantidad': cantidad,
        'precioUnitario': precioUnitario,
      };
}

class Compra {
  final int id;
  final int proveedoresId;
  final String fecha;
  final String metodoPago;
  final String estado;
  final String? nombreProveedor;
  final List<DetalleCompra> detalles;

  Compra({
    required this.id,
    required this.proveedoresId,
    required this.fecha,
    required this.metodoPago,
    required this.estado,
    this.nombreProveedor,
    this.detalles = const [],
  });

  double get subtotal => detalles.fold(0, (s, d) => s + d.subtotal);
  double get iva => subtotal * 0.19;
  double get total => subtotal + iva;

  static const Map<String, String> estadoLabel = {
    'pendiente': 'Pendiente',
    'en transito': 'En tránsito',
    'completada': 'Completada',
    'anulada': 'Anulada',
  };

  factory Compra.fromJson(Map<String, dynamic> j) => Compra(
        id: int.tryParse(j['id'].toString()) ?? 0,
        proveedoresId: int.tryParse(j['proveedoresId'].toString()) ?? 0,
        fecha: j['fecha']?.toString() ?? '',
        metodoPago: j['metodoPago']?.toString() ?? '',
        estado: j['estado']?.toString() ?? 'pendiente',
        nombreProveedor: j['proveedor']?['nombreEmpresa']?.toString(),
        detalles: (j['detalles'] as List? ?? [])
            .map((d) => DetalleCompra.fromJson(d as Map<String, dynamic>)).toList(),
      );
}
